import { Consorcio, UsuarioRol, Unidad } from '../models/index.js';

/**
 * =========================================
 * MIDDLEWARE: PERMISOS DE CONSORCIOS
 * =========================================
 * Valida que el usuario tenga permisos para operar sobre un consorcio específico
 */

/**
 * Helper: Obtener IDs de consorcios a los que el usuario tiene acceso
 */
async function getConsorciosIdsForUser(userId) {
  const asignaciones = await UsuarioRol.findAll({
    where: {
      usuario_id: userId,
      activo: true
    },
    attributes: ['consorcio_id', 'unidad_id']
  });

  const consorcioIds = new Set();

  for (const asignacion of asignaciones) {
    // Si tiene asignación directa a un consorcio
    if (asignacion.consorcio_id) {
      consorcioIds.add(asignacion.consorcio_id);
    }

    // Si tiene asignación a una unidad, obtener el consorcio de esa unidad
    if (asignacion.unidad_id) {
      const unidad = await Unidad.findByPk(asignacion.unidad_id);
      if (unidad && unidad.consorcio_id) {
        consorcioIds.add(unidad.consorcio_id);
      }
    }
  }

  return Array.from(consorcioIds);
}

/**
 * Helper: Verificar si el usuario tiene acceso a un consorcio específico
 */
async function userHasAccessToConsorcio(userId, consorcioId) {
  const consorcioIds = await getConsorciosIdsForUser(userId);
  return consorcioIds.includes(parseInt(consorcioId));
}

/**
 * Verifica si el usuario puede acceder a un consorcio específico
 * - admin_global: puede acceder a todos
 * - tenant_admin: puede acceder a consorcios de su tenant
 * - admin_consorcio: solo a consorcios donde es responsable
 */
export const canAccessConsorcio = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user; // Viene del authenticateToken

    if (!user) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    // Admin global puede acceder a todo
    if (user.rol === 'admin_global') {
      return next();
    }

    // Buscar el consorcio
    const consorcio = await Consorcio.findByPk(id);

    if (!consorcio) {
      return res.status(404).json({ 
        message: 'Consorcio no encontrado',
        code: 'CONSORCIO_NOT_FOUND'
      });
    }

    // Tenant admin puede acceder a consorcios de su tenant
    if (user.rol === 'tenant_admin') {
      if (consorcio.tenant_id === user.id) {
        return next();
      }
      return res.status(403).json({ 
        message: 'No tienes permisos para acceder a este consorcio',
        code: 'FORBIDDEN'
      });
    }

    // Admin consorcio solo puede acceder a consorcios donde es responsable
    if (user.rol === 'admin_consorcio') {
      if (consorcio.responsable_id === user.id) {
        return next();
      }
      return res.status(403).json({ 
        message: 'No tienes permisos para acceder a este consorcio',
        code: 'FORBIDDEN'
      });
    }

    // Admin edificio, propietarios e inquilinos
    // Validar que pertenecen al consorcio mediante la tabla usuarios_roles
    if (['admin_edificio', 'propietario', 'inquilino'].includes(user.rol)) {
      const hasAccess = await userHasAccessToConsorcio(user.id, id);

      if (!hasAccess) {
        return res.status(403).json({
          message: 'No tienes permisos para acceder a este consorcio',
          code: 'FORBIDDEN'
        });
      }

      // Solo permiten lectura (GET)
      if (req.method === 'GET') {
        return next();
      }

      return res.status(403).json({
        message: 'No tienes permisos para modificar este consorcio',
        code: 'FORBIDDEN'
      });
    }

    // Por defecto, denegar acceso
    return res.status(403).json({ 
      message: 'No tienes permisos para acceder a este consorcio',
      code: 'FORBIDDEN'
    });

  } catch (error) {
    console.error('Error en canAccessConsorcio:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Verifica si el usuario puede modificar un consorcio
 * Solo admin_global, tenant_admin y el admin_consorcio responsable
 */
export const canModifyConsorcio = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    // Admin global puede modificar todo
    if (user.rol === 'admin_global') {
      return next();
    }

    const consorcio = await Consorcio.findByPk(id);

    if (!consorcio) {
      return res.status(404).json({ 
        message: 'Consorcio no encontrado',
        code: 'CONSORCIO_NOT_FOUND'
      });
    }

    // Tenant admin puede modificar consorcios de su tenant
    if (user.rol === 'tenant_admin' && consorcio.tenant_id === user.id) {
      return next();
    }

    // Admin consorcio solo puede modificar si es responsable
    if (user.rol === 'admin_consorcio' && consorcio.responsable_id === user.id) {
      return next();
    }

    return res.status(403).json({ 
      message: 'No tienes permisos para modificar este consorcio',
      code: 'FORBIDDEN'
    });

  } catch (error) {
    console.error('Error en canModifyConsorcio:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Verifica si el usuario puede eliminar un consorcio
 * Solo admin_global y tenant_admin
 */
export const canDeleteConsorcio = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    // Solo admin_global y tenant_admin pueden eliminar
    if (!['admin_global', 'tenant_admin'].includes(user.rol)) {
      return res.status(403).json({ 
        message: 'No tienes permisos para eliminar consorcios',
        code: 'FORBIDDEN'
      });
    }

    // Tenant admin solo puede eliminar consorcios de su tenant
    if (user.rol === 'tenant_admin') {
      const consorcio = await Consorcio.findByPk(id);
      
      if (!consorcio) {
        return res.status(404).json({ 
          message: 'Consorcio no encontrado',
          code: 'CONSORCIO_NOT_FOUND'
        });
      }

      if (consorcio.tenant_id !== user.id) {
        return res.status(403).json({ 
          message: 'No tienes permisos para eliminar este consorcio',
          code: 'FORBIDDEN'
        });
      }
    }

    next();

  } catch (error) {
    console.error('Error en canDeleteConsorcio:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Filtro para listar solo consorcios accesibles por el usuario
 * Modifica req.query agregando filtros según el rol
 */
export const filterConsorciosByUserAccess = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    // Admin global ve todos
    if (user.rol === 'admin_global') {
      return next();
    }

    // Tenant admin ve solo consorcios de su tenant
    if (user.rol === 'tenant_admin') {
      req.consorcioFilter = { tenant_id: user.id };
      return next();
    }

    // Admin consorcio ve solo consorcios donde es responsable
    if (user.rol === 'admin_consorcio') {
      req.consorcioFilter = { responsable_id: user.id };
      return next();
    }

    // Admin edificio, propietarios e inquilinos
    // Filtrar por consorcios asociados en usuarios_roles
    if (['admin_edificio', 'propietario', 'inquilino'].includes(user.rol)) {
      const consorcioIds = await getConsorciosIdsForUser(user.id);

      // Si no tiene ningún consorcio asignado, no mostrar nada
      if (consorcioIds.length === 0) {
        req.consorcioFilter = { id: -1 }; // ID imposible para que no retorne resultados
      } else {
        req.consorcioFilter = { id: consorcioIds }; // Filtrar por IDs asignados
      }

      return next();
    }

    next();

  } catch (error) {
    console.error('Error en filterConsorciosByUserAccess:', error);
    res.status(500).json({ error: error.message });
  }
};

export default {
  canAccessConsorcio,
  canModifyConsorcio,
  canDeleteConsorcio,
  filterConsorciosByUserAccess
};