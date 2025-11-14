// =====================================================
// SERVICIO COMPLETO DE EMAIL CON AWS SES
// src/services/emailService.js
// Adaptado para Sistema de Consorcios
// =====================================================

import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import crypto from 'crypto';

// =====================================================
// CONFIGURACIÓN DE AWS SES
// =====================================================

// Verificar configuración
const hasAWSConfig = process.env.AWS_ACCESS_KEY_ID && 
                    process.env.AWS_SECRET_ACCESS_KEY && 
                    process.env.SES_FROM_EMAIL;

if (!hasAWSConfig) {
  console.warn('⚠️ AWS SES no configurado. Revisa AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY y SES_FROM_EMAIL');
}

// Configurar cliente SES
const sesClient = hasAWSConfig ? new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
}) : null;

// =====================================================
// FUNCIÓN PRINCIPAL DE ENVÍO
// =====================================================

const sendEmail = async (to, subject, htmlBody, textBody = null) => {
  if (!sesClient) {
    console.warn('⚠️ AWS SES no configurado - Email no enviado');
    return null;
  }

  try {
    const params = {
      Source: process.env.SES_FROM_EMAIL,
      Destination: {
        ToAddresses: Array.isArray(to) ? to : [to]
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8'
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: 'UTF-8'
          }
        }
      }
    };

    // Agregar texto plano si está disponible
    if (textBody) {
      params.Message.Body.Text = {
        Data: textBody,
        Charset: 'UTF-8'
      };
    }

    const command = new SendEmailCommand(params);
    const result = await sesClient.send(command);
    
    console.log('✅ Email enviado vía AWS SES:', result.MessageId);
    return result;
    
  } catch (error) {
    console.error('❌ Error al enviar email:', error);
    throw error;
  }
};

// =====================================================
// PLANTILLAS DE EMAIL
// =====================================================

