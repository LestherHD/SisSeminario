import express from 'express';
import {
  actualizar,
  crear,
  eliminar,
  enviar,
  listar,
  previsualizarDestinatarios,
} from '../controllers/campanaController.js';
import { autorizar, proteger } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @openapi
 * /api/campanas:
 *   get:
 *     tags: [Campañas]
 *     summary: Listar campañas comunitarias
 *     description: Disponible para cualquier usuario autenticado. Incluye campañas activas con comunidad y estado temporal calculado en Guatemala.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Arreglo de campañas con estado proxima, en_curso o finalizada.
 *       '401':
 *         description: Sesión no válida.
 *       '500':
 *         description: Error del servidor.
 */
router.get('/', proteger, listar);
router.get('/:id/destinatarios', proteger, previsualizarDestinatarios);
router.post('/', proteger, autorizar('admin', 'encargado'), crear);
router.put('/:id', proteger, autorizar('admin', 'encargado'), actualizar);
router.delete('/:id', proteger, autorizar('admin', 'encargado'), eliminar);
router.post('/:id/enviar', proteger, autorizar('admin', 'encargado'), enviar);

export default router;
