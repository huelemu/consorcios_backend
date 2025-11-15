import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { sequelize } from '../models/index.js';
import {Usuario} from '../models/usuario.js';
import {Persona} from '../models/persona.js';
import { randomBytes, createHash } from 'crypto'

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_super_seguro_cambiar_en_produccion';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const SALT_ROUNDS = 10;

/**
 * ============================================
 * REGISTRO DE USUARIO LOCAL (email/password)
 * ============================================
 */

export const register = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { 
      nombre, 
      apellido, 
      email, 
      password, 
      documento, 
      telefono,
      username 
    } = req.body;

    // Validaciones básicas
    if (!nombre || !email || !password) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false, 
        message: 'Nombre, email y contraseña son obligatorios' 
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false, 
        message: 'Email inválido' 
      });
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      await transaction.rollback();
      return res.status(400).json({ 
        success: false, 
        message: 'La contraseña debe tener al menos 6 caracteres' 
      });
    }

    // Verificar si el email ya existe
    const existingUser = await Usuario.findOne({ 
      where: { email },
      transaction 
    });

    if (existingUser) {
      await transaction.rollback();
      return res.status(409).json({ 
        success: false, 
        message: 'El email ya está registrado' 
      });
    }

    // Verificar si el username ya existe (si se proporcionó)
    if (username) {
      const existingUsername = await Usuario.findOne({ 
        where: { username },
        transaction 
      });

      if (existingUsername) {
        await transaction.rollback();
        return res.status(409).json({ 
          success: false, 
          message: 'El nombre de usuario ya está en uso' 
        });
      }
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Crear la persona primero
    const nuevaPersona = await Persona.create({
      nombre,
      apellido: apellido || '',
      email,
      documento: documento || null,
      telefono: telefono || null,
      tipo_persona: 'fisica'
    }, { transaction });

    // Crear el usuario
    const nuevoUsuario = await Usuario.create({
      persona_id: nuevaPersona.id,
      username: username || email.split('@')[0], // Si no hay username, usar parte del email
      email,
      password: hashedPassword,
      rol_global: 'usuario_pendiente', // Rol por defecto - sin permisos hasta aprobación
      oauth_provider: 'local',
      activo: false, // Inactivo hasta que el admin lo active
      aprobado: false, // Requiere aprobación del administrador
      email_verificado: false,
      primer_login: true
    }, { transaction });

    await transaction.commit();

    // Generar JWT
    const token = jwt.sign(
      { 
        id: nuevoUsuario.id,
        persona_id: nuevaPersona.id,
        email: nuevoUsuario.email,
        username: nuevoUsuario.username,
        rol: nuevoUsuario.rol_global
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Responder con el token y datos del usuario
    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente. Tu cuenta está pendiente de aprobación.',
      token,
      user: {
        id: nuevoUsuario.id,
        persona_id: nuevaPersona.id,
        email: nuevoUsuario.email,
        username: nuevoUsuario.username,
        nombre: nuevaPersona.nombre,
        apellido: nuevaPersona.apellido,
        rol: nuevoUsuario.rol_global,
        activo: nuevoUsuario.activo,
        aprobado: nuevoUsuario.aprobado,
        primer_login: nuevoUsuario.primer_login
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error en registro:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al registrar usuario',
      error: error.message 
    });
  }
};

/**
 * ============================================
 * LOGIN DE USUARIO LOCAL (email/password)
 * ============================================
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validaciones básicas
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email y contraseña son obligatorios' 
      });
    }

    // Buscar usuario por email con su persona
    const usuario = await Usuario.findOne({ 
      where: { email },
      include: [{ 
        model: Persona, 
        as: 'persona',
        attributes: ['id', 'nombre', 'apellido', 'telefono', 'documento']
      }]
    });

    if (!usuario) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email o contraseña incorrectos' 
      });
    }

    // Verificar que el usuario use autenticación local
    if (usuario.oauth_provider !== 'local') {
      return res.status(400).json({ 
        success: false, 
        message: `Esta cuenta usa autenticación con ${usuario.oauth_provider}. Por favor inicia sesión con ${usuario.oauth_provider}.` 
      });
    }

    // Verificar que el usuario esté aprobado
    if (!usuario.aprobado) {
      return res.status(403).json({
        success: false,
        message: 'Tu cuenta está pendiente de aprobación por el administrador.'
      });
    }

    // Verificar que el usuario esté activo
    if (!usuario.activo) {
      return res.status(403).json({
        success: false,
        message: 'Tu cuenta está inactiva. Contacta al administrador.'
      });
    }

    // Verificar la contraseña
    const passwordMatch = await bcrypt.compare(password, usuario.password);

    if (!passwordMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Email o contraseña incorrectos' 
      });
    }

    // Generar JWT
    const token = jwt.sign(
      { 
        id: usuario.id,
        persona_id: usuario.persona_id,
        email: usuario.email,
        username: usuario.username,
        rol: usuario.rol_global
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Responder con el token y datos del usuario
    res.json({
      success: true,
      message: 'Login exitoso',
      token,
      user: {
        id: usuario.id,
        persona_id: usuario.persona_id,
        email: usuario.email,
        username: usuario.username,
        nombre: usuario.persona.nombre,
        apellido: usuario.persona.apellido,
        rol: usuario.rol_global,
        activo: usuario.activo,
        aprobado: usuario.aprobado,
        primer_login: usuario.primer_login
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al iniciar sesión',
      error: error.message 
    });
  }
};

/**
 * ============================================
 * GOOGLE OAUTH LOGIN
 * ============================================
 */
