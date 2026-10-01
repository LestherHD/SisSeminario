import express from 'express';
import {
  generarCarnet,
  enviarCarnetTelegram,
  verCarnetPublico,
  verExpedienteInterno,
} from '../controllers/carnetController.js';
import { proteger, autorizar } from '../middleware/authMiddleware.js';
import { limitarConsultaCarnet } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

/**
 * @openapi
 * /api/carnet/generar/{ninoId}:
 *   get:
 *     tags: [Carnet]
 *     summary: Generar imagen QR y obtener credenciales del carnet
 *     description: Admin, encargado o personal. Conserva código y PIN existentes, crea los faltantes y actualiza la URL. Esta operación GET puede escribir en la base de datos.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ninoId
 *         required: true
 *         description: ObjectId del niño.
 *         schema:
 *           type: string
 *         example: '507f1f77bcf86cd799439013'
 *     responses:
 *       '200':
 *         description: Imagen QR en data URL, código, PIN y enlace.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 qrImagen:
 *                   type: string
 *                   description: Data URL de imagen PNG en base64.
 *                 codigoCarnet:
 *                   type: string
 *                   example: CS-1234
 *                 pin:
 *                   type: string
 *                   example: '5678'
 *                 url:
 *                   type: string
 *                   format: uri
 *                 ninoNombre:
 *                   type: string
 *       '401':
 *         description: Sesión no válida.
 *       '403':
 *         description: Rol no autorizado.
 *       '404':
 *         description: Niño no encontrado.
 *       '500':
 *         description: Error al generar el carnet.
 */
router.get('/generar/:ninoId', proteger, autorizar('admin', 'encargado', 'personal'), generarCarnet);
router.post('/enviar/:ninoId', proteger, autorizar('admin', 'encargado', 'personal'), enviarCarnetTelegram);
router.get(
  '/expediente/:ninoId',
  proteger,
  autorizar('admin', 'encargado', 'personal'),
  verExpedienteInterno
);
/**
 * @openapi
 * /api/carnet/ver/{codigo}:
 *   post:
 *     tags: [Carnet]
 *     summary: Consultar públicamente el expediente con código y PIN
 *     description: No requiere JWT. Busca un niño activo y compara el PIN como string. Permite diez intentos fallidos por IP cada quince minutos; no devuelve el PIN ni datos de contacto de los padres.
 *     security: []
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         description: Código entregado por el centro de salud.
 *         schema:
 *           type: string
 *         example: CS-1234
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pin]
 *             properties:
 *               pin:
 *                 type: string
 *                 description: PIN de cuatro dígitos del carnet.
 *                 example: '5678'
 *     responses:
 *       '200':
 *         description: Expediente de salud del niño.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 nino:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     nombreCompleto:
 *                       type: string
 *                     fechaNacimiento:
 *                       type: string
 *                       format: date-time
 *                     sexo:
 *                       type: string
 *                       enum: [M, F]
 *                     comunidad:
 *                       type: string
 *                     padres:
 *                       type: array
 *                       items:
 *                         type: string
 *                 padres:
 *                   type: array
 *                   items:
 *                     type: string
 *                 vacunas:
 *                   type: array
 *                   description: Vacunas agrupadas con conteos de dosis, fechas y estado Completa o En progreso.
 *                   items:
 *                     type: object
 *                 crecimiento:
 *                   type: array
 *                   description: Mediciones activas e indicadores OMS, ordenados por fecha descendente.
 *                   items:
 *                     type: object
 *                 alertasActivas:
 *                   type: array
 *                   description: Alertas activas no atendidas.
 *                   items:
 *                     type: object
 *       '401':
 *         description: PIN incorrecto.
 *       '404':
 *         description: Carnet inexistente o niño inactivo.
 *       '429':
 *         description: Demasiados intentos fallidos.
 *       '500':
 *         description: Error al consultar el expediente.
 */
router.post('/ver/:codigo', limitarConsultaCarnet, verCarnetPublico);

export default router;
