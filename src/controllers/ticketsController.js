import { Ticket, TicketComentario, TicketHistorial, TicketAdjunto, Consorcio, Unidad, Usuario, Proveedor } from '../models/index.js';
import { Op } from 'sequelize';

const ESTADOS_TICKET = ['abierto', 'en_proceso', 'pendiente', 'resuelto', 'cerrado'];
const TIPOS_TICKET = ['mantenimiento', 'reclamo', 'limpieza', 'administrativo', 'mejora', 'otro'];
const PRIORIDADES_TICKET = ['baja', 'media', 'alta', 'critica'];

const ensureInList = (value, list, campo) => {
  if (!list.includes(value)) {
    const error = new Error(`${campo} inválido: '${value}'. Valores permitidos: ${list.join(', ')}`);
    error.status = 400;
    throw error;
  }
};

const TICKET_DEFAULT_INCLUDES = [
  { model: Consorcio, as: 'consorcio', attributes: ['id', 'nombre'] },
  { model: Unidad, as: 'unidad', attributes: ['id', 'codigo', 'piso'] },
  { model: Usuario, as: 'creador', attributes: ['id', 'username', 'email'] },
  { model: Usuario, as: 'asignado', attributes: ['id', 'username', 'email'] },
  { model: Proveedor, as: 'proveedor', attributes: ['id', 'razon_social', 'rubro'] },
  { model: TicketComentario, as: 'comentarios' },
  { model: TicketHistorial, as: 'historial' },
  { model: TicketAdjunto, as: 'adjuntos' }
];

