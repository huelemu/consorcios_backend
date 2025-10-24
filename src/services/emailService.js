import nodemailer from 'nodemailer';

// Configurar transporter (puedes usar Gmail, SendGrid, AWS SES, etc.)
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: process.env.MAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD
  }
});

/**
 * Envía email de invitación para activar cuenta
 */
export const enviarEmailInvitacion = async (email, nombre, linkActivacion, rol) => {
  try {
    const rolNombres = {
      admin_global: 'Administrador Global',
      tenant_admin: 'Administrador de Tenant',
      admin_consorcio: 'Administrador de Consorcio',
      admin_edificio: 'Administrador de Edificio',
      propietario: 'Propietario',
      inquilino: 'Inquilino',
      proveedor: 'Proveedor'
    };

    const mailOptions = {
      from: `"Sistema de Consorcios" <${process.env.MAIL_SENDER || 'no-reply@consorcios.com'}>`,
      to: email,
      subject: '🏢 Invitación al Sistema de Consorcios',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              border-radius: 10px 10px 0 0;
              text-align: center;
            }
            .content {
              background: #f9f9f9;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .button {
              display: inline-block;
              background: #667eea;
              color: white !important;
              padding: 15px 30px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #666;
              font-size: 12px;
            }
            .info-box {
              background: white;
              padding: 15px;
              border-left: 4px solid #667eea;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🏢 Sistema de Consorcios</h1>
          </div>
          <div class="content">
            <h2>¡Hola ${nombre}!</h2>
            <p>Has sido invitado/a a formar parte del Sistema de Gestión de Consorcios.</p>
            
            <div class="info-box">
              <strong>📋 Rol asignado:</strong> ${rolNombres[rol] || rol}
            </div>

            <p>Para activar tu cuenta, simplemente hacé clic en el siguiente botón y autenticarte con tu cuenta de Google:</p>
            
            <div style="text-align: center;">
              <a href="${linkActivacion}" class="button">
                🔐 Activar mi cuenta
              </a>
            </div>

            <p><strong>⚠️ Importante:</strong></p>
            <ul>
              <li>Este link es válido por <strong>7 días</strong></li>
              <li>Debes usar la cuenta de Google asociada al email: <strong>${email}</strong></li>
              <li>Si el link no funciona, copiá y pegá esta URL en tu navegador: ${linkActivacion}</li>
            </ul>

            <p>Si no esperabas esta invitación, podés ignorar este email.</p>

            <p>Saludos,<br><strong>Equipo de Consorcios</strong></p>
          </div>
          <div class="footer">
            <p>Este es un email automático, por favor no respondas a este mensaje.</p>
            <p>&copy; ${new Date().getFullYear()} Sistema de Consorcios. Todos los derechos reservados.</p>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email enviado:', info.messageId);
    return info;

  } catch (error) {
    console.error('❌ Error al enviar email:', error);
    throw error;
  }
};

/**
 * Envía email de bienvenida después del primer login
 */
export const enviarEmailBienvenida = async (email, nombre, rol) => {
  try {
    const mailOptions = {
      from: `"Sistema de Consorcios" <${process.env.MAIL_SENDER || 'no-reply@consorcios.com'}>`,
      to: email,
      subject: '👋 ¡Bienvenido al Sistema de Consorcios!',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>¡Bienvenido/a ${nombre}!</h2>
          <p>Tu cuenta ha sido activada exitosamente.</p>
          <p>Ya podés acceder al sistema y comenzar a gestionar tus consorcios.</p>
          <p><a href="${process.env.FRONTEND_URL}/login" style="background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Ir al Sistema</a></p>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Email de bienvenida enviado');

  } catch (error) {
    console.error('❌ Error al enviar email de bienvenida:', error);
  }
};

export default {
  enviarEmailInvitacion,
  enviarEmailBienvenida
};
