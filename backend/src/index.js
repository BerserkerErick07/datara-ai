require('dotenv').config()
const express = require('express')
const cors = require('cors')

const authRoutes = require('./routes/auth.routes')
const employeeRoutes = require('./routes/employee.routes')
const opportunityRoutes = require('./routes/opportunity.routes')

const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Datara AI backend corriendo' })
})

app.use('/api/auth', authRoutes)
app.use('/api/employees', employeeRoutes)
app.use('/api/opportunities', opportunityRoutes)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})