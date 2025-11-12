import { Unidad, Consorcio, Persona, Ticket } from '../models/index.js';
import { Op } from 'sequelize';
import {sequelize} from '../config/db.js';

/**
 * GET /api/unidades
 * Lista todas las unidades con filtros, búsqueda y paginación
 */
export const getUnidades = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search = '',
      consorcio_id = '',
      estado = '',
      tiene_tickets_pendientes = '',
      sortBy = 'codigo',
      sortOrder = 'ASC'
    } = req.query;

    // Construir filtros
    const where = {};

    // Búsqueda por código o piso
    if (search) {
      where[Op.or] = [
        { codigo: { [Op.like]: `%${search}%` } },
        { piso: { [Op.like]: `%${search}%` } }
      ];
    }

    // Filtro por consorcio
    if (consorcio_id) {
      where.consorcio_id = consorcio_id;
    }

    // Filtro por estado
    if (estado) {
      where.estado = estado;
    }

    // Si se filtra por tickets pendientes, obtener IDs ANTES de paginar
    if (tiene_tickets_pendientes === 'true') {
      const unidadesConTickets = await Ticket.findAll({
        attributes: ['unidad_id'],
        where: {
          estado: ['abierto', 'en_proceso'],
          unidad_id: { [Op.ne]: null }
        },
        group: ['unidad_id'],
        raw: true
      });

      const unidadesIdsConTickets = unidadesConTickets.map(u => u.unidad_id);

      // Si no hay unidades con tickets, retornar vacío
      if (unidadesIdsConTickets.length === 0) {
        return res.json({
          data: [],
          pagination: {
            total: 0,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: 0
          }
        });
      }

      // Agregar filtro por IDs de unidades con tickets
      where.id = { [Op.in]: unidadesIdsConTickets };
    }

    // Paginación
    const offset = (page - 1) * limit;

    // Consulta base
    const queryOptions = {
      where,
      include: [
        {
          model: Consorcio,
          as: 'consorcio',
          attributes: ['id', 'nombre', 'direccion', 'estado']
        },
        {
          model: Persona,
          as: 'personas',
          through: {
            attributes: ['rol_unidad', 'fecha_desde', 'fecha_hasta']
          },
          attributes: ['id', 'nombre', 'apellido', 'email', 'telefono']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder.toUpperCase()]],
      distinct: true
    };

    // Ejecutar consulta con filtros aplicados
    const { count, rows } = await Unidad.findAndCountAll(queryOptions);

    // Para todas las unidades retornadas, contar tickets pendientes
    const unidadIds = rows.map(u => u.id);

    let ticketsCounts = [];
    if (unidadIds.length > 0) {
      ticketsCounts = await Ticket.findAll({
        attributes: [
          'unidad_id',
          [sequelize.fn('COUNT', sequelize.col('id')), 'tickets_count']
        ],
        where: {
          estado: ['abierto', 'en_proceso'],
          unidad_id: { [Op.in]: unidadIds }
        },
        group: ['unidad_id'],
        raw: true
      });
    }

    // Agregar contador de tickets a cada unidad
    rows.forEach(unidad => {
      const ticketData = ticketsCounts.find(t => t.unidad_id === unidad.id);
      unidad.dataValues.tickets_count = ticketData ? parseInt(ticketData.tickets_count) : 0;
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
    console.error('Error en getUnidades:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/unidades/:id
 * Obtiene una unidad por ID con toda su información relacionada
 */
export const getUnidadById = async (req, res) => {
  try {
    const { id } = req.params;

    const unidad = await Unidad.findByPk(id, {
      include: [
        {
          model: Consorcio,
          as: 'consorcio',
          attributes: ['id', 'nombre', 'direccion', 'ciudad', 'provincia', 'estado']
        },
        {
          model: Persona,
          as: 'personas',
          through: {
            attributes: ['rol_unidad', 'fecha_desde', 'fecha_hasta']
          },
          attributes: ['id', 'nombre', 'apellido', 'email', 'telefono', 'documento']
        }
      ]
    });

    if (!unidad) {
      return res.status(404).json({ message: 'Unidad no encontrada' });
    }

    // Contar tickets pendientes
    const ticketsCount = await Ticket.count({
      where: {
        unidad_id: id,
        estado: ['abierto', 'en_proceso']
      }
    });

    unidad.dataValues.tickets_count = ticketsCount;

    res.json(unidad);
  } catch (error) {
    console.error('Error en getUnidadById:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/unidades
 * Crea una nueva unidad
 */
export const createUnidad = async (req, res) => {
  try {
    const { consorcio_id, codigo, piso, superficie, porcentaje_participacion, estado } = req.body;

    if (!consorcio_id || !codigo) {
      return res.status(400).json({ message: 'El consorcio y el código son obligatorios' });
    }

    // Verificar que el consorcio existe
    const consorcio = await Consorcio.findByPk(consorcio_id);
    if (!consorcio) {
      return res.status(404).json({ message: 'Consorcio no encontrado' });
    }

    // Verificar que el código no esté duplicado en el mismo consorcio
    const unidadExistente = await Unidad.findOne({
      where: {
        consorcio_id,
        codigo
      }
    });

    if (unidadExistente) {
      return res.status(400).json({ 
        message: 'Ya existe una unidad con ese código en este consorcio' 
      });
    }

    const nuevaUnidad = await Unidad.create({
      consorcio_id,
      codigo,
      piso,
      superficie,
      porcentaje_participacion,
      estado: estado || 'vacante'
    });

    res.status(201).json({
      message: 'Unidad creada correctamente',
      data: nuevaUnidad
    });
  } catch (error) {
    console.error('Error en createUnidad:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * PUT /api/unidades/:id
 * Actualiza una unidad existente
 */
export const updateUnidad = async (req, res) => {
  try {
    const { id } = req.params;
    const { codigo, piso, superficie, porcentaje_participacion, estado } = req.body;

    const unidad = await Unidad.findByPk(id);

    if (!unidad) {
      return res.status(404).json({ message: 'Unidad no encontrada' });
    }

    // Actualizar campos
    await unidad.update({
      codigo: codigo || unidad.codigo,
      piso: piso !== undefined ? piso : unidad.piso,
      superficie: superficie !== undefined ? superficie : unidad.superficie,
      porcentaje_participacion: porcentaje_participacion !== undefined ? porcentaje_participacion : unidad.porcentaje_participacion,
      estado: estado || unidad.estado
    });

    res.json({
      message: 'Unidad actualizada correctamente',
      data: unidad
    });
  } catch (error) {
    console.error('Error en updateUnidad:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * DELETE /api/unidades/:id
 * Elimina una unidad
 */
export const deleteUnidad = async (req, res) => {
  try {
    const { id } = req.params;

    const unidad = await Unidad.findByPk(id);

    if (!unidad) {
      return res.status(404).json({ message: 'Unidad no encontrada' });
    }

    await unidad.destroy();

    res.json({ message: 'Unidad eliminada correctamente' });
  } catch (error) {
    console.error('Error en deleteUnidad:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/unidades/stats
 * Obtiene estadísticas generales de unidades
 */
export const getUnidadesStats = async (req, res) => {
  try {
    // Total de unidades
    const totalUnidades = await Unidad.count();

    // Unidades por estado
    const ocupadas = await Unidad.count({ where: { estado: 'ocupada' } });
    const vacantes = await Unidad.count({ where: { estado: 'vacante' } });
    const mantenimiento = await Unidad.count({ where: { estado: 'mantenimiento' } });

    // Unidades con tickets pendientes
    const unidadesConTickets = await sequelize.query(`
      SELECT COUNT(DISTINCT unidad_id) as count
      FROM tickets
      WHERE estado IN ('abierto', 'en_proceso')
      AND unidad_id IS NOT NULL
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    const conTickets = unidadesConTickets[0]?.count || 0;

    res.json({
      total: totalUnidades,
      ocupadas,
      vacantes,
      mantenimiento,
      conTickets: parseInt(conTickets)
    });
  } catch (error) {
    console.error('Error en getUnidadesStats:', error);
    res.status(500).json({ error: error.message });
  }
};