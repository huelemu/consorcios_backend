import express from 'express';
import multer from 'multer';
import {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  updateTicketEstado,
  updateTicketAsignacion,
  updateTicketCostos,
  addComentario,
  getComentarios,
  getTicketHistorial,
  uploadAdjunto,
  getAdjuntos
} from '../controllers/ticketsController.js';

const router = express.Router();

// ====================================
// MULTER CONFIG
// ====================================
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

// ====================================
// ROUTES TICKETS
// ====================================
router.get('/', getTickets);
router.get('/:id', getTicketById);
router.post('/', createTicket);
router.put('/:id', updateTicket);
router.patch('/:id/estado', updateTicketEstado);
router.patch('/:id/asignacion', updateTicketAsignacion);
router.patch('/:id/costos', updateTicketCostos);

// ====================================
// COMENTARIOS
// ====================================
router.post('/:ticketId/comentarios', addComentario);
router.get('/:ticketId/comentarios', getComentarios);

// ====================================
// HISTORIAL
// ====================================
router.get('/:ticketId/historial', getTicketHistorial);

// ====================================
// ADJUNTOS
// ====================================
router.post('/:ticketId/adjuntos', upload.single('file'), uploadAdjunto);
router.get('/:ticketId/adjuntos', getAdjuntos);

export default router;