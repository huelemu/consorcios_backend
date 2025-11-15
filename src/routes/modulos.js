import express from 'express';
import {
  getModulos,
  getModuloById,
  getMisModulos,
  getModulosPorRol,
  createModulo,
  updateModulo,
  deleteModulo,
  asignarModuloARol,
  eliminarAsignacionModulo,
  getMatrizPermisos
} from '../controllers/modulosController.js';
import { requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// ⚠️ IMPORTANTE: Rutas especiales ANTES de /:id

// Ruta pública para usuarios autenticados - obtener sus propios módulos
router.get('/mis-modulos', getMisModulos); // GET /modulos/mis-modulos

// Rutas de administración (solo admin_global, tenant_admin)
router.get('/matriz-permisos', requireRole(['admin_global', 'tenant_admin']), getMatrizPermisos); // GET /modulos/matriz-permisos
router.get('/por-rol/:rolId', requireRole(['admin_global', 'tenant_admin']), getModulosPorRol); // GET /modulos/por-rol/:rolId

// Rutas de asignación de módulos a roles (solo admin_global)
router.post('/asignar-rol', requireRole(['admin_global']), asignarModuloARol); // POST /modulos/asignar-rol
router.delete('/eliminar-asignacion/:id', requireRole(['admin_global']), eliminarAsignacionModulo); // DELETE /modulos/eliminar-asignacion/:id

// CRUD básico (solo admin_global)
router.get('/', requireRole(['admin_global', 'tenant_admin']), getModulos); // GET /modulos
router.get('/:id', requireRole(['admin_global', 'tenant_admin']), getModuloById); // GET /modulos/:id
router.post('/', requireRole(['admin_global']), createModulo); // POST /modulos
router.put('/:id', requireRole(['admin_global']), updateModulo); // PUT /modulos/:id
router.delete('/:id', requireRole(['admin_global']), deleteModulo); // DELETE /modulos/:id

/**
 * @swagger
 * tags:
 *   name: Modulos
 *   description: Gestión de módulos del sistema y permisos por rol
 */

/**
 * @swagger
 * /modulos/mis-modulos:
 *   get:
 *     summary: Obtener módulos permitidos para el usuario autenticado
 *     tags: [Modulos]
 *     description: Devuelve los módulos que el usuario puede ver según su rol
 *     responses:
 *       200:
 *         description: Lista de módulos permitidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 rol:
 *                   type: string
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 */

/**
 * @swagger
 * /modulos:
 *   get:
 *     summary: Listar todos los módulos del sistema
 *     tags: [Modulos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista completa de módulos
 *   post:
 *     summary: Crear un nuevo módulo
 *     tags: [Modulos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - clave
 *             properties:
 *               nombre:
 *                 type: string
 *               clave:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               icono:
 *                 type: string
 *               ruta:
 *                 type: string
 *               orden:
 *                 type: integer
 *               activo:
 *                 type: boolean
 *               requiere_consorcio:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Módulo creado exitosamente
 */

/**
 * @swagger
 * /modulos/matriz-permisos:
 *   get:
 *     summary: Obtener matriz completa de permisos (roles vs módulos)
 *     tags: [Modulos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Matriz de permisos completa
 */

/**
 * @swagger
 * /modulos/por-rol/{rolId}:
 *   get:
 *     summary: Obtener módulos permitidos para un rol específico
 *     tags: [Modulos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rolId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de módulos para el rol
 */

/**
 * @swagger
 * /modulos/asignar-rol:
 *   post:
 *     summary: Asignar o actualizar permisos de un módulo a un rol
 *     tags: [Modulos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rol_id
 *               - modulo_id
 *             properties:
 *               rol_id:
 *                 type: integer
 *               modulo_id:
 *                 type: integer
 *               puede_ver:
 *                 type: boolean
 *                 default: true
 *               puede_crear:
 *                 type: boolean
 *                 default: false
 *               puede_editar:
 *                 type: boolean
 *                 default: false
 *               puede_eliminar:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Módulo asignado al rol exitosamente
 */

/**
 * @swagger
 * /modulos/{id}:
 *   get:
 *     summary: Obtener módulo por ID
 *     tags: [Modulos]
 *     security:
 *       - bearerAuth: []
 *   put:
 *     summary: Actualizar módulo
 *     tags: [Modulos]
 *     security:
 *       - bearerAuth: []
 *   delete:
 *     summary: Eliminar módulo
 *     tags: [Modulos]
 *     security:
 *       - bearerAuth: []
 */

export default router;
