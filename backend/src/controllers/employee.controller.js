const prisma = require('../prisma')
const { analyzeEmployee } = require('../services/ai.service')

const getAll = async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      include: { skills: true, score: true },
      orderBy: { createdAt: 'desc' }
    })
    res.json(employees)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener empleados' })
  }
}

const getById = async (req, res) => {
  try {
    const { id } = req.params
    const employee = await prisma.employee.findUnique({
      where: { id: parseInt(id) },
      include: { skills: true, score: true, matches: { include: { opportunity: true } } }
    })
    if (!employee) return res.status(404).json({ error: 'Empleado no encontrado' })
    res.json(employee)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al obtener empleado' })
  }
}

const create = async (req, res) => {
  try {
    const { name, role, department, description, hiredAt, photoUrl } = req.body
    const employee = await prisma.employee.create({
      data: { name, role, department, description, hiredAt: new Date(hiredAt), photoUrl }
    })
    // Analizar con IA en segundo plano
    analyzeEmployee(employee.id, description).catch(console.error)
    res.status(201).json(employee)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al crear empleado' })
  }
}

const update = async (req, res) => {
  try {
    const { id } = req.params
    const { name, role, department, description, hiredAt, photoUrl } = req.body
    const employee = await prisma.employee.update({
      where: { id: parseInt(id) },
      data: { name, role, department, description, hiredAt: new Date(hiredAt), photoUrl }
    })
    // Re-analizar con IA si cambió la descripción
    if (description) {
      analyzeEmployee(employee.id, description).catch(console.error)
    }
    res.json(employee)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al actualizar empleado' })
  }
}

const remove = async (req, res) => {
  try {
    const { id } = req.params
    await prisma.employee.delete({ where: { id: parseInt(id) } })
    res.json({ message: 'Empleado eliminado' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al eliminar empleado' })
  }
}

module.exports = { getAll, getById, create, update, remove }