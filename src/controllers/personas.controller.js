import {Persona} from '../models/persona.js';
import { Op } from 'sequelize';

/**
 * GET /personas
 * Lista todas las personas con filtros, búsqueda y paginación
 */
export const getPersonas = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      tipo_persona = '',
      provincia = '',
      sortBy = 'fecha_creacion',
      sortOrder = 'DESC'
    } = req.query;

    // Construir filtros
    const where = {};

    // Búsqueda por nombre, apellido, documento o email
    if (search) {
      where[Op.or] = [
        { nombre: { [Op.like]: `%${search}%` } },
        { apellido: { [Op.like]: `%${search}%` } },
        { documento: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    // Filtro por tipo de persona
    if (tipo_persona) {
      where.tipo_persona = tipo_persona;
    }

    // Filtro por provincia
    if (provincia) {
      where.provincia = provincia;
    }

    // Paginación
    const offset = (page - 1) * limit;

    // Consulta con paginación
    const { count, rows } = await Persona.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder]]
    });

    res.json({
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error en getPersonas:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /personas/search
 * Búsqueda avanzada de personas
 */
export const searchPersonas = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({ message: 'La búsqueda debe tener al menos 2 caracteres' });
    }

    const personas = await Persona.findAll({
      where: {
        [Op.or]: [
          { nombre: { [Op.like]: `%${q}%` } },
          { apellido: { [Op.like]: `%${q}%` } },
          { documento: { [Op.like]: `%${q}%` } },
          { email: { [Op.like]: `%${q}%` } }
        ]
      },
      limit: 20,
      order: [['nombre', 'ASC']]
    });

    res.json(personas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /personas/stats
 * Estadísticas de personas
 */
export const getPersonasStats = async (req, res) => {
  try {
    const totalPersonas = await Persona.count();
    const personasFisicas = await Persona.count({ where: { tipo_persona: 'fisica' } });
    const personasJuridicas = await Persona.count({ where: { tipo_persona: 'juridica' } });

    // Agrupar por provincia
    const porProvincia = await Persona.findAll({
      attributes: [
        'provincia',
        [Persona.sequelize.fn('COUNT', Persona.sequelize.col('id')), 'cantidad']
      ],
      group: ['provincia'],
      order: [[Persona.sequelize.fn('COUNT', Persona.sequelize.col('id')), 'DESC']],
      limit: 10,
      raw: true
    });

    res.json({
      total: totalPersonas,
      fisicas: personasFisicas,
      juridicas: personasJuridicas,
      porProvincia: porProvincia.map(p => ({
        provincia: p.provincia || 'Sin provincia',
        cantidad: parseInt(p.cantidad)
      }))
    });
  } catch (error) {
    console.error('Error en getPersonasStats:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /personas/:id
 * Obtiene una persona por ID
 */
export const getPersonaById = async (req, res) => {
  try {
    const persona = await Persona.findByPk(req.params.id);
    
    if (!persona) {
      return res.status(404).json({ message: 'Persona no encontrada' });
    }

    res.json(persona);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /personas
 * Crea una nueva persona
 */
export const createPersona = async (req, res) => {
  try {
    const {
      nombre,
      apellido,
      documento,
      email,
      telefono,
      direccion,
      localidad,
      provincia,
      pais,
      tipo_persona
    } = req.body;

    // Validaciones básicas
    if (!nombre) {
      return res.status(400).json({ message: 'El nombre es obligatorio' });
    }

    if (!documento) {
      return res.status(400).json({ message: 'El documento es obligatorio' });
    }

    // Verificar si ya existe una persona con ese documento
    const personaExistente = await Persona.findOne({ where: { documento } });
    if (personaExistente) {
      return res.status(409).json({ 
        message: 'Ya existe una persona con ese documento',
        persona: personaExistente 
      });
    }

    // Verificar email único si se proporciona
    if (email) {
      const emailExistente = await Persona.findOne({ where: { email } });
      if (emailExistente) {
        return res.status(409).json({ message: 'El email ya está registrado' });
      }
    }

    const persona = await Persona.create({
      nombre,
      apellido,
      documento,
      email,
      telefono,
      direccion,
      localidad,
      provincia: provincia || 'Buenos Aires',
      pais: pais || 'Argentina',
      tipo_persona: tipo_persona || 'fisica'
    });

    res.status(201).json({
      message: 'Persona creada correctamente',
      data: persona
    });
  } catch (error) {
    console.error('Error en createPersona:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * PUT /personas/:id
 * Actualiza una persona existente
 */
export const updatePersona = async (req, res) => {
  try {
    const { id } = req.params;
    const persona = await Persona.findByPk(id);
    
    if (!persona) {
      return res.status(404).json({ message: 'Persona no encontrada' });
    }

    // Si se actualiza el documento, verificar que no exista en otra persona
    if (req.body.documento && req.body.documento !== persona.documento) {
      const documentoExistente = await Persona.findOne({
        where: {
          documento: req.body.documento,
          id: { [Op.ne]: id }
        }
      });
      
      if (documentoExistente) {
        return res.status(409).json({ message: 'El documento ya está registrado en otra persona' });
      }
    }

    // Si se actualiza el email, verificar que no exista en otra persona
    if (req.body.email && req.body.email !== persona.email) {
      const emailExistente = await Persona.findOne({
        where: {
          email: req.body.email,
          id: { [Op.ne]: id }
        }
      });
      
      if (emailExistente) {
        return res.status(409).json({ message: 'El email ya está registrado en otra persona' });
      }
    }

    await persona.update(req.body);
    
    res.json({
      message: 'Persona actualizada correctamente',
      data: persona
    });
  } catch (error) {
    console.error('Error en updatePersona:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * DELETE /personas/:id
 * Elimina una persona (hard delete)
 */
export const deletePersona = async (req, res) => {
  try {
    const { id } = req.params;
    const persona = await Persona.findByPk(id);
    
    if (!persona) {
      return res.status(404).json({ message: 'Persona no encontrada' });
    }

    // TODO: Verificar si tiene relaciones antes de eliminar
    // (usuarios, unidades, proveedores, etc.)

    await persona.destroy();
    
    res.json({ 
      message: 'Persona eliminada correctamente',
      id: parseInt(id)
    });
  } catch (error) {
    console.error('Error en deletePersona:', error);
    res.status(500).json({ error: error.message });
  }
};