import express from 'express';
import { crear, listar, obtenerPorId, actualizar, eliminar, reactivar } from '../controllers/comunidadController.js';
import { proteger, autorizar } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @openapi
 * /api/comunidades:
 *   get:
 *     tags: [Comunidades]
 *     summary: Listar comunidades y familias calculadas
 *     description: Admin, encargado o personal. Cuenta combinaciones distintas de padres de niños activos por comunidad y ordena por nombre.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: incluirInactivos
 *         description: Incluye comunidades inactivas cuando vale true.
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       '200':
 *         description: Comunidades con el campo calculado numeroFamilias.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   nombre:
 *                     type: string
 *                   departamento:
 *                     type: string
 *                   municipio:
 *                     type: string
 *                   activo:
 *                     type: boolean
 *                   numeroFamilias:
 *                     type: integer
 *                     minimum: 0
 *       '401':
 *         description: Sesión no válida.
 *       '500':
 *         description: Error al consultar comunidades.
 */
router.get('/', proteger, listar);
router.get('/:id', proteger, obtenerPorId);
router.post('/', proteger, autorizar('admin', 'encargado', 'personal'), crear);
router.put('/:id', proteger, autorizar('admin', 'encargado', 'personal'), actualizar);
router.delete('/:id', proteger, autorizar('admin', 'encargado'), eliminar);
router.patch('/:id/reactivar', proteger, autorizar('admin', 'encargado'), reactivar);

export default router;
