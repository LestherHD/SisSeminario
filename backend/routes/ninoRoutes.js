import express from 'express';
import { crear, listar, obtenerPorId, actualizar, eliminar, reactivar } from '../controllers/ninoController.js';
import { proteger, autorizar } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @openapi
 * /api/ninos:
 *   get:
 *     tags: [Niños]
 *     summary: Listar niños
 *     description: Disponible para admin, encargado y personal. Ordena por nombre completo y devuelve comunidad y nombres de padres poblados; sin paginación de servidor.
 *     x-territorio: Personal y encargados requieren asignación; los filtros no amplían su acceso.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: incluirInactivos
 *         description: Incluye también niños inactivos cuando vale true.
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       '200':
 *         description: Arreglo de niños; puede estar vacío.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   nombreCompleto:
 *                     type: string
 *                   fechaNacimiento:
 *                     type: string
 *                     format: date-time
 *                   sexo:
 *                     type: string
 *                     enum: [M, F]
 *                   comunidad:
 *                     type: object
 *                     nullable: true
 *                     properties:
 *                       _id:
 *                         type: string
 *                       nombre:
 *                         type: string
 *                       departamento:
 *                         type: string
 *                       municipio:
 *                         type: string
 *                       activo:
 *                         type: boolean
 *                   padres:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         nombreCompleto:
 *                           type: string
 *                   activo:
 *                     type: boolean
 *       '401':
 *         description: Sesión no válida.
 *       '500':
 *         description: Error al consultar los niños.
 */
router.get('/', proteger, listar);
router.get('/:id', proteger, obtenerPorId);
/**
 * @openapi
 * /api/ninos:
 *   post:
 *     tags: [Niños]
 *     summary: Registrar un niño
 *     description: Admin, encargado o personal. Calcula el nombre completo y genera código, PIN y URL del carnet. La comunidad se recibe explícitamente; los padres deben ser identificadores existentes.
 *     x-territorio: Personal y encargados requieren asignación; los filtros no amplían su acceso.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [primerNombre, primerApellido, segundoApellido, fechaNacimiento, sexo, comunidad]
 *             properties:
 *               primerNombre:
 *                 type: string
 *                 example: Ana
 *               segundoNombre:
 *                 type: string
 *                 default: ''
 *               tercerNombre:
 *                 type: string
 *                 default: ''
 *               primerApellido:
 *                 type: string
 *                 example: Pérez
 *               segundoApellido:
 *                 type: string
 *                 example: López
 *               fechaNacimiento:
 *                 type: string
 *                 format: date
 *                 example: '2024-01-15'
 *               sexo:
 *                 type: string
 *                 enum: [M, F]
 *               comunidad:
 *                 type: string
 *                 description: ObjectId de la comunidad.
 *                 example: '507f1f77bcf86cd799439011'
 *               padres:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ['507f1f77bcf86cd799439012']
 *     responses:
 *       '201':
 *         description: Documento creado, incluidos nombres, referencias sin poblar y credenciales del carnet.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 nombreCompleto:
 *                   type: string
 *                 codigoCarnet:
 *                   type: string
 *                   example: CS-1234
 *                 pin:
 *                   type: string
 *                   example: '5678'
 *                 codigoQR:
 *                   type: string
 *                   format: uri
 *                 comunidad:
 *                   type: string
 *                 padres:
 *                   type: array
 *                   items:
 *                     type: string
 *       '401':
 *         description: Sesión no válida.
 *       '403':
 *         description: Rol no autorizado.
 *       '500':
 *         description: Error de persistencia, validación Mongoose o generación de credenciales.
 */
router.post('/', proteger, autorizar('admin', 'encargado', 'personal'), crear);
router.put('/:id', proteger, autorizar('admin', 'encargado', 'personal'), actualizar);
router.delete('/:id', proteger, autorizar('admin', 'encargado'), eliminar);
router.patch('/:id/reactivar', proteger, autorizar('admin', 'encargado'), reactivar);

export default router;
