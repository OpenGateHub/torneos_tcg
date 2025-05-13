const nodemailer = require('nodemailer');

const enviarEmail = async ({ email, asunto, mensaje, nombreUsuario, url }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.verify();
    console.log("✔️ Conexión con el servidor SMTP exitosa");

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>${asunto}</title>
      </head>
      <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background-color: #fff; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
          <h2 style="color: #222;">👋 Hola ${nombreUsuario},</h2>
          <p style="color: #333; font-size: 16px; line-height: 1.5;">
            ${mensaje}
          </p>
          ${
            url
              ? `<div style="text-align: center; margin: 30px 0;">
                    <a href="${url}" style="background-color: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
                      Ir al enlace
                    </a>
                 </div>`
              : ''
          }
          <p style="color: #888; font-size: 12px;">Este correo se generó automáticamente. No respondas.</p>
        </div>
      </body>
      </html>
    `;

    await transporter.sendMail({
      from: '"Torneos TCG" <no-reply@torneostcg.com>',
      to: email,
      subject: asunto,
      text: mensaje, // Versión de texto plano
      html: html
    });

    console.log(`📤 Email enviado a ${email}`);
  } catch (error) {
    console.error('❌ Error al enviar el email:', error);
  }
};

module.exports = enviarEmail;
