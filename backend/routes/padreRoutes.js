import express from 'express';
import {
  crear,
  listar,
  obtenerPorId,
  actualizar,
  eliminar,
  reactivar,
  revocarTelegram,
} from '../controllers/padreController.js';
import { proteger, autorizar } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @openapi
 * /api/padres:
 *   get:
 *     tags: [Padres]
 *     summary: Listar padres y tutores
 *     description: Disponible para cualquier usuario autenticado; incluye la comunidad poblada.
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
 *         description: Arreglo de padres y tutores.
 *       '401':
 *         description: Sesión no válida.
 *       '500':
 *         description: Error del servidor.
 */
router.get('/', proteger, listar);
router.get('/:id', proteger, obtenerPorId);
router.post('/', proteger, autorizar('admin', 'encargado', 'personal'), crear);
router.put('/:id', proteger, autorizar('admin', 'encargado', 'personal'), actualizar);
router.patch('/:id/telegram/revocar', proteger, autorizar('admin'), revocarTelegram);
router.delete('/:id', proteger, autorizar('admin', 'encargado'), eliminar);
router.patch('/:id/reactivar', proteger, autorizar('admin', 'encargado'), reactivar);

export default router;
