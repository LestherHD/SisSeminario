import express from 'express';
import { registrar } from '../controllers/authController.js';
import { actualizar, cambiarEstado, listar } from '../controllers/usuarioController.js';
import { autorizar, proteger } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(proteger, autorizar('admin'));
/**
 * @openapi
 * /api/usuarios:
 *   get:
 *     tags: [Usuarios]
 *     summary: Listar cuentas del personal
 *     description: Solo admin. Incluye usuarios activos e inactivos, sin contraseña ni campos ocultos de recuperación/verificación.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Arreglo de usuarios ordenados por nombre.
 *       '401':
 *         description: Sesión no válida.
 *       '403':
 *         description: Requiere rol admin.
 *       '500':
 *         description: Error del servidor.
 */
router.get('/', listar);
router.post('/', registrar);
router.put('/:id', actualizar);
router.patch('/:id/estado', cambiarEstado);

export default router;
