import express from 'express';
import multer from 'multer';

import {
  getConsorcios,
  getConsorcioById,
  createConsorcio,
  updateConsorcio,
  deleteConsorcio,
  getConsorciosStats,
  activarConsorcio,
  desactivarConsorcio,
  uploadConsorciosExcel
} from '../controllers/consorciosController.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

/**
 * @swagger
 * tags:
 *   name: Consorcios
 *   description: Administración de consorcios/edificios
 */

/**
 * @swagger
 * /consorcios:
 *   get:
 *     summary: Lista todos los consorcios con filtros y paginación
 *     tags: [Consorcios]
 */
router.get('/', getConsorcios);

/**
 * @swagger
 * /consorcios/stats/general:
 *   get:
 *     summary: Obtiene estadísticas generales de consorcios
 *     tags: [Consorcios]
 */
router.get('/stats/general', getConsorciosStats);

/**
 * @swagger
 * /consorcios/{id}:
 *   get:
 *     summary: Obtiene un consorcio por ID
 *     tags: [Consorcios]
 */
router.get('/:id', getConsorcioById);

/**
 * @swagger
 * /consorcios:
 *   post:
 *     summary: Crea un nuevo consorcio
 *     tags: [Consorcios]
 */
router.post('/', createConsorcio);

/**
 * @swagger
 * /consorcios/{id}:
 *   put:
 *     summary: Actualiza un consorcio existente
 *     tags: [Consorcios]
 */
router.put('/:id', updateConsorcio);

/**
 * @swagger
 * /consorcios/{id}:
 *   delete:
 *     summary: Elimina (desactiva) un consorcio
 *     tags: [Consorcios]
 */
router.delete('/:id', deleteConsorcio);

/**
 * @swagger
 * /consorcios/{id}/activar:
 *   patch:
 *     summary: Activa un consorcio
 *     tags: [Consorcios]
 */
router.patch('/:id/activar', activarConsorcio);

/**
 * @swagger
 * /consorcios/{id}/desactivar:
 *   patch:
 *     summary: Desactiva un consorcio
 *     tags: [Consorcios]
 */
router.patch('/:id/desactivar', desactivarConsorcio);

router.post('/upload-excel', upload.single('file'), uploadConsorciosExcel);

export default router;