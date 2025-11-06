import { 
  Ticket,
  Consorcio,
  Unidad,
  Usuario,
  Proveedor,
  Persona,
  TicketComentario,
  TicketHistorial,
  TicketAdjunto
} from '../models/index.js';
import { Op } from 'sequelize';

const TIPOS_TICKET = ['mantenimiento', 'reclamo', 'limpieza', 'administrativo', 'mejora', 'otro'];
const PRIORIDADES_TICKET = ['baja', 'media', 'alta', 'critica'];
const ESTADOS_TICKET = ['abierto', 'en_proceso', 'pendiente', 'resuelto', 'cerrado'];

const TICKET_DEFAULT_INCLUDES = [
  {
    model: Consorcio,
    as: 'consorcio',
    attributes: ['id', 'nombre', 'codigo_ext'],
    required: false,
  },
  {
    model: Unidad,
    as: 'unidad',
    attributes: ['id', 'codigo', 'piso'],
    required: false,
  },
  {
    model: Usuario,
    as: 'creador',
    attributes: ['id', 'username', 'email'],
    required: false,
  },
  {
    model: Usuario,
    as: 'asignado',
    attributes: ['id', 'username', 'email'],
    required: false,
  },
  {
    model: Proveedor,
    as: 'proveedor',
    attributes: ['id', 'razon_social', 'rubro'],
    include: [{
      model: Persona,
      as: 'persona',
      attributes: ['nombre', 'apellido', 'email', 'telefono']
    }],
    required: false,
  },
  {
    model: TicketComentario,
    as: 'comentarios',
    include: [{ model: Usuario, as: 'usuario', attributes: ['username'] }],
    required: false,
  },
  {
    model: TicketHistorial,
    as: 'historial',
    required: false,
  },
  {
    model: TicketAdjunto,
    as: 'adjuntos',
    required: false,
  }
];

const ensureInList = (value, list, field) => {
  if (!list.includes(value)) {
    throw { status: 400, message: `Valor inválido para ${field}: ${value}` };
  }
};

// ====================================
// GET TICKETS CON FILTROS
// ====================================
export const getTickets = async (req, res) => {
  try {
    const {
      consorcio_id,
      unidad_id,
      estado,
      prioridad,
      tipo,
      asignado_rol,
      proveedor_id,
      search,
      page = 1,
      limit = 50,
    } = req.query;

    const where = {};

    if (consorcio_id) where.consorcio_id = consorcio_id;
    if (unidad_id) where.unidad_id = unidad_id;
    if (estado) where.estado = estado;
    if (prioridad) where.prioridad = prioridad;
    if (tipo) where.tipo = tipo;
    if (asignado_rol) where.asignado_rol = asignado_rol;
    if (proveedor_id) where.proveedor_id = proveedor_id;

    if (search) {
      where[Op.or] = [
        { titulo: { [Op.like]: `%${search}%` } },
        { descripcion: { [Op.like]: `%${search}%` } },
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { rows: tickets, count } = await Ticket.findAndCountAll({
      where,
      include: TICKET_DEFAULT_INCLUDES,
      limit: parseInt(limit),
      offset,
      order: [['fecha_creacion', 'DESC']],
    });

const mapped = tickets.map((t) => ({
  id: t.id,
  consorcioId: t.consorcio_id,
  consorcioNombre: t.consorcio?.nombre ?? 'N/D',
  unidadId: t.unidad_id,
  unidadNombre: t.unidad ? `${t.unidad.piso}-${t.unidad.codigo}` : null,
  creadoPorId: t.creado_por,
  creadoPorNombre: t.creador?.username ?? 'Desconocido',
  creadorRol: t.creador_rol || 'admin_global',
  asignadoAId: t.asignado_a,
  asignadoANombre: t.asignado?.username ?? null,
  asignadoRol: t.asignado_rol,
  proveedorId: t.proveedor_id,
  proveedorNombre: t.proveedor?.razon_social ?? t.proveedor_nombre,
  proveedorRubro: t.proveedor?.rubro ?? t.proveedor_rubro,
  tipo: t.tipo,
  titulo: t.titulo,
  descripcion: t.descripcion,
  prioridad: t.prioridad,
  estado: t.estado,
  fechaCreacion: t.fecha_creacion,
  fechaActualizacion: t.updatedAt,
  fechaResolucion: t.fecha_resolucion,
  fechaCierre: t.fecha_cierre,
  estimacionCosto: t.estimacion_costo,
  costoFinal: t.costo_final,
  comentarios: t.comentarios?.map(c => ({
    id: c.id,
    ticketId: c.ticket_id,
    authorId: c.usuario_id,
    authorName: c.usuario?.username ?? 'Desconocido',
    message: c.mensaje,
    isInternal: c.interno,
    createdAt: c.createdAt
  })) ?? [],
  historial: t.historial?.map(h => ({
    id: h.id,
    date: h.fecha,
    userId: h.usuario_id,
    userName: h.autor,
    action: h.tipo,
    description: h.mensaje
  })) ?? [],
  adjuntos: t.adjuntos?.map(a => ({
    id: a.id,
    fileName: a.nombre_archivo,
    fileType: a.tipo_archivo,
    uploadedAt: a.createdAt,
    uploadedBy: a.subido_por,
    url: a.ruta
  })) ?? [],
  updatedAt: t.updatedAt
}));

    res.json({ data: mapped, total: count });
  } catch (error) {
    console.error('Error al obtener tickets:', error);
    res.status(500).json({ error: error.message });
  }
};

// ====================================
// UPDATE TICKET COMPLETO
// ====================================
export const updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const ticket = await Ticket.findByPk(id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket no encontrado' });
    }

    const cambios = [];
    
    if (updates.tipo && updates.tipo !== ticket.tipo) {
      ensureInList(updates.tipo, TIPOS_TICKET, 'tipo');
      cambios.push(`Tipo: ${ticket.tipo} → ${updates.tipo}`);
      ticket.tipo = updates.tipo;
    }

    if (updates.prioridad && updates.prioridad !== ticket.prioridad) {
      ensureInList(updates.prioridad, PRIORIDADES_TICKET, 'prioridad');
      cambios.push(`Prioridad: ${ticket.prioridad} → ${updates.prioridad}`);
      ticket.prioridad = updates.prioridad;
    }

    if (updates.titulo) ticket.titulo = updates.titulo;
    if (updates.descripcion) ticket.descripcion = updates.descripcion;

    await ticket.save();

    if (cambios.length > 0) {
      await TicketHistorial.create({
        ticket_id: id,
        usuario_id: req.user?.id || 1,
        tipo: 'actualizacion',
        autor: req.user?.username || 'Sistema',
        mensaje: cambios.join(', '),
        fecha: new Date(),
      });
    }

    await ticket.reload({ include: TICKET_DEFAULT_INCLUDES });
    res.json(ticket);
  } catch (error) {
    console.error('Error al actualizar ticket:', error);
    res.status(error.status || 500).json({ error: error.message });
  }
};

