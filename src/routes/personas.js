import express from 'express';
import {
  getPersonas,
  getPersonaById,
  createPersona,
  updatePersona,
  deletePersona
} from '../controllers/personas.controller.js';

const router = express.Router();

router.get('/', getPersonas);
router.get('/:id', getPersonaById);
router.post('/', createPersona);
router.put('/:id', updatePersona);
router.delete('/:id', deletePersona);

/**
 * @swagger
 * tags:
 *   name: Personas
 *   description: Gestión de personas
 */

/**
 * @swagger
 * /personas:
 *   get:
 *     summary: Obtener todas las personas
 *     tags: [Personas]
 *     responses:
 *       200:
 *         description: Lista de personas
 *
 *   post:
 *     summary: Crear una nueva persona
 *     tags: [Personas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Persona'
 *     responses:
 *       201:
 *         description: Persona creada exitosamente
 */

/**
 * @swagger
 * /personas/{id}:
 *   get:
 *     summary: Obtener una persona por ID
 *     tags: [Personas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Persona encontrada
 *       404:
 *         description: Persona no encontrada
 *
 *   put:
 *     summary: Actualizar una persona
 *     tags: [Personas]
 *   delete:
 *     summary: Eliminar una persona
 *     tags: [Personas]
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Persona:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         nombre:
 *           type: string
 *         apellido:
 *           type: string
 *         dni:
 *           type: string
 *         telefono:
 *           type: string
 *         email:
 *           type: string
 *         direccion:
 *           type: string
 */


export default router;
