const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Funcionario = require('../models/Funcionario');
const Coordinador = require('../models/Coordinador');
const PasswordReset = require('../models/PasswordReset');
const { enviarCorreoRecuperacion } = require('../utils/emailService');

// Solicitar recuperación
const solicitarRecuperacion = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'El correo es obligatorio' });
    }
    
    // Buscar usuario en las tres colecciones
    let usuario = await User.findOne({ correoElectronico: email });
    let nombre = usuario?.nombre;
    
    if (!usuario) {
      usuario = await Funcionario.findOne({ correoElectronico: email });
      nombre = usuario?.nombre;
    }
    
    if (!usuario) {
      usuario = await Coordinador.findOne({ correoElectronico: email });
      nombre = usuario?.nombre;
    }
    
    // Siempre responder éxito por seguridad (no revelar si el email existe)
    if (!usuario) {
      return res.json({
        success: true,
        message: 'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña'
      });
    }
    
    // Generar token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Guardar token
    await PasswordReset.create({ email, token });
    
    // Enviar correo
    await enviarCorreoRecuperacion(email, token, nombre);
    
    res.json({
      success: true,
      message: 'Revisa tu correo electrónico para restablecer tu contraseña'
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Error al procesar la solicitud' });
  }
};

// Verificar token
const verificarToken = async (req, res) => {
  try {
    const { token } = req.params;
    
    const resetToken = await PasswordReset.findOne({ token });
    
    if (!resetToken) {
      return res.status(400).json({ success: false, message: 'El enlace es inválido o ha expirado' });
    }
    
    res.json({ success: true, message: 'Token válido', email: resetToken.email });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Error al verificar el token' });
  }
};

// Restablecer contraseña
const restablecerPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ success: false, message: 'Token y contraseña son obligatorios' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres' });
    }
    
    const resetToken = await PasswordReset.findOne({ token });
    
    if (!resetToken) {
      return res.status(400).json({ success: false, message: 'El enlace es inválido o ha expirado' });
    }
    
    const { email } = resetToken;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Actualizar en la colección correcta
    let actualizado = false;
    
    let usuario = await User.findOne({ correoElectronico: email });
    if (usuario) {
      usuario.password = hashedPassword;
      await usuario.save();
      actualizado = true;
    }
    
    if (!actualizado) {
      usuario = await Funcionario.findOne({ correoElectronico: email });
      if (usuario) {
        usuario.password = hashedPassword;
        await usuario.save();
        actualizado = true;
      }
    }
    
    if (!actualizado) {
      usuario = await Coordinador.findOne({ correoElectronico: email });
      if (usuario) {
        usuario.password = hashedPassword;
        await usuario.save();
        actualizado = true;
      }
    }
    
    if (!actualizado) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    
    // Eliminar token usado
    await PasswordReset.deleteOne({ token });
    
    res.json({ success: true, message: 'Contraseña restablecida exitosamente' });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Error al restablecer la contraseña' });
  }
};

module.exports = { solicitarRecuperacion, verificarToken, restablecerPassword };