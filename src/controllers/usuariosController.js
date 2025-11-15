import {Usuario} from '../models/usuario.js';
import {Persona} from '../models/persona.js';
import {Rol} from '../models/rol.js';
import {UsuarioRol} from '../models/usuarioRol.js';
import {Consorcio} from '../models/consorcio.js';
import {Unidad} from '../models/unidad.js';
import { Op } from 'sequelize';

/**
 * =========================================
 * GET /usuarios - Listar usuarios
 * =========================================
 */
export const getUsuarios = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      rol_global,
      activo,
      sortBy = 'fecha_creacion',
      sortOrder = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    // Filtro de búsqueda
    if (search) {
      where[Op.or] = [
        { email: { [Op.like]: `%${search}%` } },
        { username: { [Op.like]: `%${search}%` } },
        { '$persona.nombre$': { [Op.like]: `%${search}%` } },
        { '$persona.apellido$': { [Op.like]: `%${search}%` } }
      ];
    }

    // Filtro por rol
    if (rol_global) {
      where.rol_global = rol_global;
    }

    // Filtro por estado
    if (activo !== undefined) {
      where.activo = activo === 'true';
    }

    const { count, rows } = await Usuario.findAndCountAll({
      where,
      include: [{
        model: Persona,
        as: 'persona',
        attributes: ['id', 'nombre', 'apellido', 'documento', 'email', 'telefono', 'tipo_persona']
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder.toUpperCase()]],
      distinct: true
    });

    res.json({
      usuarios: rows,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ message: 'Error al obtener usuarios', error: error.message });
  }
};

/**
 * =========================================
 * GET /usuarios/:id - Obtener usuario por ID
 * =========================================
 */
export const getUsuarioById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const usuario = await Usuario.findByPk(id, {
      include: [{
        model: Persona,
        as: 'persona',
        attributes: ['id', 'nombre', 'apellido', 'documento', 'email', 'telefono', 'tipo_persona']
      }]
    });

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json(usuario);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ message: 'Error al obtener usuario', error: error.message });
  }
};

/**
 * =========================================
 * POST /usuarios - Crear usuario
 * =========================================
 */
export const createUsuario = async (req, res) => {
  try {
    const {
      persona_id,
      username,
      email,
      password,
      rol_global = 'inquilino',
      activo = true,
      oauth_provider = 'local'
    } = req.body;

    // Validar que la persona exista
    const persona = await Persona.findByPk(persona_id);
    if (!persona) {
      return res.status(404).json({ message: 'Persona no encontrada' });
    }

    // Verificar si el email ya existe
    const emailExists = await Usuario.findOne({ where: { email } });
    if (emailExists) {
      return res.status(400).json({ message: 'El email ya está registrado' });
    }

    // Crear usuario
    const usuario = await Usuario.create({
      persona_id,
      username,
      email,
      password, // TODO: Hashear password con bcrypt
      rol_global,
      activo,
      oauth_provider
    });

    // Cargar relación persona
    await usuario.reload({
      include: [{
        model: Persona,
        as: 'persona'
      }]
    });

    res.status(201).json(usuario);
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ message: 'Error al crear usuario', error: error.message });
  }
};

/**
 * =========================================
 * PUT /usuarios/:id - Actualizar usuario
 * =========================================
 */
export const updateUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      username,
      email,
      password,
      rol_global,
      activo
    } = req.body;

    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar si el email ya existe (excepto el actual)
    if (email && email !== usuario.email) {
      const emailExists = await Usuario.findOne({
        where: {
          email,
          id: { [Op.ne]: id }
        }
      });
      if (emailExists) {
        return res.status(400).json({ message: 'El email ya está en uso' });
      }
    }

    // Actualizar campos
    if (username !== undefined) usuario.username = username;
    if (email !== undefined) usuario.email = email;
    if (password !== undefined) usuario.password = password; // TODO: Hashear
    if (rol_global !== undefined) usuario.rol_global = rol_global;
    if (activo !== undefined) usuario.activo = activo;

    await usuario.save();

    // Recargar con persona
    await usuario.reload({
      include: [{
        model: Persona,
        as: 'persona'
      }]
    });

    res.json(usuario);
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ message: 'Error al actualizar usuario', error: error.message });
  }
};

