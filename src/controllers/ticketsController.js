import { Op } from 'sequelize';
import {
  Ticket,
  Consorcio,
  Unidad,
  Usuario,
} from '../models/index.js';
import { TICKET_CONSTANTS } from '../models/ticket.js';

const { TIPOS_TICKET, PRIORIDADES_TICKET, ESTADOS_TICKET } = TICKET_CONSTANTS;

const TICKET_DEFAULT_INCLUDES = [
  {
    model: Consorcio,
    as: 'consorcio',
    attributes: ['id', 'nombre'],
  },
  {
    model: Unidad,
    as: 'unidad',
    attributes: ['id', 'codigo', 'piso'],
  },
  {
    model: Usuario,
    as: 'creador',
    attributes: ['id', 'username', 'email'],
  },
  {
    model: Usuario,
    as: 'asignado',
    attributes: ['id', 'username', 'email'],
  },
];

const ensureInList = (value, list, fieldName) => {
  if (value === undefined || value === null) return undefined;
  if (!list.includes(value)) {
    const error = new Error(
      `Valor inválido para ${fieldName}. Valores permitidos: ${list.join(', ')}`
    );
    error.status = 400;
    throw error;
  }
  return value;
};

const sanitizeSort = (field, fallback = 'fecha_creacion') => {
  const allowedFields = ['fecha_creacion', 'prioridad', 'estado', 'id'];
  return allowedFields.includes(field) ? field : fallback;
};

export const getTickets = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      consorcioId,
      estado,
      prioridad,
      tipo,
      search = '',
      sortBy = 'fecha_creacion',
      sortOrder = 'desc',
    } = req.query;

    const where = {};

    if (consorcioId) {
      where.consorcio_id = consorcioId;
    }

    if (estado) {
      ensureInList(estado, ESTADOS_TICKET, 'estado');
      where.estado = estado;
    }

    if (prioridad) {
      ensureInList(prioridad, PRIORIDADES_TICKET, 'prioridad');
      where.prioridad = prioridad;
    }

    if (tipo) {
      ensureInList(tipo, TIPOS_TICKET, 'tipo');
      where.tipo = tipo;
    }

    if (search) {
      where.descripcion = { [Op.like]: `%${search}%` };
    }

    const sanitizedSortBy = sanitizeSort(sortBy);
    const sanitizedSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const pagination = {
      limit: parseInt(limit, 10),
      offset: (parseInt(page, 10) - 1) * parseInt(limit, 10),
    };

    const { rows, count } = await Ticket.findAndCountAll({
      where,
      include: TICKET_DEFAULT_INCLUDES,
      order: [[sanitizedSortBy, sanitizedSortOrder]],
      ...pagination,
      distinct: true,
    });

    res.json({
      tickets: rows,
      total: count,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(count / parseInt(limit, 10)),
    });
  } catch (error) {
    console.error('Error al obtener tickets:', error);
    res.status(error.status || 500).json({ error: error.message });
  }
};

export const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await Ticket.findByPk(id, {
      include: TICKET_DEFAULT_INCLUDES,
    });

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket no encontrado' });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Error al obtener ticket por ID:', error);
    res.status(error.status || 500).json({ error: error.message });
  }
};

