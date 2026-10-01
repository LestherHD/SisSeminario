import express from 'express';
import { obtenerEstadisticas } from '../controllers/dashboardController.js';
import { autorizar, proteger } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @openapi
 * /api/dashboard:
 *   get:
 *     tags: [Dashboard]
 *     summary: Obtener indicadores del sistema
 *     description: Solo admin y encargado. El período afecta la actividad; los totales y distribuciones reflejan el estado actual.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: periodo
 *         schema:
 *           type: string
 *           enum: [mes, 3meses, 6meses, todo]
 *           default: mes
 *     responses:
 *       '200':
 *         description: Totales, nutrición, vacunación, actividad, ubicaciones y alertas.
 *       '401':
 *         description: Sesión no válida.
 *       '403':
 *         description: Requiere admin o encargado.
 *       '500':
 *         description: Error del servidor.
 */
router.get('/', proteger, autorizar('admin', 'encargado'), obtenerEstadisticas);

export default router;