/**
 * =========================================
 * DELETE /usuarios/:id - Eliminar usuario
 * =========================================
 */
export const deleteUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    await usuario.destroy();

    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ message: 'Error al eliminar usuario', error: error.message });
  }
};

/**
 * =========================================
 * PATCH /usuarios/:id/activar - Activar usuario
 * =========================================
 */
export const activarUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    usuario.activo = true;
    await usuario.save();

    await usuario.reload({
      include: [{ model: Persona, as: 'persona' }]
    });

    res.json(usuario);
  } catch (error) {
    console.error('Error al activar usuario:', error);
    res.status(500).json({ message: 'Error al activar usuario', error: error.message });
  }
};

/**
 * =========================================
 * PATCH /usuarios/:id/desactivar - Desactivar usuario
 * =========================================
 */
export const desactivarUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    usuario.activo = false;
    await usuario.save();

    await usuario.reload({
      include: [{ model: Persona, as: 'persona' }]
    });

    res.json(usuario);
  } catch (error) {
    console.error('Error al desactivar usuario:', error);
    res.status(500).json({ message: 'Error al desactivar usuario', error: error.message });
  }
};

/**
 * =========================================
 * POST /usuarios/:id/reset-password - Reset contraseña
 * =========================================
 */
export const resetearPassword = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // TODO: Implementar envío de email con token de reset
    // Por ahora solo retornamos mensaje de éxito

    res.json({
      message: `Email de reset de contraseña enviado a ${usuario.email}`
    });
  } catch (error) {
    console.error('Error al resetear password:', error);
    res.status(500).json({ message: 'Error al resetear password', error: error.message });
  }
};

/**
 * =========================================
 * GET /usuarios/personas-disponibles
 * =========================================
 * Obtener personas que NO tienen usuario asignado
 */
export const getPersonasSinUsuario = async (req, res) => {
  try {
    // Obtener IDs de personas que YA tienen usuario
    const usuariosConPersona = await Usuario.findAll({
      attributes: ['persona_id'],
      raw: true
    });

    const personasConUsuario = usuariosConPersona.map(u => u.persona_id);

    // Buscar personas que NO estén en esa lista
    const personasDisponibles = await Persona.findAll({
      where: {
        id: {
          [Op.notIn]: personasConUsuario.length > 0 ? personasConUsuario : [0]
        }
      },
      attributes: ['id', 'nombre', 'apellido', 'documento', 'email', 'telefono', 'tipo_persona'],
      order: [['nombre', 'ASC']]
    });

    res.json(personasDisponibles);
  } catch (error) {
    console.error('Error al obtener personas disponibles:', error);
    res.status(500).json({
      message: 'Error al obtener personas disponibles',
      error: error.message
    });
  }
};

/**
 * =========================================
 * GET /usuarios/:id/roles
 * =========================================
 * Obtener todos los roles asignados a un usuario
 */
export const getUsuarioRoles = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el usuario exista
    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Obtener roles asignados con detalles
    const rolesAsignados = await UsuarioRol.findAll({
      where: { usuario_id: id },
      include: [
        {
          model: Rol,
          as: 'rol',
          attributes: ['id', 'nombre', 'descripcion']
        },
        {
          model: Consorcio,
          as: 'consorcio',
          attributes: ['id', 'nombre'],
          required: false
        },
        {
          model: Unidad,
          as: 'unidad',
          attributes: ['id', 'codigo'],
          required: false
        }
      ],
      order: [['id', 'ASC']]
    });

    res.json({
      usuario_id: parseInt(id),
      rol_global: usuario.rol_global,
      roles: rolesAsignados
    });
  } catch (error) {
    console.error('Error al obtener roles del usuario:', error);
    res.status(500).json({
      message: 'Error al obtener roles del usuario',
      error: error.message
    });
  }
};

