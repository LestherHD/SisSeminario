import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { generarDatosReporte } from '../services/reporteService.js';

function fechaCorta(fecha) {
  if (!fecha) return '—';
  return new Intl.DateTimeFormat('es-GT', { timeZone: 'UTC' }).format(new Date(fecha));
}

function textoFiltros(filtros) {
  return [filtros.departamento, filtros.municipio, filtros.comunidad]
    .filter(Boolean)
    .join(' / ') || 'Todas las ubicaciones';
}

function nombreArchivo(extension) {
  return `reporte-sccvi-${new Date().toISOString().slice(0, 10)}.${extension}`;
}

function cabeceraPdf(doc, datos) {
  doc.fillColor('#118AB2').font('Helvetica-Bold').fontSize(17)
    .text('SCCVI - Reporte de salud infantil', 36, 28);
  doc.fillColor('#475569').font('Helvetica').fontSize(8)
    .text(`Generado: ${fechaCorta(datos.generadoEn)} | Ubicación: ${textoFiltros(datos.filtros)}`, 36, 51);
  doc.moveTo(36, 66).lineTo(806, 66).strokeColor('#CBD5E1').stroke();
  doc.y = 77;
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
  const altoFila = 22;
  const dibujarEncabezado = () => {
    asegurarEspacio(doc, altoFila * 2, datos);
    const y = doc.y;
    doc.rect(xInicial, y, 770, altoFila).fill('#E0F2FE');
    let x = xInicial;
    doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(7);
    columnas.forEach((columna) => {
      doc.text(columna.titulo, x + 3, y + 6, { width: columna.ancho - 6, height: 12 });
      x += columna.ancho;
    });
    doc.y = y + altoFila;
  };

  dibujarEncabezado();
  if (!filas.length) {
    doc.fillColor('#64748B').font('Helvetica-Oblique').fontSize(8)
      .text('Sin registros para los filtros seleccionados.', xInicial + 4, doc.y + 6);
    doc.y += altoFila;
    return;
  }

  filas.forEach((fila, indice) => {
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
        ellipsis: true,
      });
      x += columna.ancho;
    });
    doc.moveTo(xInicial, y + altoFila).lineTo(xInicial + 770, y + altoFila)
      .strokeColor('#E2E8F0').stroke();
    doc.y = y + altoFila;
  });
  doc.moveDown(1);
}

export async function obtenerReporte(req, res) {
  try {
    return res.status(200).json(await generarDatosReporte(req.query));
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al generar el reporte', error: error.message });
  }
}

