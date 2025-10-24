import express from 'express';
import { login, register, profile, googleLogin } from '../controllers/authController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Autenticación
 *   description: Endpoints de autenticación
 */

// Ruta de Google OAuth
router.post('/google', googleLogin);

// Rutas tradicionales
router.post('/login', login);
router.post('/register', register);
router.get('/profile', profile);

export default router;