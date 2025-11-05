import express from 'express';
import multer from 'multer';
import {
  getTickets,
  getTicketById,
  createTicket,
  updateTicketEstado,
  updateTicketAsignacion,
  addComentario,
  updateTicketCostos,
  uploadAdjunto,
  getTicketHistorial,
  updateTicket,
  getComentarios,
} from '../controllers/ticketsController.js';

const router = express.Router();

// Configuración de multer para subir archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/tickets/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

/**
 * @swagger
 * tags:
 *   name: Tickets
 *   description: Gestión de tickets, reclamos y solicitudes
 */

/**
 * @swagger
 * /tickets:
 *   get:
 *     summary: Obtener lista de tickets con filtros
 *     tags: [Tickets]
 *     parameters:
 *       - in: query
 *         name: consorcio_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *       - in: query
 *         name: prioridad
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de tickets
 */
router.get('/', getTickets);

/**
 * @swagger
 * /tickets/{id}:
 *   get:
 *     summary: Obtener un ticket por ID
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Ticket encontrado
 *       404:
 *         description: Ticket no encontrado
 */
router.get('/:id', getTicketById);

/**
 * @swagger
 * /tickets:
 *   post:
 *     summary: Crear nuevo ticket
 *     tags: [Tickets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               consorcio_id:
 *                 type: integer
 *               unidad_id:
 *                 type: integer
 *               creado_por:
 *                 type: integer
 *               tipo:
 *                 type: string
 *               titulo:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               prioridad:
 *                 type: string
 *     responses:
 *       201:
 *         description: Ticket creado
 */
router.post('/', createTicket);
router.put('/:id', updateTicket);

/**
 * @swagger
 * /tickets/{id}/estado:
 *   patch:
 *     summary: Actualizar estado del ticket
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               estado:
 *                 type: string
 *     responses:
 *       200:
 *         description: Estado actualizado
 */
router.patch('/:id/estado', updateTicketEstado);

/**
 * @swagger
 * /tickets/{id}/asignacion:
 *   patch:
 *     summary: Reasignar ticket
 *     tags: [Tickets]
 */
router.patch('/:id/asignacion', updateTicketAsignacion);

/**
 * @swagger
 * /tickets/{ticketId}/comentarios:
 *   post:
 *     summary: Agregar comentario al ticket
 *     tags: [Tickets]
 */
router.post('/:ticketId/comentarios', addComentario);
router.get('/:ticketId/comentarios', getComentarios);

/**
 * @swagger
 * /tickets/{id}/costos:
 *   patch:
 *     summary: Actualizar costos del ticket
 *     tags: [Tickets]
 */
router.patch('/:id/costos', updateTicketCostos);

/**
 * @swagger
 * /tickets/{id}/adjuntos:
 *   post:
 *     summary: Subir archivo adjunto
 *     tags: [Tickets]
 */
router.post('/:id/adjuntos', upload.single('file'), uploadAdjunto);

/**
 * @swagger
 * /tickets/{id}/historial:
 *   get:
 *     summary: Obtener historial del ticket
 *     tags: [Tickets]
 */
router.get('/:id/historial', getTicketHistorial);

export default router;