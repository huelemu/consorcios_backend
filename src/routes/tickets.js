import express from 'express';
import { getTickets, getTicketById } from '../controllers/ticketsController.js';
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Tickets
 *   description: Reclamos y solicitudes de mantenimiento
 */
router.get('/', getTickets);
router.get('/:id', getTicketById);

export default router;
