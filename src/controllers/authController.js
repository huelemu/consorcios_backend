import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Login tradicional (existente)
export const login = (req, res) => {
  const { email } = req.body;
  res.json({ success: true, message: `Usuario ${email} logueado (demo)` });
};

// Registro tradicional (existente)
export const register = (req, res) => {
  const { email } = req.body;
  res.json({ success: true, message: `Usuario ${email} registrado (demo)` });
};

// Perfil de usuario (existente)
export const profile = (req, res) => {
  res.json({ success: true, message: 'Perfil del usuario autenticado (demo)' });
};

// ============================================
// NUEVO: Google OAuth Login
// ============================================
export const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
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
    
    // Extraer información del usuario
    const googleUser = {
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      sub: payload.sub, // ID único de Google
    };

    // TODO: Aquí deberías buscar o crear el usuario en tu base de datos
    // Por ahora, simulamos que el usuario existe
    const user = {
      id: googleUser.sub,
      email: googleUser.email,
      nombre: googleUser.name,
      avatar: googleUser.picture,
    };

    // Generar JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        nombre: user.nombre 
      },
      process.env.JWT_SECRET || 'secret-key-temporal',
      { expiresIn: '7d' }
    );

    // Responder con el token y datos del usuario
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        avatar: user.avatar,
      }
    });

  } catch (error) {
    console.error('Error en Google OAuth:', error);
    res.status(401).json({
      success: false,
      message: 'Token de Google inválido',
      error: error.message
    });
  }
};

// Alias para callback (mantiene compatibilidad con ambas rutas)
export const googleCallback = googleLogin;

