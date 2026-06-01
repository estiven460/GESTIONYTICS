const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('📧 Configurando envío de correos...');
console.log('📧 EMAIL_USER:', process.env.EMAIL_USER);
console.log('📧 EMAIL_PASS configurado:', process.env.EMAIL_PASS ? '✅ Sí' : '❌ No');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const enviarCorreoRecuperacion = async (email, token, nombre) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/recuperar-password/${token}`;
  
  const mailOptions = {
    from: `"Gestionytics SENA" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Recuperación de contraseña - Gestionytics',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://www.sena.edu.co/Style%20Library/alayout/images/logoSena.png" alt="Logo SENA" style="width: 100px; height: auto;">
          <h2 style="color: #00643c; margin-top: 10px;">Gestionytics</h2>
        </div>
        <h3 style="color: #333;">Hola ${nombre},</h3>
        <p style="color: #555;">Hemos recibido una solicitud para restablecer tu contraseña.</p>
        <p style="color: #555;">Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #00643c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Restablecer Contraseña
          </a>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Correo enviado a:', email);
    console.log('📎 ID del mensaje:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error enviando correo:', error.message);
    return false;
  }
};

module.exports = { enviarCorreoRecuperacion };