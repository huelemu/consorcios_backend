import express from 'express';
import {
  invitarUsuario,
  verificarTokenInvitacion,
  googleCallback,
  reenviarInvitacion
} from '../controllers/authController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Autenticación
 *   description: Endpoints de autenticación y OAuth
 */

/**
 * @swagger
 * /auth/invitar-usuario:
 *   post:
 *     summary: Invitar a una persona para que se convierta en usuario
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - persona_id
 *               - rol_global
 *             properties:
 *               persona_id:
 *                 type: integer
 *                 description: ID de la persona a invitar
 *               rol_global:
 *                 type: string
 *                 enum: [admin_global, tenant_admin, admin_consorcio, admin_edificio, propietario, inquilino, proveedor]
 *     responses:
 *       201:
 *         description: Invitación enviada exitosamente
 *       400:
 *         description: Error de validación
 *       404:
 *         description: Persona no encontrada
 */
router.post('/invitar-usuario', invitarUsuario);

/**
 * @swagger
 * /auth/verificar-token/{token}:
 *   get:
 *     summary: Verificar si un token de invitación es válido
 *     tags: [Autenticación]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Token válido
 *       404:
 *         description: Token inválido o expirado
 */
router.get('/verificar-token/:token', verificarTokenInvitacion);

/**
 * @swagger
 * /auth/google/callback:
 *   post:
 *     summary: Callback de autenticación con Google
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_token
 *             properties:
 *               id_token:
 *                 type: string
 *                 description: Token de ID de Google
 *               invitacion_token:
 *                 type: string
 *                 description: Token de invitación (opcional, solo para activación)
 *     responses:
 *       200:
 *         description: Login/registro exitoso
 *       400:
 *         description: Error de validación
 */
router.post('/google/callback', googleCallback);

/**
 * @swagger
 * /auth/reenviar-invitacion:
 *   post:
 *     summary: Reenviar invitación a un usuario inactivo
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - usuario_id
 *             properties:
 *               usuario_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Invitación reenviada
 *       400:
 *         description: Usuario ya activo
 *       404:
 *         description: Usuario no encontrado
 */
router.post('/reenviar-invitacion', reenviarInvitacion);

export default router;  // ✅ ¡ESTA LÍNEA ES CRÍTICA!