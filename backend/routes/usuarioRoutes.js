const express = require('express');
const router = express.Router();
const { getInstructoresPorCoordinador, getUsuarioById } = require('../controllers/usuarioController');
const { protect } = require('../middlewares/authMiddleware');

// Ruta para obtener usuario por ID (instructores, coordinadores, funcionarios)
router.get('/:id', protect, getUsuarioById);

// Ruta existente
router.get('/coordinador/:coordinadorId/instructores', protect, getInstructoresPorCoordinador);

module.exports = router;