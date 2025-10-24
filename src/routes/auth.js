import express from 'express';
import { 
  login, 
  register, 
  profile, 
  googleLogin,
  googleCallback 
} from '../controllers/authController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Autenticación
 *   description: Endpoints de login y registro
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión tradicional
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuario autenticado correctamente
 */
router.post('/login', login);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar nuevo usuario
 *     tags: [Autenticación]
 */
router.post('/register', register);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Obtener perfil del usuario autenticado
 *     tags: [Autenticación]
 */
router.get('/profile', profile);

/**
 * @swagger
 * /api/auth/google:
 *   post:
 *     summary: Login con Google OAuth
 *     tags: [Autenticación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               credential:
 *                 type: string
 *                 description: Token JWT de Google
 *     responses:
 *       200:
 *         description: Usuario autenticado con Google exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *       401:
 *         description: Token inválido
 */
router.post('/google', googleLogin);

/**
 * @swagger
 * /api/auth/google/callback:
 *   post:
 *     summary: Callback de Google OAuth (alias)
 *     tags: [Autenticación]
 */
router.post('/google/callback', googleCallback);

export default router;