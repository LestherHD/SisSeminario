import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { generarDatosReporte, contarNinosReporte } from '../services/reporteService.js';

function fechaCorta(fecha) {
  if (!fecha) return '—';
  return new Intl.DateTimeFormat('es-GT', { timeZone: 'UTC' }).format(new Date(fecha));
}

function textoFiltros(filtros) {
  return [filtros.departamento || 'Todos los departamentos', filtros.municipio, filtros.comunidad,
    filtros.sexo === 'M' ? 'Niños' : filtros.sexo === 'F' ? 'Niñas' : 'Todos los sexos',
    filtros.edadMin != null ? `Desde ${filtros.edadMin} años` : '',
    filtros.edadMax != null ? `Menores de ${filtros.edadMax + 1} años` : '',
    filtros.estadoNutricional.length ? `Estados: ${filtros.estadoNutricional.join(', ')}` : 'Todos los estados',
  ].filter(Boolean).join(' / ');
}

function nombreArchivo(extension) {
  return `reporte-sccvi-${new Date().toISOString().slice(0, 10)}.${extension}`;
}

function cabeceraPdf(doc, datos) {
  doc.fillColor('#118AB2').font('Helvetica-Bold').fontSize(17)
    .text('SCCVI - Reporte de salud infantil', 36, 28);
  doc.fillColor('#475569').font('Helvetica').fontSize(8)
    .text(`Generado: ${fechaCorta(datos.generadoEn)} | ${textoFiltros(datos.filtros)} | Modo: ${datos.opciones.general ? 'General' : datos.opciones.modo} | Agrupación: ${datos.opciones.agrupacion}`, 36, 51, { width: 770 });
  const fin = doc.y + 8;
  doc.moveTo(36, fin).lineTo(806, fin).strokeColor('#CBD5E1').stroke();
  doc.y = fin + 12;
}

function asegurarEspacio(doc, alto, datos) {
  if (doc.y + alto > doc.page.height - 34) {
    doc.addPage();
    cabeceraPdf(doc, datos);
  }
}

function tablaPdf(doc, datos, titulo, columnas, filas) {
  asegurarEspacio(doc, 50, datos);
  doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(11)
    .text(titulo, 36, doc.y, { width: 770 });
  doc.moveDown(0.5);

  const xInicial = 36;
  const altoEncabezado = 34;
  const dibujarEncabezado = () => {
    asegurarEspacio(doc, altoEncabezado * 2, datos);
    const y = doc.y;
    doc.rect(xInicial, y, 770, altoEncabezado).fill('#E0F2FE');
    let x = xInicial;
    doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(7);
    columnas.forEach((columna) => {
      doc.text(columna.titulo, x + 3, y + 6, { width: columna.ancho - 6, height: 28 });
      x += columna.ancho;
    });
    doc.y = y + altoEncabezado;
  };

  dibujarEncabezado();
  if (!filas.length) {
    doc.fillColor('#64748B').font('Helvetica-Oblique').fontSize(8)
      .text('Sin registros para los filtros seleccionados.', xInicial + 4, doc.y + 6);
    doc.y += altoEncabezado;
    return;
  }

  filas.forEach((fila, indice) => {
    doc.font('Helvetica').fontSize(7);
    const altoFila = Math.max(22, ...columnas.map((columna) => doc.heightOfString(String(fila[columna.clave] ?? '—'), { width: columna.ancho - 6 }) + 10));
    if (doc.y + altoFila > doc.page.height - 34) {
      doc.addPage();
      cabeceraPdf(doc, datos);
      doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(10)
        .text(`${titulo} (continuación)`, 36, doc.y, { width: 770 });
      doc.moveDown(0.4);
      dibujarEncabezado();
    }
    const y = doc.y;
    if (indice % 2 === 1) doc.rect(xInicial, y, 770, altoFila).fill('#F8FAFC');
    let x = xInicial;
    doc.fillColor('#1E293B').font('Helvetica').fontSize(7);
    columnas.forEach((columna) => {
      const valor = fila[columna.clave] == null ? '—' : String(fila[columna.clave]);
      doc.text(valor, x + 3, y + 5, {
        width: columna.ancho - 6,
        height: altoFila - 8,
      });
      x += columna.ancho;
    });
    doc.moveTo(xInicial, y + altoFila).lineTo(xInicial + 770, y + altoFila)
      .strokeColor('#E2E8F0').stroke();
    doc.y = y + altoFila;
  });
  doc.moveDown(1);
}

