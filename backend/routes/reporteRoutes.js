import express from 'express';
import {
  exportarExcel,
  exportarPdf,
  obtenerReporte,
  obtenerConteo,
} from '../controllers/reporteController.js';
import { autorizar, proteger } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @openapi
 * components:
 *   parameters:
 *     Reporte_departamento:
 *       in: query
 *       name: departamento
 *       description: "Nombre exacto del departamento."
 *       schema: { type: string }
 *     Reporte_municipio:
 *       in: query
 *       name: municipio
 *       description: "Nombre exacto del municipio."
 *       schema: { type: string }
 *     Reporte_comunidad:
 *       in: query
 *       name: comunidad
 *       description: "Nombre exacto de comunidad, no ObjectId."
 *       schema: { type: string }
 *     Reporte_sexo:
 *       in: query
 *       name: sexo
 *       description: "M o F; vacío equivale a todos."
 *       schema: { type: string }
 *     Reporte_edadMin:
 *       in: query
 *       name: edadMin
 *       description: "Años no negativos; mínimo incluido, año promedio de 365.2425 días."
 *       schema: { type: number }
 *     Reporte_edadMax:
 *       in: query
 *       name: edadMax
 *       description: "Años no negativos; edad menor que edadMax más uno."
 *       schema: { type: number }
 *     Reporte_estadoNutricional:
 *       in: query
 *       name: estadoNutricional
 *       description: "Lista separada por comas: normal, desnutricion, riesgo_sobrepeso, sobrepeso, obesidad, sin_datos. Desnutricion incluye delgadez y severas."
 *       schema: { type: string }
 *     Reporte_modo:
 *       in: query
 *       name: modo
 *       description: "cantidades, detalle o ambos. Sin selecciones genera el reporte general completo."
 *       schema: { type: string }
 *     Reporte_agrupacion:
 *       in: query
 *       name: agrupacion
 *       description: "general, porComunidad, porSexo o porEstadoNutricional."
 *       schema: { type: string }
 *     Reporte_general:
 *       in: query
 *       name: general
 *       description: "true restaura todas las secciones y columnas conservando filtros de población."
 *       schema: { type: boolean }
 *     Reporte_resumenCantidades:
 *       in: query
 *       name: resumenCantidades
 *       description: "Incluir sección; predeterminado true. Debe quedar al menos una sección."
 *       schema: { type: boolean }
 *     Reporte_listadoNutricional:
 *       in: query
 *       name: listadoNutricional
 *       description: "Incluir sección; predeterminado true. Debe quedar al menos una sección."
 *       schema: { type: boolean }
 *     Reporte_vacunasIncompletas:
 *       in: query
 *       name: vacunasIncompletas
 *       description: "Incluir sección; predeterminado true. Debe quedar al menos una sección."
 *       schema: { type: boolean }
 *     Reporte_coberturaVacunacion:
 *       in: query
 *       name: coberturaVacunacion
 *       description: "Incluir sección; predeterminado true. Debe quedar al menos una sección."
 *       schema: { type: boolean }
 *     Reporte_crecimientoPromedio:
 *       in: query
 *       name: crecimientoPromedio
 *       description: "Incluir sección; predeterminado true. Debe quedar al menos una sección."
 *       schema: { type: boolean }
 *     Reporte_col_nombre:
 *       in: query
 *       name: col_nombre
 *       description: "Incluir columna de detalle; predeterminado true. El prefijo col_ distingue columnas de filtros."
 *       schema: { type: boolean }
 *     Reporte_col_edad:
 *       in: query
 *       name: col_edad
 *       description: "Incluir columna de detalle; predeterminado true. El prefijo col_ distingue columnas de filtros."
 *       schema: { type: boolean }
 *     Reporte_col_sexo:
 *       in: query
 *       name: col_sexo
 *       description: "Incluir columna de detalle; predeterminado true. El prefijo col_ distingue columnas de filtros."
 *       schema: { type: boolean }
 *     Reporte_col_comunidad:
 *       in: query
 *       name: col_comunidad
 *       description: "Incluir columna de detalle; predeterminado true. El prefijo col_ distingue columnas de filtros."
 *       schema: { type: boolean }
 *     Reporte_col_peso:
 *       in: query
 *       name: col_peso
 *       description: "Incluir columna de detalle; predeterminado true. El prefijo col_ distingue columnas de filtros."
 *       schema: { type: boolean }
 *     Reporte_col_talla:
 *       in: query
 *       name: col_talla
 *       description: "Incluir columna de detalle; predeterminado true. El prefijo col_ distingue columnas de filtros."
 *       schema: { type: boolean }
 *     Reporte_col_clasificacionNutricional:
 *       in: query
 *       name: col_clasificacionNutricional
 *       description: "Incluir columna de detalle; predeterminado true. El prefijo col_ distingue columnas de filtros."
 *       schema: { type: boolean }
 *     Reporte_col_vacunacion:
 *       in: query
 *       name: col_vacunacion
 *       description: "Incluir columna de detalle; predeterminado true. El prefijo col_ distingue columnas de filtros."
 *       schema: { type: boolean }
 * /api/reportes:
 *   get:
 *     tags: [Reportes]
 *     summary: Generar datos del reporte
 *     description: Solo admin y encargado. Niños y comunidades activos. Las tablas personalizadas contienen únicamente secciones y columnas seleccionadas.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/Reporte_departamento'
 *       - $ref: '#/components/parameters/Reporte_municipio'
 *       - $ref: '#/components/parameters/Reporte_comunidad'
 *       - $ref: '#/components/parameters/Reporte_sexo'
 *       - $ref: '#/components/parameters/Reporte_edadMin'
 *       - $ref: '#/components/parameters/Reporte_edadMax'
 *       - $ref: '#/components/parameters/Reporte_estadoNutricional'
 *       - $ref: '#/components/parameters/Reporte_modo'
 *       - $ref: '#/components/parameters/Reporte_agrupacion'
 *       - $ref: '#/components/parameters/Reporte_general'
 *       - $ref: '#/components/parameters/Reporte_resumenCantidades'
 *       - $ref: '#/components/parameters/Reporte_listadoNutricional'
 *       - $ref: '#/components/parameters/Reporte_vacunasIncompletas'
 *       - $ref: '#/components/parameters/Reporte_coberturaVacunacion'
 *       - $ref: '#/components/parameters/Reporte_crecimientoPromedio'
 *       - $ref: '#/components/parameters/Reporte_col_nombre'
 *       - $ref: '#/components/parameters/Reporte_col_edad'
 *       - $ref: '#/components/parameters/Reporte_col_sexo'
 *       - $ref: '#/components/parameters/Reporte_col_comunidad'
 *       - $ref: '#/components/parameters/Reporte_col_peso'
 *       - $ref: '#/components/parameters/Reporte_col_talla'
 *       - $ref: '#/components/parameters/Reporte_col_clasificacionNutricional'
 *       - $ref: '#/components/parameters/Reporte_col_vacunacion'
 *     responses:
 *       '200':
 *         description: General conserva campos históricos y agrega listadoNutricional/tablas. Personalizado devuelve generadoEn, filtros, opciones, coincidencias y tablas.
 *       '400':
 *         description: Filtros o selecciones inválidos.
 *       '401':
 *         description: Sesión no válida.
 *       '403':
 *         description: Requiere admin o encargado.
 *       '500':
 *         description: Error del servidor.
 * /api/reportes/conteo:
 *   get:
 *     tags: [Reportes]
 *     summary: Contar niños de la población seleccionada
 *     description: Solo admin y encargado. Niños y comunidades activos. Las tablas personalizadas contienen únicamente secciones y columnas seleccionadas.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/Reporte_departamento'
 *       - $ref: '#/components/parameters/Reporte_municipio'
 *       - $ref: '#/components/parameters/Reporte_comunidad'
 *       - $ref: '#/components/parameters/Reporte_sexo'
 *       - $ref: '#/components/parameters/Reporte_edadMin'
 *       - $ref: '#/components/parameters/Reporte_edadMax'
 *       - $ref: '#/components/parameters/Reporte_estadoNutricional'
 *     responses:
 *       '200':
 *         description: Cantidad de niños coincidentes.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ninos: { type: integer, minimum: 0 }
 *       '400':
 *         description: Filtros o selecciones inválidos.
 *       '401':
 *         description: Sesión no válida.
 *       '403':
 *         description: Requiere admin o encargado.
 *       '500':
 *         description: Error del servidor.
 * /api/reportes/pdf:
 *   get:
 *     tags: [Reportes]
 *     summary: Exportar reporte PDF
 *     description: Solo admin y encargado. Niños y comunidades activos. Las tablas personalizadas contienen únicamente secciones y columnas seleccionadas.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/Reporte_departamento'
 *       - $ref: '#/components/parameters/Reporte_municipio'
 *       - $ref: '#/components/parameters/Reporte_comunidad'
 *       - $ref: '#/components/parameters/Reporte_sexo'
 *       - $ref: '#/components/parameters/Reporte_edadMin'
 *       - $ref: '#/components/parameters/Reporte_edadMax'
 *       - $ref: '#/components/parameters/Reporte_estadoNutricional'
 *       - $ref: '#/components/parameters/Reporte_modo'
 *       - $ref: '#/components/parameters/Reporte_agrupacion'
 *       - $ref: '#/components/parameters/Reporte_general'
 *       - $ref: '#/components/parameters/Reporte_resumenCantidades'
 *       - $ref: '#/components/parameters/Reporte_listadoNutricional'
 *       - $ref: '#/components/parameters/Reporte_vacunasIncompletas'
 *       - $ref: '#/components/parameters/Reporte_coberturaVacunacion'
 *       - $ref: '#/components/parameters/Reporte_crecimientoPromedio'
 *       - $ref: '#/components/parameters/Reporte_col_nombre'
 *       - $ref: '#/components/parameters/Reporte_col_edad'
 *       - $ref: '#/components/parameters/Reporte_col_sexo'
 *       - $ref: '#/components/parameters/Reporte_col_comunidad'
 *       - $ref: '#/components/parameters/Reporte_col_peso'
 *       - $ref: '#/components/parameters/Reporte_col_talla'
 *       - $ref: '#/components/parameters/Reporte_col_clasificacionNutricional'
 *       - $ref: '#/components/parameters/Reporte_col_vacunacion'
 *     responses:
 *       '200':
 *         description: Archivo con las selecciones solicitadas.
 *         content:
 *           application/pdf:
 *             schema: { type: string, format: binary }
 *       '400':
 *         description: Filtros o selecciones inválidos.
 *       '401':
 *         description: Sesión no válida.
 *       '403':
 *         description: Requiere admin o encargado.
 *       '500':
 *         description: Error del servidor.
 * /api/reportes/excel:
 *   get:
 *     tags: [Reportes]
 *     summary: Exportar reporte Excel
 *     description: Solo admin y encargado. Niños y comunidades activos. Las tablas personalizadas contienen únicamente secciones y columnas seleccionadas.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/Reporte_departamento'
 *       - $ref: '#/components/parameters/Reporte_municipio'
 *       - $ref: '#/components/parameters/Reporte_comunidad'
 *       - $ref: '#/components/parameters/Reporte_sexo'
 *       - $ref: '#/components/parameters/Reporte_edadMin'
 *       - $ref: '#/components/parameters/Reporte_edadMax'
 *       - $ref: '#/components/parameters/Reporte_estadoNutricional'
 *       - $ref: '#/components/parameters/Reporte_modo'
 *       - $ref: '#/components/parameters/Reporte_agrupacion'
 *       - $ref: '#/components/parameters/Reporte_general'
 *       - $ref: '#/components/parameters/Reporte_resumenCantidades'
 *       - $ref: '#/components/parameters/Reporte_listadoNutricional'
 *       - $ref: '#/components/parameters/Reporte_vacunasIncompletas'
 *       - $ref: '#/components/parameters/Reporte_coberturaVacunacion'
 *       - $ref: '#/components/parameters/Reporte_crecimientoPromedio'
 *       - $ref: '#/components/parameters/Reporte_col_nombre'
 *       - $ref: '#/components/parameters/Reporte_col_edad'
 *       - $ref: '#/components/parameters/Reporte_col_sexo'
 *       - $ref: '#/components/parameters/Reporte_col_comunidad'
 *       - $ref: '#/components/parameters/Reporte_col_peso'
 *       - $ref: '#/components/parameters/Reporte_col_talla'
 *       - $ref: '#/components/parameters/Reporte_col_clasificacionNutricional'
 *       - $ref: '#/components/parameters/Reporte_col_vacunacion'
 *     responses:
 *       '200':
 *         description: Archivo con las selecciones solicitadas.
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema: { type: string, format: binary }
 *       '400':
 *         description: Filtros o selecciones inválidos.
 *       '401':
 *         description: Sesión no válida.
 *       '403':
 *         description: Requiere admin o encargado.
 *       '500':
 *         description: Error del servidor.
 */
router.get('/', proteger, autorizar('admin', 'encargado'), obtenerReporte);
router.get('/conteo', proteger, autorizar('admin', 'encargado'), obtenerConteo);
router.get('/pdf', proteger, autorizar('admin', 'encargado'), exportarPdf);
router.get('/excel', proteger, autorizar('admin', 'encargado'), exportarExcel);

export default router;
