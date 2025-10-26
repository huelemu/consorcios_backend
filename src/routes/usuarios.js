import express from 'express';
import {
  getUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  activarUsuario,
  desactivarUsuario,
  resetearPassword,
  getPersonasSinUsuario
} from '../controllers/usuariosController.js';

const router = express.Router();

// ⚠️ IMPORTANTE: Rutas especiales ANTES de /:id
router.get('/personas-disponibles', getPersonasSinUsuario);

// CRUD básico
router.get('/', getUsuarios);
router.get('/:id', getUsuarioById);
router.post('/', createUsuario);
router.put('/:id', updateUsuario);
router.delete('/:id', deleteUsuario);

// Acciones especiales
router.patch('/:id/activar', activarUsuario);
router.patch('/:id/desactivar', desactivarUsuario);
router.post('/:id/reset-password', resetearPassword);

/**
 * @swagger
 * tags:
 *   name: Usuarios
 *   description: Gestión de usuarios del sistema
 */

/**
 * @swagger
 * /usuarios:
 *   get:
 *     summary: Listar todos los usuarios con filtros y paginación
 *     tags: [Usuarios]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por email, username o nombre
 *       - in: query
 *         name: rol_global
 *         schema:
 *           type: string
 *       - in: query
 *         name: activo
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Lista de usuarios paginada
 *   post:
 *     summary: Crear un nuevo usuario
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - persona_id
 *               - email
 *             properties:
 *               persona_id:
 *                 type: integer
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               rol_global:
 *                 type: string
 *                 enum: [admin_global, tenant_admin, admin_consorcio, admin_edificio, propietario, inquilino, proveedor]
 *               activo:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 */

/**
 * @swagger
 * /usuarios/personas-disponibles:
 *   get:
 *     summary: Obtener personas sin usuario asignado
 *     tags: [Usuarios]
 *     responses:
 *       200:
 *         description: Lista de personas disponibles
 */

/**
 * @swagger
 * /usuarios/{id}:
 *   get:
 *     summary: Obtener usuario por ID
 *     tags: [Usuarios]
 *   put:
 *     summary: Actualizar usuario
 *     tags: [Usuarios]
 *   delete:
 *     summary: Eliminar usuario
 *     tags: [Usuarios]
 */

/**
 * @swagger
 * /usuarios/{id}/activar:
 *   patch:
 *     summary: Activar un usuario
 *     tags: [Usuarios]
 */

/**
 * @swagger
 * /usuarios/{id}/desactivar:
 *   patch:
 *     summary: Desactivar un usuario
 *     tags: [Usuarios]
 */

/**
 * @swagger
 * /usuarios/{id}/reset-password:
 *   post:
 *     summary: Enviar email de reset de contraseña
 *     tags: [Usuarios]
 */

export default router;