export const googleLogin = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { credential } = req.body;

    if (!credential) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'No se recibió el credential de Google'
      });
    }

    // Verificar el token de Google
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    
    // Extraer información del usuario de Google
    const googleUser = {
      email: payload.email,
      name: payload.name,
      given_name: payload.given_name,
      family_name: payload.family_name,
      picture: payload.picture,
      sub: payload.sub, // ID único de Google
    };

    // Buscar si el usuario ya existe (por google_id o email)
    let usuario = await Usuario.findOne({
      where: {
        [sequelize.Sequelize.Op.or]: [
          { google_id: googleUser.sub },
          { email: googleUser.email }
        ]
      },
      include: [{ 
        model: Persona, 
        as: 'persona',
        attributes: ['id', 'nombre', 'apellido']
      }],
      transaction
    });

    let persona;
    let isNewUser = false;

    if (!usuario) {
      // Usuario nuevo - crear persona y usuario
      isNewUser = true;

      persona = await Persona.create({
        nombre: googleUser.given_name || googleUser.name,
        apellido: googleUser.family_name || '',
        email: googleUser.email,
        tipo_persona: 'fisica'
      }, { transaction });

      usuario = await Usuario.create({
        persona_id: persona.id,
        username: googleUser.email.split('@')[0],
        email: googleUser.email,
        password: null, // No tiene password porque usa OAuth
        google_id: googleUser.sub,
        oauth_provider: 'google',
        rol_global: 'usuario_pendiente', // Rol por defecto - sin permisos hasta aprobación
        activo: false, // Inactivo hasta que el admin lo active
        aprobado: false, // Requiere aprobación del administrador
        email_verificado: true, // Google ya verificó el email
        primer_login: true
      }, { transaction });

    } else {
      // Usuario existente - actualizar google_id si no lo tenía
      if (!usuario.google_id) {
        await usuario.update({
          google_id: googleUser.sub,
          oauth_provider: 'google',
          email_verificado: true
        }, { transaction });
      }

      persona = usuario.persona;
    }

    await transaction.commit();

    // Generar JWT
    const token = jwt.sign(
      { 
        id: usuario.id,
        persona_id: persona.id,
        email: usuario.email,
        username: usuario.username,
        rol: usuario.rol_global
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Responder con el token y datos del usuario
    res.json({
      success: true,
      message: isNewUser ? 'Usuario registrado exitosamente con Google' : 'Login exitoso con Google',
      token,
      user: {
        id: usuario.id,
        persona_id: persona.id,
        email: usuario.email,
        username: usuario.username,
        nombre: persona.nombre,
        apellido: persona.apellido,
        picture: googleUser.picture, // Avatar de Google
        rol: usuario.rol_global,
        activo: usuario.activo,
        aprobado: usuario.aprobado,
        primer_login: usuario.primer_login,
        isNewUser
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error en Google OAuth:', error);
    res.status(401).json({
      success: false,
      message: 'Error al autenticar con Google',
      error: error.message
    });
  }
};

/**
 * ============================================
 * OBTENER PERFIL DEL USUARIO AUTENTICADO
 * ============================================
 */
export const profile = async (req, res) => {
  try {
    // req.user viene del middleware authenticateToken
    const usuario = await Usuario.findByPk(req.user.id, {
      include: [{ 
        model: Persona, 
        as: 'persona',
        attributes: ['id', 'nombre', 'apellido', 'documento', 'telefono', 'email']
      }],
      attributes: { exclude: ['password'] } // No enviar la contraseña
    });

    if (!usuario) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }

    res.json({
      success: true,
      user: {
        id: usuario.id,
        persona_id: usuario.persona_id,
        email: usuario.email,
        username: usuario.username,
        nombre: usuario.persona.nombre,
        apellido: usuario.persona.apellido,
        documento: usuario.persona.documento,
        telefono: usuario.persona.telefono,
        rol: usuario.rol_global,
        oauth_provider: usuario.oauth_provider,
        email_verificado: usuario.email_verificado,
        activo: usuario.activo,
        aprobado: usuario.aprobado,
        fecha_creacion: usuario.fecha_creacion
      }
    });

  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener perfil',
      error: error.message 
    });
  }
};