/**
 * =========================================
 * POST /usuarios/roles/asignar
 * =========================================
 * Asignar un rol a un usuario
 */
export const asignarRol = async (req, res) => {
  try {
    const {
      usuario_id,
      rol_id,
      consorcio_id = null,
      unidad_id = null,
      activo = true
    } = req.body;

    // Validaciones
    if (!usuario_id || !rol_id) {
      return res.status(400).json({
        message: 'usuario_id y rol_id son requeridos'
      });
    }

    // Verificar que el usuario exista
    const usuario = await Usuario.findByPk(usuario_id);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar que el rol exista
    const rol = await Rol.findByPk(rol_id);
    if (!rol) {
      return res.status(404).json({ message: 'Rol no encontrado' });
    }

    // Verificar si el consorcio existe (si se proporciona)
    if (consorcio_id) {
      const consorcio = await Consorcio.findByPk(consorcio_id);
      if (!consorcio) {
        return res.status(404).json({ message: 'Consorcio no encontrado' });
      }
    }

    // Verificar si la unidad existe (si se proporciona)
    if (unidad_id) {
      const unidad = await Unidad.findByPk(unidad_id);
      if (!unidad) {
        return res.status(404).json({ message: 'Unidad no encontrada' });
      }
    }

    // Verificar si ya existe la asignación
    const asignacionExistente = await UsuarioRol.findOne({
      where: {
        usuario_id,
        rol_id,
        consorcio_id: consorcio_id || null,
        unidad_id: unidad_id || null
      }
    });

    if (asignacionExistente) {
      return res.status(400).json({
        message: 'El rol ya está asignado al usuario en este contexto'
      });
    }

    // Crear la asignación
    const nuevaAsignacion = await UsuarioRol.create({
      usuario_id,
      rol_id,
      consorcio_id,
      unidad_id,
      activo
    });

    // Cargar las relaciones
    await nuevaAsignacion.reload({
      include: [
        {
          model: Rol,
          as: 'rol',
          attributes: ['id', 'nombre', 'descripcion']
        },
        {
          model: Consorcio,
          as: 'consorcio',
          attributes: ['id', 'nombre'],
          required: false
        },
        {
          model: Unidad,
          as: 'unidad',
          attributes: ['id', 'codigo'],
          required: false
        }
      ]
    });

    res.status(201).json({
      message: 'Rol asignado exitosamente',
      asignacion: nuevaAsignacion
    });
  } catch (error) {
    console.error('Error al asignar rol:', error);
    res.status(500).json({
      message: 'Error al asignar rol',
      error: error.message
    });
  }
};

/**
 * =========================================
 * DELETE /usuarios/roles/:id
 * =========================================
 * Eliminar una asignación de rol
 */
