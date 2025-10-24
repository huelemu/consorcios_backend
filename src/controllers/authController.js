import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { Usuario } from '../models/usuario.js';
import { Persona } from '../models/persona.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_super_seguro';

/**
 * POST /auth/google
 * Autentica usuario con token de Google
 */
export const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    console.log('📥 Recibiendo solicitud de Google Login');

    if (!credential) {
      return res.status(400).json({ message: 'Token de Google requerido' });
    }

    console.log('🔍 Verificando token de Google...');

    // Verificar token de Google
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    console.log('✅ Token verificado:', { email, name });

    // Buscar usuario por email
    let usuario = await Usuario.findOne({
      where: { email },
      include: [{ model: Persona, as: 'persona' }]
    });

    if (!usuario) {
      console.log('👤 Usuario no existe, creando nuevo...');

      // Separar nombre y apellido
      const [nombre, ...apellidoParts] = name.split(' ');
      const apellido = apellidoParts.join(' ') || '';

      // Crear persona
      const persona = await Persona.create({
        nombre,
        apellido,
        email,
        tipo_persona: 'fisica'
      });

      console.log('✅ Persona creada:', persona.id);

      // Crear usuario
      usuario = await Usuario.create({
        persona_id: persona.id,
        username: email.split('@')[0],
        email,
        password: null,  // OAuth no usa password
        rol_global: 'inquilino',
        activo: true
      });

      console.log('✅ Usuario creado:', usuario.id);

      // Recargar con la relación
      usuario = await Usuario.findByPk(usuario.id, {
        include: [{ model: Persona, as: 'persona' }]
      });
    } else {
      console.log('✅ Usuario existente:', usuario.id);
    }

    // Verificar si el usuario está activo
    if (!usuario.activo) {
      console.log('❌ Usuario inactivo');
      return res.status(403).json({ message: 'Usuario inactivo' });
    }

    // Generar JWT propio
    const token = jwt.sign(
      {
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol_global,
        persona_id: usuario.persona_id
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ JWT generado correctamente');

    // Responder con token y datos del usuario
    res.json({
      success: true,
      token,
      user: {
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol_global,
        nombre: usuario.persona?.nombre || name,
        apellido: usuario.persona?.apellido || '',
        picture
      }
    });

  } catch (error) {
    console.error('❌ Error en Google Login:', error);
    res.status(401).json({ 
      message: 'Error de autenticación', 
      error: error.message 
    });
  }
};

/**
 * POST /auth/login
 * Login tradicional (demo)
 */
export const login = (req, res) => {
  res.json({ success: true, message: 'Login tradicional no implementado aún' });
};

/**
 * POST /auth/register
 * Registro (demo)
 */
export const register = (req, res) => {
  res.json({ success: true, message: 'Registro no implementado aún' });
};

/**
 * GET /auth/profile
 * Perfil (demo)
 */
export const profile = (req, res) => {
  res.json({ success: true, message: 'Profile no implementado aún' });
};