import { Router } from 'express';
import {
  getUnidades,
  getUnidadById,
  createUnidad,      // ✅ corregido
  updateUnidad,
  deleteUnidad
} from '../controllers/unidadesController.js';

const router = Router();

router.get('/', getUnidades);
router.get('/:id', getUnidadById);
router.post('/', createUnidad);      // ✅ corregido
router.put('/:id', updateUnidad);
router.delete('/:id', deleteUnidad);

/**
 * @swagger
 * tags:
 *   name: Unidades
 *   description: Gestión de unidades funcionales
 */

/**
 * @swagger
 * /unidades:
 *   get:
 *     summary: Listar todas las unidades
 *     tags: [Unidades]
 *   post:
 *     summary: Crear una unidad
 *     tags: [Unidades]
 *
 * /unidades/{id}:
 *   get:
 *     summary: Obtener una unidad por ID
 *     tags: [Unidades]
 *   put:
 *     summary: Actualizar unidad
 *     tags: [Unidades]
 *   delete:
 *     summary: Eliminar unidad
 *     tags: [Unidades]
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Unidad:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         consorcio_id:
 *           type: integer
 *         nombre:
 *           type: string
 *         piso:
 *           type: string
 *         superficie:
 *           type: number
 */


export default router;
