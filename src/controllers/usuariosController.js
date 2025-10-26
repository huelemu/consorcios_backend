import Usuario from '../models/usuario.js';
import Persona from '../models/persona.js';
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