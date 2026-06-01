const express = require('express');
const router = express.Router();
const { getCoordinadores, getCoordinadorById } = require('../controllers/coordinadorController');

// Ruta pública para obtener todos los coordinadores
router.get('/', getCoordinadores);

// Ruta para obtener coordinador por ID
router.get('/:id', getCoordinadorById);

module.exports = router;