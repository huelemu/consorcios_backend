import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { Usuario, Persona } from '../models/index.js';
import { Op } from 'sequelize';
import { enviarEmailInvitacion } from '../services/emailService.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * POST /api/auth/invitar-usuario
 * El admin invita a una persona para que se convierta en usuario
 */
export const invitarUsuario = async (req, res) => {
  try {
    const { persona_id, rol_global } = req.body;

    // Validaciones
    if (!persona_id || !rol_global) {
      return res.status(400).json({ 
        error: 'persona_id y rol_global son obligatorios' 
      });
    }

    // Buscar persona
    const persona = await Persona.findByPk(persona_id);
    if (!persona) {
      return res.status(404).json({ error: 'Persona no encontrada' });
    }

    if (!persona.email) {
      return res.status(400).json({ 
        error: 'La persona debe tener un email para poder invitarla' 
      });
    }

    // Verificar si ya tiene usuario
    const usuarioExistente = await Usuario.findOne({
      where: { persona_id }
    });

    if (usuarioExistente) {
      return res.status(400).json({ 
        error: 'Esta persona ya tiene un usuario asociado' 
      });
    }

    // Generar token único
    const token = crypto.randomBytes(32).toString('hex');
    const expiracion = new Date();
    expiracion.setDate(expiracion.getDate() + 7); // Válido por 7 días

    // Crear usuario pendiente de activación
    const nuevoUsuario = await Usuario.create({
      persona_id,
      email: persona.email,
      username: `${persona.nombre.toLowerCase()}_${persona.id}`,
      password: null, // Sin password porque usa OAuth
      rol_global,
      oauth_provider: 'google',
      invitacion_token: token,
      invitacion_expira: expiracion,
      activo: false,
      primer_login: true
    });

    // Enviar email de invitación
    const linkActivacion = `${process.env.FRONTEND_URL}/auth/activate?token=${token}`;
    
    await enviarEmailInvitacion(
      persona.email,
      persona.nombre,
      linkActivacion,
      rol_global
    );

    res.status(201).json({
      message: 'Invitación enviada exitosamente',
      usuario: {
        id: nuevoUsuario.id,
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol_global,
        invitacion_expira: nuevoUsuario.invitacion_expira
      }
    });

  } catch (error) {
    console.error('Error al invitar usuario:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/auth/verificar-token/:token
 * Verifica si un token de invitación es válido
 */
export const verificarTokenInvitacion = async (req, res) => {
  try {
    const { token } = req.params;

    const usuario = await Usuario.findOne({
      where: {
        invitacion_token: token,
        invitacion_expira: {
          [Op.gt]: new Date()
        }
      },
      include: [{
        model: Persona,
        as: 'persona',
        attributes: ['nombre', 'apellido', 'email']
      }]
    });

    if (!usuario) {
      return res.status(404).json({ 
        error: 'Token inválido o expirado',
        valido: false
      });
    }

    res.json({
      valido: true,
      usuario: {
        nombre: usuario.persona.nombre,
        apellido: usuario.persona.apellido,
        email: usuario.email,
        rol: usuario.rol_global
      }
    });

  } catch (error) {
    console.error('Error al verificar token:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/auth/google/callback
 * Procesa el login/registro con Google
 */
export const googleCallback = async (req, res) => {
  try {
    const { id_token, invitacion_token } = req.body;

    if (!id_token) {
      return res.status(400).json({ error: 'id_token es requerido' });
    }

    // Verificar token de Google
    const ticket = await googleClient.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const googleUser = ticket.getPayload();
    const { email, sub: google_id, name, picture } = googleUser;

    // CASO 1: Usuario viene de invitación
    if (invitacion_token) {
      const usuario = await Usuario.findOne({
        where: {
          invitacion_token,
          invitacion_expira: { [Op.gt]: new Date() }
        },
        include: [{ model: Persona, as: 'persona' }]
      });

      if (!usuario) {
        return res.status(404).json({ 
          error: 'Token de invitación inválido o expirado' 
        });
      }

      // Verificar que el email coincida
      if (usuario.email.toLowerCase() !== email.toLowerCase()) {
        return res.status(400).json({
          error: 'El email de Google no coincide con el email de la invitación',
          esperado: usuario.email,
          recibido: email
        });
      }

      // Activar usuario
      await usuario.update({
        google_id,
        email_verificado: true,
        activo: true,
        primer_login: false,
        invitacion_token: null,
        invitacion_expira: null
      });

      // Generar JWT
      const token = jwt.sign(
        { 
          id: usuario.id, 
          rol: usuario.rol_global,
          persona_id: usuario.persona_id 
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        message: 'Usuario activado exitosamente',
        token,
        usuario: {
          id: usuario.id,
          email: usuario.email,
          nombre: usuario.persona.nombre,
          apellido: usuario.persona.apellido,
          rol: usuario.rol_global,
          primer_login: false
        }
      });
    }

    // CASO 2: Login normal (usuario ya registrado)
    let usuario = await Usuario.findOne({
      where: {
        [Op.or]: [
          { google_id },
          { email: email.toLowerCase(), oauth_provider: 'google' }
        ]
      },
      include: [{ model: Persona, as: 'persona' }]
    });

    if (usuario) {
      // Usuario existe → actualizar google_id si es necesario
      if (!usuario.google_id) {
        await usuario.update({
          google_id,
          email_verificado: true
        });
      }

      // Generar JWT
      const token = jwt.sign(
        { 
          id: usuario.id, 
          rol: usuario.rol_global,
          persona_id: usuario.persona_id 
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        message: 'Login exitoso',
        token,
        usuario: {
          id: usuario.id,
          email: usuario.email,
          nombre: usuario.persona.nombre,
          apellido: usuario.persona.apellido,
          rol: usuario.rol_global,
          primer_login: usuario.primer_login
        }
      });
    }

    // CASO 3: Buscar persona por email y vincular automáticamente
    let persona = await Persona.findOne({ 
      where: { email: email.toLowerCase() } 
    });

    if (persona) {
      // Crear usuario vinculado a la persona existente
      usuario = await Usuario.create({
        persona_id: persona.id,
        email: email.toLowerCase(),
        username: `${persona.nombre.toLowerCase()}_${persona.id}`,
        password: null,
        google_id,
        oauth_provider: 'google',
        email_verificado: true,
        rol_global: 'inquilino', // Rol por defecto
        activo: true,
        primer_login: true
      });

      const token = jwt.sign(
        { 
          id: usuario.id, 
          rol: usuario.rol_global,
          persona_id: usuario.persona_id 
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        message: 'Usuario vinculado exitosamente',
        token,
        usuario: {
          id: usuario.id,
          email: usuario.email,
          nombre: persona.nombre,
          apellido: persona.apellido,
          rol: usuario.rol_global,
          primer_login: true
        }
      });
    }

    // CASO 4: Usuario completamente nuevo (no existe persona ni usuario)
    const [nombre, ...apellidoParts] = name.split(' ');
    const apellido = apellidoParts.join(' ');

    persona = await Persona.create({
      nombre: nombre || name,
      apellido: apellido || '',
      email: email.toLowerCase(),
      tipo_persona: 'fisica'
    });

    usuario = await Usuario.create({
      persona_id: persona.id,
      email: email.toLowerCase(),
      username: `${nombre.toLowerCase()}_${persona.id}`,
      password: null,
      google_id,
      oauth_provider: 'google',
      email_verificado: true,
      rol_global: 'inquilino',
      activo: true,
      primer_login: true
    });

    const token = jwt.sign(
      { 
        id: usuario.id, 
        rol: usuario.rol_global,
        persona_id: usuario.persona_id 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      token,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: persona.nombre,
        apellido: persona.apellido,
        rol: usuario.rol_global,
        primer_login: true
      }
    });

  } catch (error) {
    console.error('Error en Google callback:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/auth/reenviar-invitacion
 * Reenvía una invitación expirada
 */
export const reenviarInvitacion = async (req, res) => {
  try {
    const { usuario_id } = req.body;

    const usuario = await Usuario.findByPk(usuario_id, {
      include: [{ model: Persona, as: 'persona' }]
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (usuario.activo) {
      return res.status(400).json({ 
        error: 'El usuario ya está activo' 
      });
    }

    // Generar nuevo token
    const token = crypto.randomBytes(32).toString('hex');
    const expiracion = new Date();
    expiracion.setDate(expiracion.getDate() + 7);

    await usuario.update({
      invitacion_token: token,
      invitacion_expira: expiracion
    });

    // Reenviar email
    const linkActivacion = `${process.env.FRONTEND_URL}/auth/activate?token=${token}`;
    
    await enviarEmailInvitacion(
      usuario.email,
      usuario.persona.nombre,
      linkActivacion,
      usuario.rol_global
    );

    res.json({
      message: 'Invitación reenviada exitosamente',
      invitacion_expira: expiracion
    });

  } catch (error) {
    console.error('Error al reenviar invitación:', error);
    res.status(500).json({ error: error.message });
  }
};