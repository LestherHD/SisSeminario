import express from 'express';
import {
  registrar,
  login,
  solicitarRecuperacion,
  restablecerPassword,
  estadoInicial,
  crearAdminInicial,
  verificarAdminInicial,
  reenviarVerificacionInicial,
} from '../controllers/authController.js';
import { autorizar, proteger } from '../middleware/authMiddleware.js';
import {
  limitarLogin,
  limitarRestablecimiento,
  limitarSolicitudRecuperacion,
  limitarConfiguracionInicial,
  limitarVerificacionInicial,
  limitarReenvioInicial,
} from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

router.get('/estado-inicial', estadoInicial);
router.post('/configuracion-inicial', limitarConfiguracionInicial, crearAdminInicial);
router.post('/verificar-configuracion-inicial', limitarVerificacionInicial, verificarAdminInicial);
router.post('/reenviar-configuracion-inicial', limitarReenvioInicial, reenviarVerificacionInicial);
router.post('/register', proteger, autorizar('admin'), registrar);
/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Autenticación]
 *     summary: Iniciar sesión
 *     description: Valida una cuenta activa y devuelve un JWT válido por siete días. Límite de diez intentos fallidos por IP cada quince minutos.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: personal@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Ejemplo123
 *     responses:
 *       '200':
 *         description: Sesión iniciada.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT para el botón Authorize de Swagger UI.
 *                 usuario:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     nombre:
 *                       type: string
 *                     email:
 *                       type: string
 *                       format: email
 *                     rol:
 *                       type: string
 *                       enum: [admin, encargado, personal]
 *       '401':
 *         description: Credenciales inválidas o cuenta inactiva.
 *       '429':
 *         description: Demasiados intentos fallidos.
 *       '500':
 *         description: Error del servidor.
 */
router.post('/login', limitarLogin, login);
router.post('/solicitar-recuperacion', limitarSolicitudRecuperacion, solicitarRecuperacion);
router.post('/restablecer-password', limitarRestablecimiento, restablecerPassword);
/**
 * @openapi
 * /api/auth/perfil:
 *   get:
 *     tags: [Autenticación]
 *     summary: Consultar el usuario autenticado
 *     description: Disponible para admin, encargado y personal. Devuelve el usuario actual de MongoDB sin contraseña ni campos ocultos de recuperación/verificación.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Perfil de la sesión.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 usuario:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     nombre:
 *                       type: string
 *                     email:
 *                       type: string
 *                       format: email
 *                     rol:
 *                       type: string
 *                       enum: [admin, encargado, personal]
 *                     activo:
 *                       type: boolean
 *                     emailVerificado:
 *                       type: boolean
 *       '401':
 *         description: Token ausente, inválido, expirado o usuario inactivo.
 */
router.get('/perfil', proteger, (req, res) => {
	res.json({ usuario: req.usuario });
});

export default router;
