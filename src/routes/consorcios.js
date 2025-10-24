import express from 'express';
import {
  getConsorcios,
  getConsorcioById,
  createConsorcio,
  updateConsorcio,
  deleteConsorcio
} from '../controllers/consorciosController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Consorcios
 *   description: Administración de consorcios
 */

/**
 * @swagger
 * /api/consorcios:
 *   get:
 *     summary: Lista todos los consorcios
 *     tags: [Consorcios]
 *   post:
 *     summary: Crea un nuevo consorcio
 *     tags: [Consorcios]
 */
router.route('/')
  .get(getConsorcios)
  .post(createConsorcio);

/**
 * @swagger
 * /api/consorcios/{id}:
 *   get:
 *     summary: Obtiene un consorcio por ID
 *     tags: [Consorcios]
 *   put:
 *     summary: Actualiza un consorcio existente
 *     tags: [Consorcios]
 *   delete:
 *     summary: Elimina un consorcio
 *     tags: [Consorcios]
 */
router.route('/:id')
  .get(getConsorcioById)
  .put(updateConsorcio)
  .delete(deleteConsorcio);

export default router;
