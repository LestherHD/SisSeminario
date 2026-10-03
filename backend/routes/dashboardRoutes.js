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
 *     x-territorio: Personal y encargados requieren asignación; los filtros no amplían su acceso.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: departamento
 *         schema: { type: string }
 *         description: Nombre exacto del departamento; vacío equivale a todos.
 *       - in: query
 *         name: municipio
 *         schema: { type: string }
 *       - in: query
 *         name: comunidad
 *         schema: { type: string }
 *         description: Nombre de comunidad, no ObjectId. Se combina con departamento y municipio.
 *       - in: query
 *         name: sexo
 *         schema: { type: string, enum: [M, F] }
 *       - in: query
 *         name: edadMin
 *         schema: { type: number, minimum: 0 }
 *         description: Edad mínima incluida; año promedio de 365.2425 días.
 *       - in: query
 *         name: edadMax
 *         schema: { type: number, minimum: 0 }
 *         description: Incluye edades menores a edadMax más uno.
 *       - in: query
 *         name: periodo
 *         schema:
 *           type: string
 *           enum: [mes, 3meses, 6meses, todo]
 *           default: mes
 *     responses:
 *       '400':
 *         description: Sexo o rango de edad inválidos, o filtros no escalares.
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