// ====================================
// GET COMENTARIOS
// ====================================
export const getComentarios = async (req, res) => {
  try {
    const { ticketId } = req.params;

    const comentarios = await TicketComentario.findAll({
      where: { ticket_id: ticketId },
      include: [{
        model: Usuario,
        as: 'usuario',
        attributes: ['id', 'username', 'email']
      }],
      order: [['createdAt', 'DESC']],
    });

    res.json(comentarios);
  } catch (error) {
    console.error('Error al obtener comentarios:', error);
    res.status(500).json({ error: error.message });
  }
};

// ====================================
// GET TICKET BY ID
// ====================================
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
    res.status(500).json({ error: error.message });
  }
};

// ====================================
// CREATE TICKET
// ====================================
export const createTicket = async (req, res) => {
  try {
    const {
      consorcio_id,
      unidad_id,
      creado_por,
      asignado_a = null,
      tipo = 'otro',
      titulo,
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

    const ticket = await Ticket.create({
      consorcio_id,
      unidad_id: unidad_id || null,
      creado_por,
      asignado_a: asignado_a || null,
      tipo,
      titulo: titulo || `Ticket ${tipo}`,
      descripcion,
      prioridad,
      estado: 'abierto',
    });

    // Registrar en historial
    await TicketHistorial.create({
      ticket_id: ticket.id,
      usuario_id: creado_por,
      tipo: 'creado',
      autor: 'Sistema',
      mensaje: 'Ticket creado',
      fecha: new Date(),
    });

    await ticket.reload({ include: TICKET_DEFAULT_INCLUDES });

    res.status(201).json(ticket);
  } catch (error) {
    console.error('Error al crear ticket:', error);
    res.status(error.status || 500).json({ error: error.message });
  }
};

// ====================================
// UPDATE TICKET ESTADO
// ====================================
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

    const estadoAnterior = ticket.estado;
    ticket.estado = estado;

    if (['resuelto', 'cerrado'].includes(estado)) {
      ticket.fecha_cierre = ticket.fecha_cierre || new Date();
    }

    if (estado === 'resuelto' && !ticket.fecha_resolucion) {
      ticket.fecha_resolucion = new Date();
    }

    await ticket.save();

    // Registrar cambio en historial
    await TicketHistorial.create({
      ticket_id: ticket.id,
      usuario_id: req.user?.id || 1,
      tipo: 'estado',
      autor: req.user?.username || 'Sistema',
      mensaje: `Estado cambiado de "${estadoAnterior}" a "${estado}"`,
      fecha: new Date(),
    });

    await ticket.reload({ include: TICKET_DEFAULT_INCLUDES });

    res.json(ticket);
  } catch (error) {
    console.error('Error al actualizar estado del ticket:', error);
    res.status(500).json({ error: error.message });
  }
};