export const eliminarAsignacionRol = async (req, res) => {
  try {
    const { id } = req.params;

    const asignacion = await UsuarioRol.findByPk(id);
    if (!asignacion) {
      return res.status(404).json({
        message: 'Asignación de rol no encontrada'
      });
    }

    await asignacion.destroy();

    res.json({
      message: 'Asignación de rol eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar asignación de rol:', error);
    res.status(500).json({
      message: 'Error al eliminar asignación de rol',
      error: error.message
    });
  }
};

/**
 * =========================================
 * GET /roles
 * =========================================
 * Listar todos los roles disponibles
 */
export const getRoles = async (req, res) => {
  try {
    const roles = await Rol.findAll({
      order: [['nombre', 'ASC']]
    });

    res.json(roles);
  } catch (error) {
    console.error('Error al obtener roles:', error);
    res.status(500).json({
      message: 'Error al obtener roles',
      error: error.message
    });
  }
};

/**
 * =========================================
 * GET /usuarios/pendientes
 * =========================================
 * Obtener usuarios pendientes de aprobación
 */
export const getUsuariosPendientes = async (req, res) => {
  try {
    const usuariosPendientes = await Usuario.findAll({
      where: {
        aprobado: false
      },
      include: [{
        model: Persona,
        as: 'persona',
        attributes: ['id', 'nombre', 'apellido', 'documento', 'email', 'telefono', 'tipo_persona']
      }],
      order: [['fecha_creacion', 'DESC']],
      attributes: { exclude: ['password'] }
    });

    res.json({
      success: true,
      usuarios: usuariosPendientes,
      total: usuariosPendientes.length
    });
  } catch (error) {
    console.error('Error al obtener usuarios pendientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios pendientes',
      error: error.message
    });
  }
};

/**
 * =========================================
 * PATCH /usuarios/:id/aprobar
 * =========================================
 * Aprobar un usuario pendiente
 */
export const aprobarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { rol_global } = req.body; // Rol que se le asignará al usuario

    const usuario = await Usuario.findByPk(id, {
      include: [{
        model: Persona,
        as: 'persona',
        attributes: ['id', 'nombre', 'apellido', 'email']
      }]
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    if (usuario.aprobado) {
      return res.status(400).json({
        success: false,
        message: 'El usuario ya está aprobado'
      });
    }

    // Validar rol si se proporciona
    const rolesPermitidos = ['inquilino', 'propietario', 'admin_edificio', 'admin_consorcio', 'proveedor'];
    if (rol_global && !rolesPermitidos.includes(rol_global)) {
      return res.status(400).json({
        success: false,
        message: `Rol no permitido. Roles válidos: ${rolesPermitidos.join(', ')}`
      });
    }

    // Aprobar, activar el usuario y asignar rol
    usuario.aprobado = true;
    usuario.activo = true;

    // Si se proporciona un rol, asignarlo; de lo contrario, mantener 'usuario_pendiente'
    // (el admin deberá asignar el rol manualmente después)
    if (rol_global) {
      usuario.rol_global = rol_global;
    }

    await usuario.save();

    // Enviar email de aprobación (opcional)
    try {
      const { enviarEmailAprobacion } = await import('../services/emailService.js');
      await enviarEmailAprobacion(
        usuario.email,
        usuario.persona.nombre
      );
    } catch (emailError) {
      console.warn('⚠️ No se pudo enviar email de aprobación:', emailError.message);
      // Continuar aunque falle el email
    }

    await usuario.reload({
      include: [{ model: Persona, as: 'persona' }]
    });

    res.json({
      success: true,
      message: 'Usuario aprobado exitosamente',
      usuario
    });
  } catch (error) {
    console.error('Error al aprobar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al aprobar usuario',
      error: error.message
    });
  }
};

/**
 * =========================================
 * PATCH /usuarios/:id/rechazar
 * =========================================
 * Rechazar un usuario pendiente
 */
export const rechazarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    const usuario = await Usuario.findByPk(id, {
      include: [{
        model: Persona,
        as: 'persona',
        attributes: ['id', 'nombre', 'apellido', 'email']
      }]
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Enviar email de rechazo (opcional)
    try {
      const { enviarEmailRechazo } = await import('../services/emailService.js');
      await enviarEmailRechazo(
        usuario.email,
        usuario.persona.nombre,
        motivo
      );
    } catch (emailError) {
      console.warn('⚠️ No se pudo enviar email de rechazo:', emailError.message);
      // Continuar aunque falle el email
    }

    // Eliminar el usuario rechazado
    await usuario.destroy();

    res.json({
      success: true,
      message: 'Usuario rechazado y eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al rechazar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al rechazar usuario',
      error: error.message
    });
  }
};