export async function exportarPdf(req, res) {
  try {
    const datos = await generarDatosReporte(req.query);
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 36 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo('pdf')}"`);
    doc.pipe(res);
    cabeceraPdf(doc, datos);

    doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(11).text('Resumen general');
    doc.moveDown(0.4);
    doc.font('Helvetica').fontSize(9).fillColor('#334155').text(
      `Niños: ${datos.resumen.ninos}   Comunidades: ${datos.resumen.comunidades}   ` +
      `Riesgos nutricionales: ${datos.resumen.riesgosNutricionales}   ` +
      `Vacunas incompletas: ${datos.resumen.vacunasIncompletas}`
    );
    doc.moveDown(1.2);

    tablaPdf(doc, datos, 'Niños con bajo peso, sobrepeso u obesidad', [
      { clave: 'nino', titulo: 'Niño', ancho: 125 },
      { clave: 'edad', titulo: 'Edad', ancho: 35 },
      { clave: 'comunidad', titulo: 'Comunidad', ancho: 95 },
      { clave: 'municipio', titulo: 'Municipio', ancho: 90 },
      { clave: 'clasificacion', titulo: 'Clasificación', ancho: 120 },
      { clave: 'peso', titulo: 'Peso', ancho: 45 },
      { clave: 'talla', titulo: 'Talla', ancho: 45 },
      { clave: 'imc', titulo: 'IMC', ancho: 45 },
      { clave: 'zPeso', titulo: 'Z peso', ancho: 45 },
      { clave: 'zImc', titulo: 'Z IMC', ancho: 45 },
      { clave: 'fechaMedicion', titulo: 'Medición', ancho: 80 },
    ], datos.riesgosNutricionales.map((item) => ({
      ...item,
      edad: `${item.edad} años`,
      fechaMedicion: fechaCorta(item.fechaMedicion),
    })));

    tablaPdf(doc, datos, 'Vacunas incompletas', [
      { clave: 'nino', titulo: 'Niño', ancho: 145 },
      { clave: 'edad', titulo: 'Edad', ancho: 40 },
      { clave: 'comunidad', titulo: 'Comunidad', ancho: 105 },
      { clave: 'municipio', titulo: 'Municipio', ancho: 95 },
      { clave: 'vacuna', titulo: 'Vacuna', ancho: 120 },
      { clave: 'dosis', titulo: 'Dosis', ancho: 55 },
      { clave: 'estado', titulo: 'Estado', ancho: 80 },
      { clave: 'proximaDosis', titulo: 'Fecha pendiente', ancho: 95 },
    ], datos.vacunasIncompletas.map((item) => ({
      ...item,
      edad: `${item.edad} años`,
      dosis: `${item.dosisAplicadas}/${item.dosisRequeridas}`,
      proximaDosis: fechaCorta(item.proximaDosis),
    })));

    tablaPdf(doc, datos, 'Cobertura de vacunación por comunidad', [
      { clave: 'departamento', titulo: 'Departamento', ancho: 130 },
      { clave: 'municipio', titulo: 'Municipio', ancho: 135 },
      { clave: 'comunidad', titulo: 'Comunidad', ancho: 145 },
      { clave: 'ninos', titulo: 'Niños', ancho: 60 },
      { clave: 'esquemasCompletos', titulo: 'Esquemas completos', ancho: 100 },
      { clave: 'dosis', titulo: 'Dosis aplicadas', ancho: 100 },
      { clave: 'coberturaTexto', titulo: 'Cobertura', ancho: 100 },
    ], datos.coberturaVacunacion.map((item) => ({
      ...item,
      dosis: `${item.dosisAplicadas}/${item.dosisRequeridas}`,
      coberturaTexto: item.cobertura == null ? 'No aplica' : `${item.cobertura}%`,
    })));

    tablaPdf(doc, datos, 'Crecimiento promedio por región', [
      { clave: 'departamento', titulo: 'Departamento', ancho: 140 },
      { clave: 'municipio', titulo: 'Municipio', ancho: 140 },
      { clave: 'comunidad', titulo: 'Comunidad', ancho: 150 },
      { clave: 'ninosConMedicion', titulo: 'Niños medidos', ancho: 90 },
      { clave: 'pesoPromedio', titulo: 'Peso promedio kg', ancho: 85 },
      { clave: 'tallaPromedio', titulo: 'Talla promedio cm', ancho: 85 },
      { clave: 'imcPromedio', titulo: 'IMC promedio', ancho: 80 },
    ], datos.crecimientoPromedio);

    doc.end();
  } catch (error) {
    if (!res.headersSent) {
      return res.status(500).json({ mensaje: 'Error al exportar PDF', error: error.message });
    }
    res.end();
  }
}

function prepararHoja(libro, nombre, columnas, filas) {
  const hoja = libro.addWorksheet(nombre);
  hoja.columns = columnas;
  hoja.addRows(filas);
  hoja.views = [{ state: 'frozen', ySplit: 1 }];
  hoja.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  hoja.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF118AB2' } };
  hoja.getRow(1).alignment = { vertical: 'middle', wrapText: true };
  hoja.autoFilter = { from: 'A1', to: `${String.fromCharCode(64 + columnas.length)}1` };
  hoja.eachRow((fila, numero) => {
    if (numero > 1) fila.alignment = { vertical: 'top', wrapText: true };
  });
  return hoja;
}