function responderError(res, error, mensaje) {
  if (!res.headersSent) return res.status(error.status || 500).json({ mensaje: error.status === 400 ? error.message : mensaje });
  res.end();
}

export async function obtenerReporte(req, res) {
  try { return res.status(200).json(await generarDatosReporte(req.query)); }
  catch (error) { return responderError(res, error, 'Error al generar el reporte'); }
}

export async function obtenerConteo(req, res) {
  try { return res.status(200).json(await contarNinosReporte(req.query)); }
  catch (error) { return responderError(res, error, 'Error al contar los niños'); }
}

function filasFormateadas(tabla) {
  return tabla.filas.map((fila) => Object.fromEntries(Object.entries(fila).map(([campo, valor]) =>
    [campo, ['fechaMedicion', 'proximaDosis'].includes(campo) ? fechaCorta(valor) : valor])));
}

export async function exportarPdf(req, res) {
  try {
    const datos = await generarDatosReporte(req.query);
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 36 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo('pdf')}"`);
    doc.pipe(res);
    cabeceraPdf(doc, datos);
    for (const tabla of datos.tablas) {
      const pesos = tabla.columnas.map(({ clave }) => ['nombre', 'nino', 'grupo', 'vacunacion', 'clasificacionNutricional'].includes(clave) ? 2 : 1);
      const total = pesos.reduce((a, b) => a + b, 0);
      tablaPdf(doc, datos, `${tabla.titulo} — ${tabla.tipo === 'detalle' ? 'Detalle' : 'Cantidades'}`,
        tabla.columnas.map((columna, indice) => ({ ...columna, ancho: 770 * pesos[indice] / total })), filasFormateadas(tabla));
    }
    doc.end();
  } catch (error) { return responderError(res, error, 'Error al exportar PDF'); }
}

const NOMBRES_HOJAS = { resumenCantidades: 'Resumen', listadoNutricional: 'Estado nutricional', vacunasIncompletas: 'Vacunas incompletas', coberturaVacunacion: 'Cobertura', crecimientoPromedio: 'Crecimiento promedio' };

export async function exportarExcel(req, res) {
  try {
    const datos = await generarDatosReporte(req.query);
    const libro = new ExcelJS.Workbook();
    libro.creator = 'SCCVI';
    libro.created = new Date();
    for (const tabla of datos.tablas) {
      let hoja = libro.getWorksheet(NOMBRES_HOJAS[tabla.seccion]);
      if (!hoja) {
        hoja = libro.addWorksheet(NOMBRES_HOJAS[tabla.seccion]);
        hoja.addRow([tabla.titulo]);
        hoja.addRow([`Generado: ${fechaCorta(datos.generadoEn)} | ${textoFiltros(datos.filtros)}`]);
        hoja.addRow([`Modo: ${datos.opciones.general ? 'General' : datos.opciones.modo} | Agrupación: ${datos.opciones.agrupacion}`]);
        hoja.views = [{ state: 'frozen', ySplit: 5 }];
      } else hoja.addRow([]);
      hoja.addRow([tabla.tipo === 'detalle' ? 'Detalle por niño' : 'Cantidades']);
      const encabezado = hoja.addRow(tabla.columnas.map((columna) => columna.titulo));
      encabezado.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      encabezado.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF118AB2' } };
      tabla.columnas.forEach((_, indice) => { hoja.getColumn(indice + 1).width = 24; });
      for (const fila of filasFormateadas(tabla)) hoja.addRow(tabla.columnas.map(({ clave }) => fila[clave]));
      if (!tabla.filas.length) hoja.addRow(['Sin registros para los filtros seleccionados.']);
      hoja.eachRow((fila) => { fila.alignment = { vertical: 'top', wrapText: true }; });
    }
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo('xlsx')}"`);
    await libro.xlsx.write(res);
    res.end();
  } catch (error) { return responderError(res, error, 'Error al exportar Excel'); }
}
