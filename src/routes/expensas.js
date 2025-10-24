import express from 'express';
import { getExpensas, getExpensaById } from '../controllers/expensasController.js';
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Expensas
 *   description: Administración de expensas y pagos
 */
router.get('/', getExpensas);
router.get('/:id', getExpensaById);

export default router;