export const getTickets = async (req, res) => {
  try {
    const { search, estado, tipo, prioridad, consorcioId, unidadId } = req.query;
    const where = {};

    if (search) {
      where[Op.or] = [
        { titulo: { [Op.like]: `%${search}%` } },
        { descripcion: { [Op.like]: `%${search}%` } },
      ];
    }

    if (estado) where.estado = estado;
    if (tipo) where.tipo = tipo;
    if (prioridad) where.prioridad = prioridad;
    if (consorcioId) where.consorcio_id = consorcioId;
    if (unidadId) where.unidad_id = unidadId;

    const { count, rows: tickets } = await Ticket.findAndCountAll({
      where,
      include: TICKET_DEFAULT_INCLUDES,
      order: [['updatedAt', 'DESC']],
    });

    const mapped = tickets.map(t => ({
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

export const getTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await Ticket.findByPk(id, { include: TICKET_DEFAULT_INCLUDES });
    if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado' });
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createTicket = async (req, res) => {
  try {
    const {
      consorcio_id,
      consorcioId,
      unidad_id,
      unidadId,
      creado_por,
      creadoPor,
      creadorRol,
      creador_rol,
      tipo,
      titulo,
      descripcion,
      prioridad = 'media'
    } = req.body;

    // Soportar tanto snake_case como camelCase
    const finalConsorcioId = consorcio_id || consorcioId;
    const finalUnidadId = unidad_id || unidadId || null;
    const finalCreadoPor = creado_por || creadoPor;
    const finalCreadorRol = creador_rol || creadorRol || 'propietario';

    if (!finalConsorcioId) {
      return res.status(400).json({ message: 'consorcio_id es obligatorio' });
    }
    if (!finalCreadoPor) {
      return res.status(400).json({ message: 'creado_por es obligatorio' });
    }

    // ✅ Verificar que el usuario existe antes de crear el ticket
    const usuario = await Usuario.findByPk(finalCreadoPor);
    if (!usuario) {
      return res.status(404).json({
        message: `Usuario con id ${finalCreadoPor} no encontrado`,
        error: 'El usuario especificado en creado_por no existe en la base de datos'
      });
    }

    // ✅ Verificar que el consorcio existe
    const consorcio = await Consorcio.findByPk(finalConsorcioId);
    if (!consorcio) {
      return res.status(404).json({
        message: `Consorcio con id ${finalConsorcioId} no encontrado`,
        error: 'El consorcio especificado no existe en la base de datos'
      });
    }

    // ✅ Verificar que la unidad existe (si se proporciona)
    if (finalUnidadId) {
      const unidad = await Unidad.findByPk(finalUnidadId);
      if (!unidad) {
        return res.status(404).json({
          message: `Unidad con id ${finalUnidadId} no encontrada`,
          error: 'La unidad especificada no existe en la base de datos'
        });
      }
    }

    ensureInList(tipo, TIPOS_TICKET, 'tipo');
    ensureInList(prioridad, PRIORIDADES_TICKET, 'prioridad');

    const ticket = await Ticket.create({
      consorcio_id: finalConsorcioId,
      unidad_id: finalUnidadId,
      creado_por: finalCreadoPor,
      creador_rol: finalCreadorRol,
      tipo,
      titulo,
      descripcion,
      prioridad,
      estado: 'abierto',
      fecha_creacion: new Date()
    });

    await TicketHistorial.create({
      ticket_id: ticket.id,
      usuario_id: finalCreadoPor,
      tipo: 'creado',
      autor: usuario.username || 'Sistema',
      mensaje: `Ticket creado: ${titulo}`,
      fecha: new Date()
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
    const updates = req.body;

    const ticket = await Ticket.findByPk(id);
    if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado' });

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

export const updateTicketEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, userId } = req.body;

    if (!estado) return res.status(400).json({ message: 'El estado es obligatorio' });

    ensureInList(estado, ESTADOS_TICKET, 'estado');

    const ticket = await Ticket.findByPk(id);
    if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado' });

    const estadoAnterior = ticket.estado;
    ticket.estado = estado;

    if (['resuelto', 'cerrado'].includes(estado)) {
      ticket.fecha_cierre = ticket.fecha_cierre || new Date();
    }

    if (estado === 'resuelto' && !ticket.fecha_resolucion) {
      ticket.fecha_resolucion = new Date();
    }

    await ticket.save();

    // Usar userId del body o fallback a null
    const finalUserId = userId || req.user?.id || null;

    await TicketHistorial.create({
      ticket_id: ticket.id,
      usuario_id: finalUserId,
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


export const updateTicketAsignacion = async (req, res) => {
  try {
    const { id } = req.params;
    const { asignadoANombre, asignadoRol, proveedorId } = req.body;

    const ticket = await Ticket.findByPk(id);
    if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado' });

    ticket.asignado_rol = asignadoRol || null;
    ticket.proveedor_id = proveedorId || null;
    ticket.proveedor_nombre = asignadoANombre || null;

    await ticket.save();

    await TicketHistorial.create({
      ticket_id: ticket.id,
      usuario_id: req.user?.id || 1,
      tipo: 'asignado',
      autor: req.user?.username || 'Sistema',
      mensaje: `Ticket asignado a ${asignadoANombre || 'N/A'} (${asignadoRol || 'N/A'})`,
      fecha: new Date(),
    });

    await ticket.reload({ include: TICKET_DEFAULT_INCLUDES });
    res.json(ticket);
  } catch (error) {
    console.error('Error al actualizar asignación:', error);
    res.status(500).json({ error: error.message });
  }
};

export const updateTicketCostos = async (req, res) => {
  try {
    const { id } = req.params;
    const { estimacionCosto, costoFinal } = req.body;

    const ticket = await Ticket.findByPk(id);
    if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado' });

    if (estimacionCosto !== undefined) ticket.estimacion_costo = estimacionCosto;
    if (costoFinal !== undefined) ticket.costo_final = costoFinal;

    await ticket.save();

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

export const addComentario = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { authorId, authorName, mensaje, isInternal } = req.body;

    if (!authorId) {
      return res.status(400).json({ message: 'El ID del autor es obligatorio' });
    }

    const ticket = await Ticket.findByPk(ticketId);
    if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado' });

    const comentario = await TicketComentario.create({
      ticket_id: ticketId,
      usuario_id: authorId,
      mensaje: mensaje,
      interno: isInternal || false,
    });

    await TicketHistorial.create({
      ticket_id: ticketId,
      usuario_id: authorId,
      tipo: 'comentario',
      autor: authorName || 'Usuario',
      mensaje: `Comentario agregado: ${mensaje.substring(0, 50)}...`,
      fecha: new Date(),
    });

    res.status(201).json(comentario);
  } catch (error) {
    console.error('Error al agregar comentario:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getComentarios = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const comentarios = await TicketComentario.findAll({
      where: { ticket_id: ticketId },
      order: [['createdAt', 'DESC']]
    });
    res.json(comentarios);
  } catch (error) {
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
    
    console.log('🔎 Upload request:');
    console.log('   ticketId:', ticketId);
    console.log('   req.body:', req.body);
    console.log('   req.body.userId:', req.body.userId);
    
    if (!req.file) {
      return res.status(400).json({ message: 'No se recibió ningún archivo' });
    }

    const ticket = await Ticket.findByPk(ticketId);
    if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado' });

    // Obtener userId del body o del usuario autenticado
    const userId = parseInt(req.body.userId) || req.user?.id;
    
    console.log('   userId final:', userId);
    
    if (!userId) {
      return res.status(400).json({ message: 'Usuario no identificado' });
    }

    // Verificar que el usuario existe
    const usuario = await Usuario.findByPk(userId);
    if (!usuario) {
      console.log('   ❌ Usuario no encontrado:', userId);
      return res.status(404).json({ message: `Usuario con id ${userId} no encontrado` });
    }

    console.log('   ✅ Usuario encontrado:', usuario.username);

    const adjunto = await TicketAdjunto.create({
      ticket_id: ticketId,
      nombre_archivo: req.file.originalname,
      tipo_archivo: req.file.mimetype,
      ruta: req.file.path,
      subido_por: userId
    });

    await TicketHistorial.create({
      ticket_id: ticketId,
      usuario_id: userId,
      tipo: 'adjunto',
      autor: usuario.username || 'Usuario',
      mensaje: `Archivo adjuntado: ${req.file.originalname}`,
      fecha: new Date(),
    });

    console.log('   ✅ Adjunto creado');
    res.status(201).json(adjunto);
  } catch (error) {
    console.error('❌ Error al subir adjunto:', error);
    res.status(500).json({ error: error.message });
  }
};