// ====================================
// UPDATE TICKET ASIGNACION
// ====================================
export const updateTicketAsignacion = async (req, res) => {
  try {
    const { id } = req.params;
    const { asignadoANombre, asignadoRol, proveedorId } = req.body;

    const ticket = await Ticket.findByPk(id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket no encontrado' });
    }

    ticket.asignado_rol = asignadoRol || null;
    ticket.proveedor_id = proveedorId || null;
    ticket.proveedor_nombre = asignadoANombre || null;

    await ticket.save();

    // Registrar en historial
    await TicketHistorial.create({
      ticket_id: ticket.id,
      usuario_id: req.user?.id || 1,
      tipo: 'asignado',
      autor: req.user?.username || 'Sistema',
      mensaje: `Ticket asignado a ${asignadoANombre} (${asignadoRol})`,
      fecha: new Date(),
    });

    await ticket.reload({ include: TICKET_DEFAULT_INCLUDES });

    res.json(ticket);
  } catch (error) {
    console.error('Error al actualizar asignación:', error);
    res.status(500).json({ error: error.message });
  }
};

// ====================================
// ADD COMENTARIO
// ====================================
export const addComentario = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { authorId, message, isInternal } = req.body;

    // Validar que authorId exista y sea válido
    if (!authorId || authorId === 0) {
      return res.status(400).json({ 
        message: 'El ID del autor es obligatorio y debe ser válido' 
      });
    }

    // Verificar que el ticket existe
    const ticket = await Ticket.findByPk(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket no encontrado' });
    }

    // Verificar que el usuario existe
    const usuario = await Usuario.findByPk(authorId);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const comentario = await TicketComentario.create({
      ticket_id: ticketId,
      usuario_id: authorId,
      mensaje: message,
      interno: isInternal || false,
    });

    // Registrar en historial
    await TicketHistorial.create({
      ticket_id: ticketId,
      usuario_id: authorId,
      tipo: 'comentario',
      autor: usuario.username,
      mensaje: `Comentario agregado: ${message.substring(0, 50)}...`,
      fecha: new Date(),
    });

    await comentario.reload({
      include: [{ model: Usuario, as: 'usuario', attributes: ['username'] }]
    });

    res.status(201).json(comentario);
  } catch (error) {
    console.error('Error al agregar comentario:', error);
    res.status(500).json({ error: error.message });
  }
};



// ====================================
// UPDATE COSTOS
// ====================================
export const updateTicketCostos = async (req, res) => {
  try {
    const { id } = req.params;
    const { estimacionCosto, costoFinal } = req.body;

    const ticket = await Ticket.findByPk(id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket no encontrado' });
    }

    if (estimacionCosto !== undefined) {
      ticket.estimacion_costo = estimacionCosto;
    }

    if (costoFinal !== undefined) {
      ticket.costo_final = costoFinal;
    }

    await ticket.save();

    // Registrar en historial
    await TicketHistorial.create({
      ticket_id: ticket.id,
      usuario_id: req.user?.id || 1,
      tipo: 'costos',
      autor: req.user?.username || 'Sistema',
      mensaje: `Costos actualizados: Estimado ${estimacionCosto || 'N/A'}, Final ${costoFinal || 'N/A'}`,
      fecha: new Date(),
    });

    await ticket.reload({ include: TICKET_DEFAULT_INCLUDES });

    res.json(ticket);
  } catch (error) {
    console.error('Error al actualizar costos:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getTicketHistorial = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const historial = await TicketHistorial.findAll({
      where: { ticket_id: ticketId },
      order: [['fecha', 'DESC']]
    });
    res.json(historial);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAdjuntos = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const adjuntos = await TicketAdjunto.findAll({
      where: { ticket_id: ticketId },
      order: [['createdAt', 'DESC']]
    });
    res.json(adjuntos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const uploadAdjunto = async (req, res) => {
  try {
    const { ticketId } = req.params;
    // TODO: integrar multer para manejo de archivos
    res.status(501).json({ message: 'Pendiente implementación multer' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};