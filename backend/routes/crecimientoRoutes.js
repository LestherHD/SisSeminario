import express from 'express';
import {
  registrar,
  listarPorNino,
  actualizar,
  eliminar,
  obtenerCurvas,
} from '../controllers/crecimientoController.js';
import { proteger, autorizar } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @openapi
 * /api/crecimiento:
 *   post:
 *     tags: [Crecimiento]
 *     summary: Registrar una medición de crecimiento
 *     description: Admin, encargado o personal. Calcula edad, IMC, puntajes Z y percentiles OMS según sexo y nacimiento; guarda la medición y ejecuta el motor de alertas.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nino, peso, talla]
 *             properties:
 *               nino:
 *                 type: string
 *                 description: ObjectId del niño.
 *                 example: '507f1f77bcf86cd799439013'
 *               peso:
 *                 type: number
 *                 minimum: 0
 *                 exclusiveMinimum: true
 *                 description: Peso en kilogramos.
 *                 example: 12.5
 *               talla:
 *                 type: number
 *                 minimum: 0
 *                 exclusiveMinimum: true
 *                 description: Talla en centímetros.
 *                 example: 88
 *               fecha:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha de medición; si se omite se usa la fecha actual. No puede preceder al nacimiento.
 *                 example: '2026-09-22T12:00:00Z'
 *     responses:
 *       '201':
 *         description: Medición guardada con indicadores calculados. Los indicadores sin referencia etaria disponible son null.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 nino:
 *                   type: string
 *                 peso:
 *                   type: number
 *                 talla:
 *                   type: number
 *                 fecha:
 *                   type: string
 *                   format: date-time
 *                 edadMesesExacta:
 *                   type: number
 *                 imc:
 *                   type: number
 *                 zPesoEdad:
 *                   type: number
 *                   nullable: true
 *                 zTallaEdad:
 *                   type: number
 *                   nullable: true
 *                 zImcEdad:
 *                   type: number
 *                   nullable: true
 *                 percentilPeso:
 *                   type: number
 *                   nullable: true
 *                 percentilTalla:
 *                   type: number
 *                   nullable: true
 *                 percentilImc:
 *                   type: number
 *                   nullable: true
 *                 estadoNutricional:
 *                   type: string
 *                 estadoTalla:
 *                   type: string
 *                 referenciaOms:
 *                   type: string
 *       '400':
 *         description: Peso, talla, fecha o sexo inválidos para la evaluación.
 *       '401':
 *         description: Sesión no válida.
 *       '403':
 *         description: Rol no autorizado.
 *       '404':
 *         description: Niño no encontrado.
 *       '500':
 *         description: Error del servidor.
 */
router.post('/', proteger, autorizar('admin', 'encargado', 'personal'), registrar);
router.get('/nino/:ninoId', proteger, listarPorNino);
router.get('/curvas/:ninoId', proteger, obtenerCurvas);
router.patch('/:id', proteger, autorizar('admin', 'encargado', 'personal'), actualizar);
router.delete('/:id', proteger, autorizar('admin', 'encargado', 'personal'), eliminar);

export default router;
