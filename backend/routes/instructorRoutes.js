const express = require('express');
const router = express.Router();
const { getInstructoresPorOferta } = require('../controllers/instructorController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/oferta/:ofertaId', protect, getInstructoresPorOferta);

module.exports = router;