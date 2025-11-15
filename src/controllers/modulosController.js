import { Modulo, Rol, RolModulo } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * @desc    Obtener todos los módulos del sistema
 * @route   GET /modulos
 * @access  Private (admin_global, tenant_admin)
 */
export const getModulos = async (req, res) => {
  try {
    const modulos = await Modulo.findAll({
      order: [['orden', 'ASC'], ['nombre', 'ASC']],
      include: [
        {
          model: Rol,
          as: 'roles',
          through: {
            attributes: ['puede_ver', 'puede_crear', 'puede_editar', 'puede_eliminar']
          },
          attributes: ['id', 'nombre', 'descripcion']
        }
      ]
    });

    res.status(200).json({
      success: true,
      count: modulos.length,
      data: modulos
    });
  } catch (error) {
    console.error('Error al obtener módulos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener módulos',
      error: error.message
    });
  }
};

/**
 * @desc    Obtener un módulo por ID
 * @route   GET /modulos/:id
 * @access  Private (admin_global, tenant_admin)
 */
export const getModuloById = async (req, res) => {
  try {
    const { id } = req.params;

    const modulo = await Modulo.findByPk(id, {
      include: [
        {
          model: Rol,
          as: 'roles',
          through: {
            attributes: ['puede_ver', 'puede_crear', 'puede_editar', 'puede_eliminar']
          },
          attributes: ['id', 'nombre', 'descripcion']
        }
      ]
    });

    if (!modulo) {
      return res.status(404).json({
        success: false,
        message: 'Módulo no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: modulo
    });
  } catch (error) {
    console.error('Error al obtener módulo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener módulo',
      error: error.message
    });
  }
};

/**
 * @desc    Obtener módulos permitidos para el usuario autenticado
 * @route   GET /modulos/mis-modulos
 * @access  Private (todos los usuarios aprobados)
 */
export const getMisModulos = async (req, res) => {
  try {
    const { rol: rolGlobal } = req.user;

    // Buscar el rol del usuario
    const rol = await Rol.findOne({
      where: { nombre: rolGlobal }
    });

    if (!rol) {
      return res.status(404).json({
        success: false,
        message: 'Rol no encontrado'
      });
    }

    // Obtener módulos permitidos para el rol
    const modulos = await Modulo.findAll({
      where: { activo: true },
      include: [
        {
          model: RolModulo,
          as: 'modulo_roles',
          where: {
            rol_id: rol.id,
            puede_ver: true
          },
          attributes: ['puede_ver', 'puede_crear', 'puede_editar', 'puede_eliminar'],
          required: true
        }
      ],
      order: [['orden', 'ASC'], ['nombre', 'ASC']]
    });

    res.status(200).json({
      success: true,
      rol: rolGlobal,
      count: modulos.length,
      data: modulos
    });
  } catch (error) {
    console.error('Error al obtener módulos del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener módulos del usuario',
      error: error.message
    });
  }
};

/**
 * @desc    Obtener módulos permitidos para un rol específico
 * @route   GET /modulos/por-rol/:rolId
 * @access  Private (admin_global, tenant_admin)
 */
export const getModulosPorRol = async (req, res) => {
  try {
    const { rolId } = req.params;

    // Verificar que el rol existe
    const rol = await Rol.findByPk(rolId);
    if (!rol) {
      return res.status(404).json({
        success: false,
        message: 'Rol no encontrado'
      });
    }

    // Obtener módulos permitidos para el rol
    const modulos = await Modulo.findAll({
      where: { activo: true },
      include: [
        {
          model: RolModulo,
          as: 'modulo_roles',
          where: {
            rol_id: rolId,
            puede_ver: true
          },
          attributes: ['puede_ver', 'puede_crear', 'puede_editar', 'puede_eliminar'],
          required: true
        }
      ],
      order: [['orden', 'ASC'], ['nombre', 'ASC']]
    });

    res.status(200).json({
      success: true,
      rol: rol.nombre,
      count: modulos.length,
      data: modulos
    });
  } catch (error) {
    console.error('Error al obtener módulos por rol:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener módulos por rol',
      error: error.message
    });
  }
};

/**
 * @desc    Crear un nuevo módulo
 * @route   POST /modulos
 * @access  Private (admin_global)
 */
export const createModulo = async (req, res) => {
  try {
    const {
      nombre,
      clave,
      descripcion,
      icono,
      ruta,
      orden,
      activo,
      requiere_consorcio
    } = req.body;

    // Validar campos requeridos
    if (!nombre || !clave) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y clave son requeridos'
      });
    }

    // Verificar si ya existe un módulo con esa clave
    const moduloExistente = await Modulo.findOne({ where: { clave } });
    if (moduloExistente) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un módulo con esa clave'
      });
    }

    const modulo = await Modulo.create({
      nombre,
      clave,
      descripcion,
      icono,
      ruta,
      orden: orden || 0,
      activo: activo !== undefined ? activo : true,
      requiere_consorcio: requiere_consorcio || false
    });

    res.status(201).json({
      success: true,
      message: 'Módulo creado exitosamente',
      data: modulo
    });
  } catch (error) {
    console.error('Error al crear módulo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear módulo',
      error: error.message
    });
  }
};

/**
 * @desc    Actualizar un módulo
 * @route   PUT /modulos/:id
 * @access  Private (admin_global)
 */