const emailTemplates = {
  invitacion: {
    subject: '🏢 Invitación al Sistema de Consorcios',
    html: (nombre, linkActivacion, rol) => {
      const rolNombres = {
        admin_global: 'Administrador Global',
        tenant_admin: 'Administrador de Tenant',
        admin_consorcio: 'Administrador de Consorcio',
        admin_edificio: 'Administrador de Edificio',
        propietario: 'Propietario',
        inquilino: 'Inquilino',
        proveedor: 'Proveedor'
      };

      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Invitación al Sistema</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🏢 Sistema de Consorcios</h1>
          </div>
          
          <div style="background: white; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <p style="font-size: 18px; margin-bottom: 20px;">¡Hola ${nombre}!</p>
            
            <p style="font-size: 16px; margin-bottom: 30px;">
              Has sido invitado/a a formar parte del Sistema de Gestión de Consorcios.
            </p>
            
            <div style="background: #f0f4ff; padding: 20px; border-left: 4px solid #667eea; border-radius: 5px; margin: 30px 0;">
              <p style="margin: 0; font-size: 16px;">
                <strong>📋 Rol asignado:</strong> ${rolNombres[rol] || rol}
              </p>
            </div>
            
            <p style="font-size: 16px;">
              Para activar tu cuenta, simplemente hacé clic en el siguiente botón:
            </p>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${linkActivacion}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        display: inline-block; 
                        font-weight: bold; 
                        font-size: 16px;">
                🔐 Activar mi cuenta
              </a>
            </div>
            
            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 30px 0;">
              <p style="margin: 0; font-size: 14px; color: #856404;">
                <strong>⚠️ Importante:</strong>
              </p>
              <ul style="margin: 10px 0; padding-left: 20px; color: #856404;">
                <li>Este link es válido por <strong>7 días</strong></li>
                <li>Debes usar la cuenta de Google asociada al email: <strong>${linkActivacion.split('?')[0].split('/').pop()}</strong></li>
              </ul>
            </div>
            
            <p style="color: #666; font-size: 14px; text-align: center; margin-top: 30px;">
              Si no esperabas esta invitación, podés ignorar este email.
            </p>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0;">
                Sistema de Consorcios © ${new Date().getFullYear()}<br>
                Este es un email automático, por favor no respondas.
              </p>
            </div>
          </div>
        </body>
        </html>
      `;
    }
  },

  bienvenida: {
    subject: '👋 ¡Bienvenido al Sistema de Consorcios!',
    html: (nombre) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Bienvenido</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">¡Bienvenido ${nombre}! 🚀</h1>
        </div>
        
        <div style="background: white; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <p style="font-size: 18px; margin-bottom: 30px;">
            ¡Tu cuenta ha sido activada exitosamente! Ya podés acceder a todas las funcionalidades del sistema.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/login" 
               style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 25px; 
                      display: inline-block; 
                      font-weight: bold; 
                      font-size: 16px;">
              🏁 Ir al Sistema
            </a>
          </div>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              Sistema de Consorcios © ${new Date().getFullYear()}
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  },

  recuperacionPassword: {
    subject: '🔑 Restablecer contraseña',
    html: (nombre, resetUrl) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Restablecer Contraseña</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🔑 Restablecer Contraseña</h1>
        </div>

        <div style="background: white; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <p style="font-size: 18px; margin-bottom: 20px;">Hola ${nombre},</p>

          <p style="font-size: 16px; margin-bottom: 30px;">
            Recibimos una solicitud para restablecer la contraseña de tu cuenta. Hacé clic en el botón de abajo para crear una nueva contraseña:
          </p>

          <div style="text-align: center; margin: 40px 0;">
            <a href="${resetUrl}"
               style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                      color: white;
                      padding: 15px 30px;
                      text-decoration: none;
                      border-radius: 25px;
                      display: inline-block;
                      font-weight: bold;
                      font-size: 16px;">
              🔄 Restablecer Contraseña
            </a>
          </div>

          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 30px 0;">
            <p style="margin: 0; font-size: 14px; color: #856404;">
              ⚠️ <strong>Importante:</strong> Este enlace expira en <strong>1 hora</strong> por motivos de seguridad.
            </p>
          </div>

          <div style="background-color: #f0f4ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #666;">
              <strong>¿No puedes hacer clic en el botón?</strong><br>
              Copia y pega este enlace en tu navegador:<br>
              <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a>
            </p>
          </div>

          <p style="color: #666; font-size: 14px; text-align: center; margin-top: 30px;">
            Si no solicitaste este cambio, podés ignorar este email de forma segura. Tu contraseña no será cambiada.
          </p>

          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              Sistema de Consorcios © ${new Date().getFullYear()}<br>
              Este es un email automático, por favor no respondas.
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  },

  aprobacion: {
    subject: '✅ Tu cuenta ha sido aprobada',
    html: (nombre) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Cuenta Aprobada</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">✅ ¡Cuenta Aprobada!</h1>
        </div>

        <div style="background: white; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <p style="font-size: 18px; margin-bottom: 20px;">¡Hola ${nombre}!</p>

          <p style="font-size: 16px; margin-bottom: 30px;">
            ¡Excelentes noticias! Tu cuenta ha sido aprobada por el administrador y ya podés acceder al Sistema de Gestión de Consorcios.
          </p>

          <div style="text-align: center; margin: 40px 0;">
            <a href="${process.env.FRONTEND_URL}/login"
               style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
                      color: white;
                      padding: 15px 30px;
                      text-decoration: none;
                      border-radius: 25px;
                      display: inline-block;
                      font-weight: bold;
                      font-size: 16px;">
              🚀 Acceder al Sistema
            </a>
          </div>

          <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 8px; margin: 30px 0;">
            <p style="margin: 0; font-size: 14px; color: #155724;">
              <strong>✨ Ya podés:</strong>
            </p>
            <ul style="margin: 10px 0; padding-left: 20px; color: #155724;">
              <li>Iniciar sesión con tu cuenta</li>
              <li>Acceder a todas las funcionalidades del sistema</li>
              <li>Gestionar tus consorcios y unidades</li>
            </ul>
          </div>

          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              Sistema de Consorcios © ${new Date().getFullYear()}<br>
              Este es un email automático, por favor no respondas.
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  },

  rechazo: {
    subject: '❌ Solicitud de cuenta rechazada',
    html: (nombre, motivo) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Solicitud Rechazada</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Solicitud Rechazada</h1>
        </div>

        <div style="background: white; padding: 40px 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <p style="font-size: 18px; margin-bottom: 20px;">Hola ${nombre},</p>

          <p style="font-size: 16px; margin-bottom: 30px;">
            Lamentamos informarte que tu solicitud de acceso al Sistema de Gestión de Consorcios no ha sido aprobada.
          </p>

          ${motivo ? `
            <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 8px; margin: 30px 0;">
              <p style="margin: 0; font-size: 14px; color: #721c24;">
                <strong>Motivo:</strong><br>
                ${motivo}
              </p>
            </div>
          ` : ''}

          <p style="font-size: 16px; margin-top: 30px;">
            Si creés que esto es un error o necesitás más información, por favor contactá al administrador del sistema.
          </p>

          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              Sistema de Consorcios © ${new Date().getFullYear()}<br>
              Este es un email automático, por favor no respondas.
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  }
};

// =====================================================
// FUNCIONES PÚBLICAS
// =====================================================

/**
 * Enviar email de invitación
 */
export const enviarEmailInvitacion = async (email, nombre, linkActivacion, rol) => {
  try {
    const htmlBody = emailTemplates.invitacion.html(nombre, linkActivacion, rol);
    const result = await sendEmail(email, emailTemplates.invitacion.subject, htmlBody);
    
    console.log('✅ Email de invitación enviado a:', email);
    return {
      success: true,
      messageId: result?.MessageId
    };
  } catch (error) {
    console.error('❌ Error enviando email de invitación:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Enviar email de bienvenida
 */
export const enviarEmailBienvenida = async (email, nombre) => {
  try {
    const htmlBody = emailTemplates.bienvenida.html(nombre);
    const result = await sendEmail(email, emailTemplates.bienvenida.subject, htmlBody);
    
    console.log('✅ Email de bienvenida enviado a:', email);
    return {
      success: true,
      messageId: result?.MessageId
    };
  } catch (error) {
    console.error('❌ Error enviando email de bienvenida:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Enviar email de recuperación de contraseña
 */
export const enviarEmailRecuperacion = async (email, nombre, resetLink) => {
  try {
    const htmlBody = emailTemplates.recuperacionPassword.html(nombre, resetLink);
    const result = await sendEmail(email, emailTemplates.recuperacionPassword.subject, htmlBody);

    console.log('✅ Email de recuperación enviado a:', email);
    return {
      success: true,
      messageId: result?.MessageId
    };
  } catch (error) {
    console.error('❌ Error enviando email de recuperación:', error);
    throw error;
  }
};

/**
 * Enviar email de aprobación de cuenta
 */
export const enviarEmailAprobacion = async (email, nombre) => {
  try {
    const htmlBody = emailTemplates.aprobacion.html(nombre);
    const result = await sendEmail(email, emailTemplates.aprobacion.subject, htmlBody);

    console.log('✅ Email de aprobación enviado a:', email);
    return {
      success: true,
      messageId: result?.MessageId
    };
  } catch (error) {
    console.error('❌ Error enviando email de aprobación:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Enviar email de rechazo de cuenta
 */
export const enviarEmailRechazo = async (email, nombre, motivo = '') => {
  try {
    const htmlBody = emailTemplates.rechazo.html(nombre, motivo);
    const result = await sendEmail(email, emailTemplates.rechazo.subject, htmlBody);

    console.log('✅ Email de rechazo enviado a:', email);
    return {
      success: true,
      messageId: result?.MessageId
    };
  } catch (error) {
    console.error('❌ Error enviando email de rechazo:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// =====================================================
// VALIDAR CONFIGURACIÓN
// =====================================================

export const validateEmailConfig = () => {
  const errors = [];

  if (!process.env.SES_FROM_EMAIL) {
    errors.push('SES_FROM_EMAIL no configurado');
  }

  if (!process.env.AWS_ACCESS_KEY_ID) {
    errors.push('AWS_ACCESS_KEY_ID no configurado');
  }

  if (!process.env.AWS_SECRET_ACCESS_KEY) {
    errors.push('AWS_SECRET_ACCESS_KEY no configurado');
  }

  if (errors.length > 0) {
    console.warn('⚠️ Configuración de AWS SES incompleta:');
    errors.forEach(error => console.warn(`  - ${error}`));
    return false;
  }

  console.log('✅ Configuración de AWS SES válida');
  return true;
};

// Validar configuración al importar
validateEmailConfig();

export default {
  sendEmail,
  enviarEmailInvitacion,
  enviarEmailBienvenida,
  enviarEmailRecuperacion,
  enviarEmailAprobacion,
  enviarEmailRechazo,
  validateEmailConfig
};