/**
 * Solicitar recuperación de contraseña
 * POST /auth/forgot-password
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'El email es requerido'
      });
    }

    console.log('🔍 Buscando usuario con email:', email);

    // Buscar usuario por email
    const usuario = await Usuario.findOne({
      where: { email },
      include: { model: Persona, as: 'persona' }
    });

    if (!usuario) {
      console.log('⚠️ Usuario no encontrado:', email);
      // Por seguridad, no revelar si el usuario existe o no
      return res.json({
        success: true,
        message: 'Si el email existe, recibirás instrucciones para recuperar tu contraseña'
      });
    }

    console.log('✅ Usuario encontrado:', usuario.email);

    // Generar token de recuperación (32 bytes = 64 caracteres hex)
    const resetToken = randomBytes(32).toString('hex');
    
    // Hashear el token antes de guardarlo
    const resetTokenHash = createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Guardar token en base de datos (expira en 1 hora)
    const expiracion = new Date();
    expiracion.setHours(expiracion.getHours() + 1);

    await usuario.update({
      invitacion_token: resetTokenHash,
      invitacion_expira: expiracion
    });

    console.log('💾 Token guardado en DB (hash):', resetTokenHash.substring(0, 20) + '...');
    console.log('⏰ Expira en:', expiracion);

    // Generar link de recuperación (enviamos el token SIN hashear)
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    console.log('🔗 Link generado:', resetLink.substring(0, 80) + '...');

    // Enviar email
    const { enviarEmailRecuperacion } = await import('../services/emailService.js');
    await enviarEmailRecuperacion(
      email,
      usuario.persona.nombre,
      resetLink
    );

    console.log(`✅ Proceso completo - Email enviado a: ${email}`);

    res.json({
      success: true,
      message: 'Si el email existe, recibirás instrucciones para recuperar tu contraseña'
    });

  } catch (error) {
    console.error('❌ Error en forgotPassword:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar la solicitud',
      error: error.message
    });
  }
};

/**
 * Restablecer contraseña con token
 * POST /auth/reset-password
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    console.log('🔍 Iniciando reset password');
    console.log('Token recibido:', token ? token.substring(0, 20) + '...' : 'NO RECIBIDO');

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token y nueva contraseña son requeridos'
      });
    }

    // Validar contraseña
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 8 caracteres'
      });
    }

    // Hash del token recibido para comparar con la DB
    const resetTokenHash = createHash('sha256')
      .update(token)
      .digest('hex');

    console.log('🔐 Token hasheado para buscar:', resetTokenHash.substring(0, 20) + '...');

    // Buscar usuario con token válido y no expirado
    const { Op } = Usuario.sequelize.Sequelize;
    const usuario = await Usuario.findOne({
      where: {
        invitacion_token: resetTokenHash,
        invitacion_expira: {
          [Op.gt]: new Date() // Token no expirado
        }
      }
    });

    if (!usuario) {
      console.log('❌ Token no encontrado o expirado');
      
      // Debug: buscar sin verificar expiración
      const usuarioDebug = await Usuario.findOne({
        where: { invitacion_token: resetTokenHash }
      });
      
      if (usuarioDebug) {
        console.log('⚠️ Token encontrado pero expirado. Expira:', usuarioDebug.invitacion_expira);
      } else {
        console.log('⚠️ Token no existe en la base de datos');
      }
      
      return res.status(400).json({
        success: false,
        message: 'Token inválido o expirado'
      });
    }

    console.log('✅ Token válido, usuario encontrado:', usuario.email);

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña y limpiar token
    await usuario.update({
      password: hashedPassword,
      invitacion_token: null,
      invitacion_expira: null,
      email_verificado: true
    });

    console.log(`✅ Contraseña actualizada para usuario: ${usuario.email}`);

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });

  } catch (error) {
    console.error('❌ Error en resetPassword:', error);
    res.status(500).json({
      success: false,
      message: 'Error al restablecer la contraseña',
      error: error.message
    });
  }
};


/**
 * Verificar si un token es válido
 * GET /auth/verify-reset-token/:token
 */
export const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    console.log('🔍 Verificando token:', token ? token.substring(0, 20) + '...' : 'NO RECIBIDO');

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token no proporcionado'
      });
    }

    // Hash del token
    const resetTokenHash = createHash('sha256')
      .update(token)
      .digest('hex');

    console.log('🔐 Buscando token hasheado:', resetTokenHash.substring(0, 20) + '...');

    // Buscar usuario con token válido
    const { Op } = Usuario.sequelize.Sequelize;
    const usuario = await Usuario.findOne({
      where: {
        invitacion_token: resetTokenHash,
        invitacion_expira: {
          [Op.gt]: new Date()
        }
      }
    });

    if (!usuario) {
      console.log('❌ Token inválido o expirado');
      return res.status(400).json({
        success: false,
        message: 'Token inválido o expirado'
      });
    }

    console.log('✅ Token válido para:', usuario.email);

    res.json({
      success: true,
      message: 'Token válido',
      email: usuario.email
    });

  } catch (error) {
    console.error('❌ Error en verifyResetToken:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar el token'
    });
  }
};

// Alias para callback de Google (mantiene compatibilidad)
export const googleCallback = googleLogin;