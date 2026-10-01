import express from 'express';
import {
  exportarExcel,
  exportarPdf,
  obtenerReporte,
} from '../controllers/reporteController.js';
import { autorizar, proteger } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @openapi
 * /api/reportes:
 *   get:
 *     tags: [Reportes]
 *     summary: Generar reporte de salud infantil
 *     description: Solo admin y encargado. Incluye comunidades y niños activos; la cobertura compara dosis aplicadas con el catálogo aplicable por edad.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: departamento
 *         schema:
 *           type: string
 *       - in: query
 *         name: municipio
 *         schema:
 *           type: string
 *       - in: query
 *         name: comunidad
 *         description: Nombre de la comunidad, no ObjectId.
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Resumen, filtros, riesgos nutricionales, vacunas incompletas, cobertura y crecimiento promedio.
 *       '401':
 *         description: Sesión no válida.
 *       '403':
 *         description: Requiere admin o encargado.
 *       '500':
 *         description: Error del servidor.
 */
router.get('/', proteger, autorizar('admin', 'encargado'), obtenerReporte);
router.get('/pdf', proteger, autorizar('admin', 'encargado'), exportarPdf);
router.get('/excel', proteger, autorizar('admin', 'encargado'), exportarExcel);

export default router;
