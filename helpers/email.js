const nodemailer = require('nodemailer');

const enviarEmail = async ({ email, asunto, mensaje }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true, // true si usás puerto 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: '"Torneos TCG" <no-reply@torneostcg.com>',
      to: email,
      subject: asunto,
      text: mensaje
    });

    console.log(`📤 Email enviado a ${email}`);
  } catch (error) {
    console.error('❌ Error al enviar el email:', error);
  }
};

module.exports = enviarEmail;
