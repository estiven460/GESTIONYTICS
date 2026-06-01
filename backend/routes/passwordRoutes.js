const express = require('express');
const router = express.Router();
const { solicitarRecuperacion, verificarToken, restablecerPassword } = require('../controllers/passwordController');

router.post('/solicitar', solicitarRecuperacion);
router.get('/verificar/:token', verificarToken);
router.post('/restablecer', restablecerPassword);

module.exports = router;