export const createTicket = async (req, res) => {
  try {
    const {
      consorcio_id,
      unidad_id,
      creado_por,
      asignado_a = null,
      tipo = 'otro',
      descripcion,
      prioridad = 'media',
    } = req.body;

    if (!consorcio_id || !creado_por) {
      return res.status(400).json({
        message: 'Los campos consorcio_id y creado_por son obligatorios',
      });
    }

    ensureInList(tipo, TIPOS_TICKET, 'tipo');
    ensureInList(prioridad, PRIORIDADES_TICKET, 'prioridad');

    const [consorcio, creador, unidad, asignado] = await Promise.all([
      Consorcio.findByPk(consorcio_id),
      Usuario.findByPk(creado_por),
      unidad_id ? Unidad.findByPk(unidad_id) : Promise.resolve(null),
      asignado_a ? Usuario.findByPk(asignado_a) : Promise.resolve(null),
    ]);

    if (!consorcio) {
      return res.status(404).json({ message: 'Consorcio no encontrado' });
    }

    if (!creador) {
      return res.status(404).json({ message: 'Usuario creador no encontrado' });
    }

    if (unidad_id && !unidad) {
      return res.status(404).json({ message: 'Unidad funcional no encontrada' });
    }

    if (asignado_a && !asignado) {
      return res.status(404).json({ message: 'Usuario asignado no encontrado' });
    }

    const ticket = await Ticket.create({
      consorcio_id,
      unidad_id: unidad ? unidad.id : null,
      creado_por,
      asignado_a: asignado ? asignado.id : null,
      tipo,
      descripcion,
      prioridad,
    });

    await ticket.reload({ include: TICKET_DEFAULT_INCLUDES });

    res.status(201).json(ticket);
  } catch (error) {
    console.error('Error al crear ticket:', error);
    res.status(error.status || 500).json({ error: error.message });
  }
};

export const updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      consorcio_id,
      unidad_id,
      asignado_a,
      tipo,
      descripcion,
      prioridad,
      estado,
    } = req.body;

    const ticket = await Ticket.findByPk(id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket no encontrado' });
    }

    if (consorcio_id) {
      const consorcio = await Consorcio.findByPk(consorcio_id);
      if (!consorcio) {
        return res.status(404).json({ message: 'Consorcio no encontrado' });
      }
      ticket.consorcio_id = consorcio.id;
    }

    if (unidad_id !== undefined) {
      if (unidad_id === null) {
        ticket.unidad_id = null;
      } else {
        const unidad = await Unidad.findByPk(unidad_id);
        if (!unidad) {
          return res.status(404).json({ message: 'Unidad funcional no encontrada' });
        }
        ticket.unidad_id = unidad.id;
      }
    }

    if (asignado_a !== undefined) {
      if (asignado_a === null) {
        ticket.asignado_a = null;
      } else {
        const usuarioAsignado = await Usuario.findByPk(asignado_a);
        if (!usuarioAsignado) {
          return res.status(404).json({ message: 'Usuario asignado no encontrado' });
        }
        ticket.asignado_a = usuarioAsignado.id;
      }
    }

    if (tipo) {
      ensureInList(tipo, TIPOS_TICKET, 'tipo');
      ticket.tipo = tipo;
    }

    if (descripcion !== undefined) {
      ticket.descripcion = descripcion;
    }

    if (prioridad) {
      ensureInList(prioridad, PRIORIDADES_TICKET, 'prioridad');
      ticket.prioridad = prioridad;
    }

    if (estado) {
      ensureInList(estado, ESTADOS_TICKET, 'estado');
      ticket.estado = estado;
      if (['resuelto', 'cerrado'].includes(estado)) {
        ticket.fecha_cierre = ticket.fecha_cierre ?? new Date();
      } else {
        ticket.fecha_cierre = null;
      }
    }

    await ticket.save();
    await ticket.reload({ include: TICKET_DEFAULT_INCLUDES });

    res.json(ticket);
  } catch (error) {
    console.error('Error al actualizar ticket:', error);
    res.status(error.status || 500).json({ error: error.message });
  }
};

export const updateTicketEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!estado) {
      return res.status(400).json({ message: 'El estado es obligatorio' });
    }

    ensureInList(estado, ESTADOS_TICKET, 'estado');

    const ticket = await Ticket.findByPk(id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket no encontrado' });
    }

    ticket.estado = estado;
    ticket.fecha_cierre = ['resuelto', 'cerrado'].includes(estado)
      ? new Date()
      : null;

    await ticket.save();
    await ticket.reload({ include: TICKET_DEFAULT_INCLUDES });

    res.json(ticket);
  } catch (error) {
    console.error('Error al actualizar estado del ticket:', error);
    res.status(error.status || 500).json({ error: error.message });
  }
};