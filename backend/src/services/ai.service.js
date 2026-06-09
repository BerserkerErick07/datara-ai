const Anthropic = require('@anthropic-ai/sdk')
const prisma = require('../prisma')

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const analyzeEmployee = async (employeeId, description) => {
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Analiza el siguiente perfil de empleado y responde ÚNICAMENTE con un JSON válido, sin texto adicional, sin markdown, sin bloques de código.

Perfil: "${description}"

El JSON debe tener exactamente esta estructura:
{
  "skills": [
    { "name": "nombre de habilidad", "percentage": 85, "isHidden": false },
    { "name": "nombre de habilidad oculta", "percentage": 90, "isHidden": true }
  ],
  "talentScore": 88,
  "hiddenTalent": "nombre de la principal habilidad oculta",
  "summary": "resumen breve del perfil en 2 oraciones"
}

Genera entre 3 y 5 habilidades. Al menos una debe ser isHidden: true (habilidad no obvia del perfil).`
        }
      ]
    })

    const raw = message.content[0].text.trim()
    const data = JSON.parse(raw)

    // Eliminar skills y score anteriores
    await prisma.skill.deleteMany({ where: { employeeId } })
    await prisma.score.deleteMany({ where: { employeeId } })

    // Guardar nuevas skills
    await prisma.skill.createMany({
      data: data.skills.map(s => ({
        name: s.name,
        percentage: s.percentage,
        isHidden: s.isHidden,
        employeeId
      }))
    })

    // Guardar score
    await prisma.score.create({
      data: {
        talentScore: data.talentScore,
        hiddenTalent: data.hiddenTalent,
        summary: data.summary,
        employeeId
      }
    })

    console.log(`✅ Empleado ${employeeId} analizado correctamente`)
  } catch (error) {
    console.error(`❌ Error analizando empleado ${employeeId}:`, error.message)
  }
}

const matchOpportunity = async (opportunityId) => {
  try {
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: opportunityId }
    })

    const employees = await prisma.employee.findMany({
      include: { skills: true, score: true }
    })

    if (employees.length === 0) return

    const employeeList = employees.map(e => ({
      id: e.id,
      name: e.name,
      role: e.role,
      description: e.description,
      skills: e.skills.map(s => `${s.name} (${s.percentage}%)`).join(', '),
      hiddenTalent: e.score?.hiddenTalent || ''
    }))

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Tienes una oportunidad laboral y una lista de empleados. Responde ÚNICAMENTE con un JSON válido, sin texto adicional, sin markdown, sin bloques de código.

Oportunidad: "${opportunity.title} - ${opportunity.description}"

Empleados:
${JSON.stringify(employeeList, null, 2)}

El JSON debe tener exactamente esta estructura (incluye todos los empleados ordenados por matchScore de mayor a menor):
[
  { "employeeId": 1, "matchScore": 94, "justification": "razón breve de por qué encaja" },
  { "employeeId": 2, "matchScore": 78, "justification": "razón breve" }
]`
        }
      ]
    })

    const raw = message.content[0].text.trim()
    const matches = JSON.parse(raw)

    // Eliminar matches anteriores para esta oportunidad
    await prisma.opportunityMatch.deleteMany({ where: { opportunityId } })

    // Guardar nuevos matches
    await prisma.opportunityMatch.createMany({
      data: matches.map(m => ({
        matchScore: m.matchScore,
        justification: m.justification,
        employeeId: m.employeeId,
        opportunityId
      }))
    })

    console.log(`✅ Matching de oportunidad ${opportunityId} completado`)
  } catch (error) {
    console.error(`❌ Error en matching de oportunidad ${opportunityId}:`, error.message)
  }
}

module.exports = { analyzeEmployee, matchOpportunity }