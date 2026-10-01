import express from 'express';
import { listar, marcarAtendida, eliminar, analizar } from '../controllers/alertaController.js';
import { proteger, autorizar } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @openapi
 * /api/alertas:
 *   get:
 *     tags: [Alertas]
 *     summary: Consultar alertas de salud
 *     description: Disponible para cualquier usuario autenticado. Solo devuelve alertas con activo=true.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: soloActivas
 *         description: Cuando vale false incluye atendidas; nunca incluye desactivadas.
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       '200':
 *         description: Arreglo de alertas con nombre del niño, de más reciente a más antigua.
 *       '401':
 *         description: Sesión no válida.
 *       '500':
 *         description: Error del servidor.
 */
router.get('/', proteger, listar);
router.post('/analizar', proteger, autorizar('admin', 'encargado'), analizar);
router.patch('/:id/atender', proteger, autorizar('admin', 'encargado', 'personal'), marcarAtendida);
router.delete('/:id', proteger, autorizar('admin', 'encargado'), eliminar);

export default router;
