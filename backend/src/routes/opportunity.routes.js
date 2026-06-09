const express = require('express')
const router = express.Router()
const { getAll, getById, create, update, remove, rematch } = require('../controllers/opportunity.controller')
const { verifyToken } = require('../middlewares/auth.middleware')

router.get('/', verifyToken, getAll)
router.get('/:id', verifyToken, getById)
router.post('/', verifyToken, create)
router.put('/:id', verifyToken, update)
router.delete('/:id', verifyToken, remove)
router.post('/:id/rematch', verifyToken, rematch)

module.exports = router