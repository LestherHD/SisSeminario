import express from 'express';
import {
  registrar,
  resumenPorNino,
  listarDosisPorNino,
  eliminar,
} from '../controllers/vacunacionController.js';
import { proteger, autorizar } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', proteger, autorizar('admin', 'encargado', 'personal'), registrar);
router.get('/resumen/:ninoId', proteger, resumenPorNino);
/**
 * @openapi
 * /api/vacunacion/nino/{ninoId}:
 *   get:
 *     tags: [Vacunación]
 *     summary: Consultar aplicaciones de vacunas de un niño
 *     description: Lista dosis activas con el nombre de la vacuna; disponible para cualquier usuario autenticado.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ninoId
 *         required: true
 *         description: ObjectId del niño.
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Arreglo de aplicaciones activas, posiblemente vacío.
 *       '401':
 *         description: Sesión no válida.
 *       '500':
 *         description: Error del servidor.
 */
router.get('/nino/:ninoId', proteger, listarDosisPorNino);
router.delete('/:id', proteger, autorizar('admin', 'encargado', 'personal'), eliminar);

export default router;
