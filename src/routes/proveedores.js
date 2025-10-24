import express from 'express';
import { getProveedores, getProveedorById } from '../controllers/proveedoresController.js';
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Proveedores
 *   description: Gestión de proveedores y servicios
 */
router.get('/', getProveedores);
router.get('/:id', getProveedorById);

export default router;
