import express from 'express';
import { prueba, pruebaEmail, notificarAlerta } from '../controllers/notificacionController.js';
import { proteger, autorizar } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/prueba', proteger, autorizar('admin', 'encargado'), prueba);
router.post('/prueba-email', proteger, autorizar('admin'), pruebaEmail);
/**
 * @openapi
 * /api/notificaciones/alerta:
 *   post:
 *     tags: [Notificaciones]
 *     summary: Enviar una alerta a los padres
 *     description: Admin, encargado o personal. Intenta email y Telegram según los canales del padre y registra resultados. Repetir la petición puede reenviar avisos.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [alertaId]
 *             properties:
 *               alertaId:
 *                 type: string
 *                 description: ObjectId de la alerta.
 *     responses:
 *       '200':
 *         description: Mensaje, enviadas, intentos y totalPadres; puede haber cero envíos.
 *       '401':
 *         description: Sesión no válida.
 *       '403':
 *         description: Rol no autorizado.
 *       '404':
 *         description: Alerta no encontrada.
 *       '500':
 *         description: Error del servidor.
 */
router.post('/alerta', proteger, autorizar('admin', 'encargado', 'personal'), notificarAlerta);

export default router;
