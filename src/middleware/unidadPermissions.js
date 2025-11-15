import { Unidad, UsuarioRol } from '../models/index.js';

/**
 * =========================================
 * MIDDLEWARE: PERMISOS DE UNIDADES
 * =========================================
 * Valida que el usuario tenga permisos para operar sobre unidades específicas
 */

/**
 * Helper: Obtener IDs de unidades a las que el usuario tiene acceso
 */
async function getUnidadesIdsForUser(userId) {
  const asignaciones = await UsuarioRol.findAll({
    where: {
      usuario_id: userId,
      activo: true
    },
    attributes: ['unidad_id', 'consorcio_id']
  });

  const unidadIds = new Set();

  for (const asignacion of asignaciones) {
    // Si tiene asignación directa a una unidad
    if (asignacion.unidad_id) {
      unidadIds.add(asignacion.unidad_id);
    }

    // Si tiene asignación a un consorcio completo, obtener todas las unidades de ese consorcio
    if (asignacion.consorcio_id) {
      const unidades = await Unidad.findAll({
        where: { consorcio_id: asignacion.consorcio_id },
        attributes: ['id']
      });

      unidades.forEach(unidad => unidadIds.add(unidad.id));
    }
  }

  return Array.from(unidadIds);
}

/**
 * Helper: Verificar si el usuario tiene acceso a una unidad específica
 */
async function userHasAccessToUnidad(userId, unidadId) {
  const unidadIds = await getUnidadesIdsForUser(userId);
  return unidadIds.includes(parseInt(unidadId));
}

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
 * Verifica si el usuario puede acceder a una unidad específica
 */
export const canAccessUnidad = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    // Admin global puede acceder a todo
    if (user.rol === 'admin_global') {
      return next();
    }

    // Buscar la unidad
    const unidad = await Unidad.findByPk(id);

    if (!unidad) {
      return res.status(404).json({
        message: 'Unidad no encontrada',
        code: 'UNIDAD_NOT_FOUND'
      });
    }

    // Tenant admin puede acceder si la unidad pertenece a un consorcio de su tenant
    // (requeriría agregar tenant_id a consorcios y hacer join)
    // Por ahora lo dejamos comentado

    // Admin consorcio puede acceder si es responsable del consorcio de la unidad
    if (user.rol === 'admin_consorcio') {
      // Necesitaríamos hacer join con consorcio para verificar responsable_id
      // Por ahora permitir si tiene acceso al consorcio
      const consorcioIds = await getConsorciosIdsForUser(user.id);
      if (consorcioIds.includes(unidad.consorcio_id)) {
        return next();
      }

      return res.status(403).json({
        message: 'No tienes permisos para acceder a esta unidad',
        code: 'FORBIDDEN'
      });
    }

    // Admin edificio, propietarios e inquilinos
    // Solo pueden ver las unidades que tienen asignadas
    if (['admin_edificio', 'propietario', 'inquilino'].includes(user.rol)) {
      const hasAccess = await userHasAccessToUnidad(user.id, id);

      if (!hasAccess) {
        return res.status(403).json({
          message: 'No tienes permisos para acceder a esta unidad',
          code: 'FORBIDDEN'
        });
      }

      // Solo permiten lectura (GET)
      if (req.method === 'GET') {
        return next();
      }

      return res.status(403).json({
        message: 'No tienes permisos para modificar esta unidad',
        code: 'FORBIDDEN'
      });
    }

    // Por defecto, denegar acceso
    return res.status(403).json({
      message: 'No tienes permisos para acceder a esta unidad',
      code: 'FORBIDDEN'
    });

  } catch (error) {
    console.error('Error en canAccessUnidad:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Filtro para listar solo unidades accesibles por el usuario
 */
export const filterUnidadesByUserAccess = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    // Admin global ve todas
    if (user.rol === 'admin_global') {
      return next();
    }

    // Admin consorcio ve unidades de los consorcios donde es responsable
    if (user.rol === 'admin_consorcio') {
      const consorcioIds = await getConsorciosIdsForUser(user.id);

      if (consorcioIds.length === 0) {
        req.unidadFilter = { id: -1 }; // ID imposible
      } else {
        req.unidadFilter = { consorcio_id: consorcioIds };
      }

      return next();
    }

    // Admin edificio, propietarios e inquilinos
    // Solo ven las unidades que tienen asignadas
    if (['admin_edificio', 'propietario', 'inquilino'].includes(user.rol)) {
      const unidadIds = await getUnidadesIdsForUser(user.id);

      if (unidadIds.length === 0) {
        req.unidadFilter = { id: -1 }; // ID imposible
      } else {
        req.unidadFilter = { id: unidadIds };
      }

      return next();
    }

    next();

  } catch (error) {
    console.error('Error en filterUnidadesByUserAccess:', error);
    res.status(500).json({ error: error.message });
  }
};

export default {
  canAccessUnidad,
  filterUnidadesByUserAccess
};
