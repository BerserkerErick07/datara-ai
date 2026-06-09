const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const prisma = require('../prisma')

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return res.status(400).json({ error: 'El email ya está registrado' })
    }
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword }
    })
    res.status(201).json({ message: 'Usuario creado', userId: user.id })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al registrar usuario' })
  }
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }
    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error al iniciar sesión' })
  }
}

module.exports = { register, login }