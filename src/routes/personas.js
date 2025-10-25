import express from 'express';
import {
  getPersonas,
  getPersonaById,
  createPersona,
  updatePersona,
  deletePersona,
  searchPersonas,
  getPersonasStats
} from '../controllers/personas.controller.js';

const router = express.Router();

// ⚠️ IMPORTANTE: Las rutas especiales deben ir ANTES de /:id
// para evitar que Express las confunda con un ID
router.get('/search', searchPersonas);
router.get('/stats', getPersonasStats);

// Rutas CRUD básicas
router.get('/', getPersonas);
router.get('/:id', getPersonaById);
router.post('/', createPersona);
router.put('/:id', updatePersona);
router.delete('/:id', deletePersona);

/**
 * @swagger
 * tags:
 *   name: Personas
 *   description: Gestión de personas físicas y jurídicas
 */

/**
 * @swagger
 * /personas:
 *   get:
 *     summary: Obtener todas las personas con filtros y paginación
 *     tags: [Personas]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Cantidad de resultados por página
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Búsqueda por nombre, apellido, documento o email
 *       - in: query
 *         name: tipo_persona
 *         schema:
 *           type: string
 *           enum: [fisica, juridica]
 *         description: Filtrar por tipo de persona
 *       - in: query
 *         name: provincia
 *         schema:
 *           type: string
 *         description: Filtrar por provincia
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: fecha_creacion
 *         description: Campo para ordenar
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Orden ascendente o descendente
 *     responses:
 *       200:
 *         description: Lista de personas con paginación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Persona'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *
 *   post:
 *     summary: Crear una nueva persona
 *     tags: [Personas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PersonaInput'
 *     responses:
 *       201:
 *         description: Persona creada exitosamente
 *       409:
 *         description: Documento o email ya existe
 */

/**
 * @swagger
 * /personas/search:
 *   get:
 *     summary: Búsqueda rápida de personas
 *     tags: [Personas]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Término de búsqueda (mínimo 2 caracteres)
 *     responses:
 *       200:
 *         description: Resultados de búsqueda (máximo 20)
 */

/**
 * @swagger
 * /personas/stats:
 *   get:
 *     summary: Obtener estadísticas de personas
 *     tags: [Personas]
 *     responses:
 *       200:
 *         description: Estadísticas generales
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 fisicas:
 *                   type: integer
 *                 juridicas:
 *                   type: integer
 *                 porProvincia:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       provincia:
 *                         type: string
 *                       cantidad:
 *                         type: integer
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
 *             $ref: '#/components/schemas/PersonaInput'
 *     responses:
 *       200:
 *         description: Persona actualizada
 *       404:
 *         description: Persona no encontrada
 *       409:
 *         description: Documento o email ya existe
 *
 *   delete:
 *     summary: Eliminar una persona
 *     tags: [Personas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Persona eliminada correctamente
 *       404:
 *         description: Persona no encontrada
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
 *         documento:
 *           type: string
 *         email:
 *           type: string
 *         telefono:
 *           type: string
 *         direccion:
 *           type: string
 *         localidad:
 *           type: string
 *         provincia:
 *           type: string
 *         pais:
 *           type: string
 *         tipo_persona:
 *           type: string
 *           enum: [fisica, juridica]
 *         fecha_creacion:
 *           type: string
 *           format: date-time
 *     
 *     PersonaInput:
 *       type: object
 *       required:
 *         - nombre
 *         - documento
 *       properties:
 *         nombre:
 *           type: string
 *           example: Juan
 *         apellido:
 *           type: string
 *           example: Pérez
 *         documento:
 *           type: string
 *           example: "12345678"
 *         email:
 *           type: string
 *           example: juan.perez@email.com
 *         telefono:
 *           type: string
 *           example: "+54 11 1234-5678"
 *         direccion:
 *           type: string
 *           example: Av. Corrientes 1234
 *         localidad:
 *           type: string
 *           example: CABA
 *         provincia:
 *           type: string
 *           example: Buenos Aires
 *         pais:
 *           type: string
 *           example: Argentina
 *         tipo_persona:
 *           type: string
 *           enum: [fisica, juridica]
 *           default: fisica
 */

export default router;