export async function exportarExcel(req, res) {
  try {
    const datos = await generarDatosReporte(req.query);
    const libro = new ExcelJS.Workbook();
    libro.creator = 'SCCVI';
    libro.created = new Date();

    prepararHoja(libro, 'Riesgos nutricionales', [
      { header: 'Niño', key: 'nino', width: 28 },
      { header: 'Edad', key: 'edad', width: 10 },
      { header: 'Departamento', key: 'departamento', width: 20 },
      { header: 'Municipio', key: 'municipio', width: 20 },
      { header: 'Comunidad', key: 'comunidad', width: 22 },
      { header: 'Clasificación', key: 'clasificacion', width: 24 },
      { header: 'Peso kg', key: 'peso', width: 12 },
      { header: 'Talla cm', key: 'talla', width: 12 },
      { header: 'IMC', key: 'imc', width: 12 },
      { header: 'Z peso', key: 'zPeso', width: 12 },
      { header: 'Z IMC', key: 'zImc', width: 12 },
      { header: 'Fecha medición', key: 'fechaMedicion', width: 16 },
    ], datos.riesgosNutricionales.map((item) => ({
      ...item,
      fechaMedicion: fechaCorta(item.fechaMedicion),
    })));

    prepararHoja(libro, 'Vacunas incompletas', [
      { header: 'Niño', key: 'nino', width: 28 },
      { header: 'Edad', key: 'edad', width: 10 },
      { header: 'Departamento', key: 'departamento', width: 20 },
      { header: 'Municipio', key: 'municipio', width: 20 },
      { header: 'Comunidad', key: 'comunidad', width: 22 },
      { header: 'Vacuna', key: 'vacuna', width: 24 },
      { header: 'Dosis aplicadas', key: 'dosisAplicadas', width: 16 },
      { header: 'Dosis requeridas', key: 'dosisRequeridas', width: 16 },
      { header: 'Estado', key: 'estado', width: 15 },
      { header: 'Próxima dosis', key: 'proximaDosis', width: 16 },
    ], datos.vacunasIncompletas.map((item) => ({
      ...item,
      proximaDosis: fechaCorta(item.proximaDosis),
    })));

    prepararHoja(libro, 'Cobertura por comunidad', [
      { header: 'Departamento', key: 'departamento', width: 20 },
      { header: 'Municipio', key: 'municipio', width: 20 },
      { header: 'Comunidad', key: 'comunidad', width: 22 },
      { header: 'Niños', key: 'ninos', width: 10 },
      { header: 'Esquemas completos', key: 'esquemasCompletos', width: 20 },
      { header: 'Dosis aplicadas', key: 'dosisAplicadas', width: 16 },
      { header: 'Dosis requeridas', key: 'dosisRequeridas', width: 16 },
      { header: 'Cobertura %', key: 'cobertura', width: 14 },
    ], datos.coberturaVacunacion);

    prepararHoja(libro, 'Crecimiento promedio', [
      { header: 'Departamento', key: 'departamento', width: 20 },
      { header: 'Municipio', key: 'municipio', width: 20 },
      { header: 'Comunidad', key: 'comunidad', width: 22 },
      { header: 'Niños medidos', key: 'ninosConMedicion', width: 16 },
      { header: 'Peso promedio kg', key: 'pesoPromedio', width: 18 },
      { header: 'Talla promedio cm', key: 'tallaPromedio', width: 18 },
      { header: 'IMC promedio', key: 'imcPromedio', width: 16 },
    ], datos.crecimientoPromedio);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo('xlsx')}"`);
    await libro.xlsx.write(res);
    res.end();
  } catch (error) {
    if (!res.headersSent) {
      return res.status(500).json({ mensaje: 'Error al exportar Excel', error: error.message });
    }
    res.end();
  }
}
