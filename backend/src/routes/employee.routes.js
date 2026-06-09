const express = require('express')
const router = express.Router()
const { getAll, getById, create, update, remove } = require('../controllers/employee.controller')
const { verifyToken } = require('../middlewares/auth.middleware')

router.get('/', verifyToken, getAll)
router.get('/:id', verifyToken, getById)
router.post('/', verifyToken, create)
router.put('/:id', verifyToken, update)
router.delete('/:id', verifyToken, remove)

module.exports = router