export const updateModulo = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      clave,
      descripcion,
      icono,
      ruta,
      orden,
      activo,
      requiere_consorcio
    } = req.body;

    const modulo = await Modulo.findByPk(id);
    if (!modulo) {
      return res.status(404).json({
        success: false,
        message: 'Módulo no encontrado'
      });
    }

    // Si se está actualizando la clave, verificar que no exista otro módulo con esa clave
    if (clave && clave !== modulo.clave) {
      const moduloExistente = await Modulo.findOne({ where: { clave } });
      if (moduloExistente) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un módulo con esa clave'
        });
      }
    }

    await modulo.update({
      nombre: nombre || modulo.nombre,
      clave: clave || modulo.clave,
      descripcion: descripcion !== undefined ? descripcion : modulo.descripcion,
      icono: icono !== undefined ? icono : modulo.icono,
      ruta: ruta !== undefined ? ruta : modulo.ruta,
      orden: orden !== undefined ? orden : modulo.orden,
      activo: activo !== undefined ? activo : modulo.activo,
      requiere_consorcio: requiere_consorcio !== undefined ? requiere_consorcio : modulo.requiere_consorcio
    });

    res.status(200).json({
      success: true,
      message: 'Módulo actualizado exitosamente',
      data: modulo
    });
  } catch (error) {
    console.error('Error al actualizar módulo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar módulo',
      error: error.message
    });
  }
};

/**
 * @desc    Eliminar un módulo
 * @route   DELETE /modulos/:id
 * @access  Private (admin_global)
 */
export const deleteModulo = async (req, res) => {
  try {
    const { id } = req.params;

    const modulo = await Modulo.findByPk(id);
    if (!modulo) {
      return res.status(404).json({
        success: false,
        message: 'Módulo no encontrado'
      });
    }

    await modulo.destroy();

    res.status(200).json({
      success: true,
      message: 'Módulo eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar módulo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar módulo',
      error: error.message
    });
  }
};

/**
 * @desc    Asignar o actualizar permisos de un módulo a un rol
 * @route   POST /modulos/asignar-rol
 * @access  Private (admin_global)
 */
export const asignarModuloARol = async (req, res) => {
  try {
    const {
      rol_id,
      modulo_id,
      puede_ver = true,
      puede_crear = false,
      puede_editar = false,
      puede_eliminar = false
    } = req.body;

    // Validar campos requeridos
    if (!rol_id || !modulo_id) {
      return res.status(400).json({
        success: false,
        message: 'rol_id y modulo_id son requeridos'
      });
    }

    // Verificar que el rol existe
    const rol = await Rol.findByPk(rol_id);
    if (!rol) {
      return res.status(404).json({
        success: false,
        message: 'Rol no encontrado'
      });
    }

    // Verificar que el módulo existe
    const modulo = await Modulo.findByPk(modulo_id);
    if (!modulo) {
      return res.status(404).json({
        success: false,
        message: 'Módulo no encontrado'
      });
    }

    // Buscar si ya existe la asignación
    const asignacionExistente = await RolModulo.findOne({
      where: { rol_id, modulo_id }
    });

    if (asignacionExistente) {
      // Actualizar permisos existentes
      await asignacionExistente.update({
        puede_ver,
        puede_crear,
        puede_editar,
        puede_eliminar
      });

      return res.status(200).json({
        success: true,
        message: 'Permisos actualizados exitosamente',
        data: asignacionExistente
      });
    } else {
      // Crear nueva asignación
      const nuevaAsignacion = await RolModulo.create({
        rol_id,
        modulo_id,
        puede_ver,
        puede_crear,
        puede_editar,
        puede_eliminar
      });

      return res.status(201).json({
        success: true,
        message: 'Módulo asignado al rol exitosamente',
        data: nuevaAsignacion
      });
    }
  } catch (error) {
    console.error('Error al asignar módulo a rol:', error);
    res.status(500).json({
      success: false,
      message: 'Error al asignar módulo a rol',
      error: error.message
    });
  }
};

/**
 * @desc    Eliminar asignación de módulo a rol
 * @route   DELETE /modulos/eliminar-asignacion/:id
 * @access  Private (admin_global)
 */
export const eliminarAsignacionModulo = async (req, res) => {
  try {
    const { id } = req.params;

    const asignacion = await RolModulo.findByPk(id);
    if (!asignacion) {
      return res.status(404).json({
        success: false,
        message: 'Asignación no encontrada'
      });
    }

    await asignacion.destroy();

    res.status(200).json({
      success: true,
      message: 'Asignación eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar asignación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar asignación',
      error: error.message
    });
  }
};

/**
 * @desc    Obtener matriz completa de permisos (todos los roles y módulos)
 * @route   GET /modulos/matriz-permisos
 * @access  Private (admin_global, tenant_admin)
 */
export const getMatrizPermisos = async (req, res) => {
  try {
    const roles = await Rol.findAll({
      order: [['nombre', 'ASC']],
      include: [
        {
          model: Modulo,
          as: 'modulos',
          through: {
            attributes: ['puede_ver', 'puede_crear', 'puede_editar', 'puede_eliminar']
          },
          attributes: ['id', 'nombre', 'clave', 'icono', 'ruta', 'orden']
        }
      ]
    });

    const modulos = await Modulo.findAll({
      where: { activo: true },
      order: [['orden', 'ASC'], ['nombre', 'ASC']],
      attributes: ['id', 'nombre', 'clave', 'icono', 'ruta', 'orden']
    });

    res.status(200).json({
      success: true,
      data: {
        roles,
        modulos
      }
    });
  } catch (error) {
    console.error('Error al obtener matriz de permisos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener matriz de permisos',
      error: error.message
    });
  }
};
