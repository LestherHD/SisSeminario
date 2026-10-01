import express from 'express';
import { crear, listar, obtenerPorId, actualizar, eliminar, reactivar } from '../controllers/vacunaController.js';
import { proteger, autorizar } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @openapi
 * /api/vacunas:
 *   get:
 *     tags: [Vacunas]
 *     summary: Consultar el catálogo de vacunas
 *     description: Disponible para admin, encargado y personal. Devuelve rango de edad, volumen, total de dosis e intervalo.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: incluirInactivos
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       '200':
 *         description: Arreglo de vacunas del catálogo.
 *       '401':
 *         description: Sesión no válida.
 *       '500':
 *         description: Error del servidor.
 */
router.get('/', proteger, listar);
router.get('/:id', proteger, obtenerPorId);
router.post('/', proteger, autorizar('admin', 'encargado'), crear);
router.put('/:id', proteger, autorizar('admin', 'encargado'), actualizar);
router.delete('/:id', proteger, autorizar('admin', 'encargado'), eliminar);
router.patch('/:id/reactivar', proteger, autorizar('admin', 'encargado'), reactivar);

export default router;
