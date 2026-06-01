const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUnificado,
  getCurrentUser  // ← Agregar esta función
} = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

// Rutas públicas
router.post('/register', registerUser);
router.post('/login', loginUnificado);

// Ruta protegida - Obtener usuario actual
router.get('/me', protect, getCurrentUser);

module.exports = router;