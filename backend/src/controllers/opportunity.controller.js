const prisma = require('../prisma')
const { matchOpportunity } = require('../services/ai.service')

const getAll = async (req, res) => {
  try {
    const opportunities = await prisma.opportunity.findMany({
      orderBy: { createdAt: 'desc' }
    })
    res.json(opportunities)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener oportunidades' })
  }
}

const getById = async (req, res) => {
  try {
    const { id } = req.params
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: parseInt(id) },
      include: {
        matches: {
          include: { employee: { include: { skills: true, score: true } } },
          orderBy: { matchScore: 'desc' },
          take: 5
        }
      }
    })
    if (!opportunity) return res.status(404).json({ error: 'Oportunidad no encontrada' })
    res.json(opportunity)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener oportunidad' })
  }
}

const create = async (req, res) => {
  try {
    const { title, description, department } = req.body
    const opportunity = await prisma.opportunity.create({
      data: { title, description, department }
    })
    // Matching con IA en segundo plano
    matchOpportunity(opportunity.id).catch(console.error)
    res.status(201).json(opportunity)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al crear oportunidad' })
  }
}

const update = async (req, res) => {
  try {
    const { id } = req.params
    const { title, description, department, isOpen } = req.body
    const opportunity = await prisma.opportunity.update({
      where: { id: parseInt(id) },
      data: { title, description, department, isOpen }
    })
    res.json(opportunity)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al actualizar oportunidad' })
  }
}

const remove = async (req, res) => {
  try {
    const { id } = req.params
    await prisma.opportunity.delete({ where: { id: parseInt(id) } })
    res.json({ message: 'Oportunidad eliminada' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al eliminar oportunidad' })
  }
}

const rematch = async (req, res) => {
  try {
    const { id } = req.params
    await matchOpportunity(parseInt(id))
    res.json({ message: 'Matching ejecutado correctamente' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al ejecutar matching' })
  }
}

module.exports = { getAll, getById, create, update, remove, rematch }