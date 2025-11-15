import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_super_seguro_cambiar_en_produccion';

/**
 * Middleware para verificar JWT en las peticiones
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token inválido o expirado' });
    }

    req.user = user; // Agregar datos del usuario al request
    next();
  });
};

/**
 * Middleware para verificar roles específicos
 * Uso: authMiddleware.requireRole(['admin_global', 'admin_consorcio'])
 */
export const requireRole = (rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    if (!rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({ message: 'No tienes permisos para esta acción' });
    }

    next();
  };
};

/**
 * Middleware para bloquear usuarios pendientes
 * Los usuarios con rol 'usuario_pendiente' no pueden acceder a recursos protegidos
 */
export const requireApprovedUser = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'No autenticado'
    });
  }

  // Bloquear usuarios con rol 'usuario_pendiente'
  if (req.user.rol === 'usuario_pendiente') {
    return res.status(403).json({
      success: false,
      message: 'Tu cuenta está pendiente de aprobación. Por favor espera a que un administrador la active y te asigne un rol.',
      code: 'USER_PENDING_APPROVAL'
    });
  }

  next();
};