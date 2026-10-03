import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import ExcelJS from 'exceljs';
import { once } from 'node:events';
import { inflateSync } from 'node:zlib';
import { generarDatosReporte, contarNinosReporte } from '../services/reporteService.js';
import { opcionesReporte, SECCIONES, COLUMNAS } from '../services/reporteOpciones.js';
import { exportarPdf, exportarExcel, obtenerConteo } from '../controllers/reporteController.js';
import Comunidad from '../models/Comunidad.js';
import Nino from '../models/Nino.js';
import RegistroCrecimiento from '../models/RegistroCrecimiento.js';
import Vacuna from '../models/Vacuna.js';
import Vacunacion from '../models/Vacunacion.js';

const elegir = (seleccion) => Object.fromEntries(SECCIONES.map((campo) => [campo, String(seleccion.includes(campo))]));
const columnas = (seleccion) => Object.fromEntries(Object.keys(COLUMNAS).map((campo) => [`col_${campo}`, String(seleccion.includes(campo))]));

test('Reportes: valida opciones y rechaza selecciones vacías', () => {
  assert.equal(opcionesReporte({}).general, true);
  assert.deepEqual(opcionesReporte({ estadoNutricional: ['normal', 'obesidad'] }).filtros.estadoNutricional, ['normal', 'obesidad']);
  for (const query of [{ modo: 'otro' }, { agrupacion: 'otra' }, { sexo: 'X' }, { edadMin: '-1' }, { edadMax: '1e99' }, { edadMin: '5', edadMax: '4' }, { comunidad: {} }, { estadoNutricional: 'inventado' }, { col_nombre: '0' }, elegir([]), { modo: 'detalle', ...columnas([]) }]) {
    assert.throws(() => opcionesReporte(query), { status: 400 });
  }
});

test('Reportes: población, última medición, presentación y exportaciones HTTP', async (t) => {
  const hoy = new Date();
  const nacimiento = (edad) => new Date(hoy - edad * 365.2425 * 86400000);
  const comunidades = [
    { _id: 'c1', nombre: 'La Colina', departamento: 'El Progreso', municipio: 'Sanarate', activo: true },
    { _id: 'c2', nombre: 'Centro', departamento: 'El Progreso', municipio: 'Sanarate', activo: true },
    { _id: 'c3', nombre: 'Inactiva', departamento: 'El Progreso', municipio: 'Sanarate', activo: false },
  ];
  const ninos = [
    { _id: 'n1', nombreCompleto: 'Ana Prueba', sexo: 'F', fechaNacimiento: nacimiento(5.5), comunidad: 'c1', activo: true },
    { _id: 'n2', nombreCompleto: 'Luis Prueba', sexo: 'M', fechaNacimiento: nacimiento(4), comunidad: 'c1', activo: true },
    { _id: 'n3', nombreCompleto: 'Eva Prueba', sexo: 'F', fechaNacimiento: nacimiento(3), comunidad: 'c2', activo: true },
    { _id: 'n4', nombreCompleto: 'Inactivo', sexo: 'F', fechaNacimiento: nacimiento(3), comunidad: 'c1', activo: false },
    { _id: 'n5', nombreCompleto: 'Comunidad inactiva', sexo: 'F', fechaNacimiento: nacimiento(3), comunidad: 'c3', activo: true },
  ];
  const registros = [
    { nino: 'n1', estadoNutricional: 'obesidad', peso: 30, talla: 110, imc: 24.79, activo: true, fecha: hoy },
    { nino: 'n1', estadoNutricional: 'normal', peso: 20, talla: 110, activo: true, fecha: new Date('2020-01-01') },
    { nino: 'n2', estadoNutricional: 'delgadez_severa', peso: 10, talla: 105, imc: 9.07, activo: true, fecha: hoy },
    { nino: 'n3', estadoNutricional: 'normal', activo: false, fecha: hoy },
  ];
  const vacunas = [{ _id: 'v1', nombre: 'Vacuna de prueba', numeroDosis: 2, rangoEdad: '0-10', activo: true }];
  const aplicaciones = [{ nino: 'n1', vacuna: 'v1', activo: true, fechaAplicada: hoy }];
  for (const [modelo, datos] of [[Comunidad, comunidades], [Nino, ninos], [RegistroCrecimiento, registros], [Vacuna, vacunas], [Vacunacion, aplicaciones]]) {
    const original = modelo.find;
    t.after(() => { modelo.find = original; });
    modelo.find = (filtro) => {
      let filas = datos.filter((fila) => Object.entries(filtro).every(([campo, valor]) => valor?.$in ? valor.$in.includes(fila[campo]) : fila[campo] === valor));
      return { select() { return this; }, sort(orden) {
        const [campo, direccion] = Object.entries(orden)[0];
        filas = [...filas].sort((a, b) => a[campo] > b[campo] ? direccion : a[campo] < b[campo] ? -direccion : 0);
        return this;
      }, lean: async () => filas };
    };
  }
  const general = await generarDatosReporte();
  const propio = await generarDatosReporte({}, { comunidades: ['c1'] });
  assert.equal(propio.resumen.ninos, 2);
  assert.ok(!JSON.stringify(propio).includes('Eva Prueba'));
  assert.equal((await contarNinosReporte({ comunidad: 'Centro' }, { comunidades: ['c1'] })).ninos, 0);
  assert.equal(general.resumen.ninos, 3);
  assert.equal(general.tablas.length, 5);
  assert.equal(general.listadoNutricional.length, 3);
  assert.equal(general.listadoNutricional.find((fila) => fila.id === 'n3').estadoNutricional, 'sin_datos');
  assert.equal(general.listadoNutricional.find((fila) => fila.id === 'n1').estadoNutricional, 'obesidad');
  assert.equal(general.listadoNutricional.find((fila) => fila.id === 'n2').estadoNutricional, 'desnutricion');
  assert.equal((await contarNinosReporte({ edadMax: '5', sexo: 'F' })).ninos, 2);
  assert.equal((await contarNinosReporte({ edadMin: '6' })).ninos, 0);
  assert.equal((await contarNinosReporte({ estadoNutricional: 'normal' })).ninos, 0);
  assert.equal((await contarNinosReporte({ estadoNutricional: 'desnutricion,obesidad' })).ninos, 2);
  const filtro = { sexo: 'F', comunidad: 'La Colina', edadMin: '0', edadMax: '5', estadoNutricional: 'obesidad' };
  assert.equal((await contarNinosReporte(filtro)).ninos, 1);
  const cantidades = { ...filtro, modo: 'cantidades', agrupacion: 'porComunidad', ...elegir(['listadoNutricional', 'coberturaVacunacion']) };
  const datosCantidades = await generarDatosReporte(cantidades);
  assert.equal(datosCantidades.tablas.length, 2);
  assert.equal(datosCantidades.tablas[0].filas[0].obesidad, 1);
  assert.equal(datosCantidades.tablas[1].filas[0].cobertura, 50);
  assert.ok(!JSON.stringify(datosCantidades).includes('Ana Prueba'));
  assert.ok(!('listadoNutricional' in datosCantidades));
  const detalle = { modo: 'detalle', ...elegir(['listadoNutricional']), ...columnas(['edad', 'clasificacionNutricional']) };
  const datosDetalle = await generarDatosReporte(detalle);
  assert.equal(datosDetalle.tablas[0].filas.length, 3);
  assert.deepEqual(Object.keys(datosDetalle.tablas[0].filas[0]), ['edad', 'clasificacionNutricional']);
  assert.ok(!JSON.stringify(datosDetalle).includes('Prueba'));
  for (const agrupacion of ['general', 'porSexo', 'porComunidad', 'porEstadoNutricional']) {
    const datos = await generarDatosReporte({ modo: 'cantidades', agrupacion });
    assert.equal(datos.tablas[0].filas.reduce((s, fila) => s + fila.ninos, 0), 3);
  }
  const vacio = await generarDatosReporte({ comunidad: 'No existe', modo: 'cantidades' });
  assert.equal(vacio.coincidencias, 0);
  assert.equal(vacio.tablas[0].filas[0].ninos, 0);

  // Servidor aislado: ejecuta controladores reales sin arrancar scheduler ni bot.
  const app = express();
  app.get('/pdf', exportarPdf);
  app.get('/excel', exportarExcel);
  app.get('/conteo', obtenerConteo);
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const origen = `http://127.0.0.1:${server.address().port}`;
  const get = (ruta, query) => fetch(`${origen}/${ruta}?${new URLSearchParams(query)}`);
  const respuestaConteo = await get('conteo', filtro);
  assert.deepEqual(await respuestaConteo.json(), { ninos: 1 });
  assert.equal((await get('pdf', { modo: 'detalle', ...columnas([]) })).status, 400);
  for (const opciones of [cantidades, detalle, { modo: 'ambos', ...elegir(['listadoNutricional']), ...columnas(['nombre']) }, {}]) {
    const respuesta = await get('excel', opciones);
    assert.equal(respuesta.status, 200);
    const libro = new ExcelJS.Workbook();
    await libro.xlsx.load(Buffer.from(await respuesta.arrayBuffer()));
    const esperado = opciones === cantidades ? 2 : opciones === detalle || opciones.modo === 'ambos' ? 1 : 5;
    assert.equal(libro.worksheets.length, esperado);
    const texto = JSON.stringify(libro.worksheets.map((hoja) => hoja.getSheetValues()));
    if (opciones === cantidades || opciones === detalle) assert.ok(!texto.includes('Prueba'));
    if (opciones.modo === 'ambos') { assert.ok(texto.includes('Cantidades')); assert.ok(texto.includes('Detalle por niño')); assert.ok(texto.includes('Ana Prueba')); }
    const pdf = await get('pdf', opciones);
    assert.equal(pdf.status, 200);
    const buffer = Buffer.from(await pdf.arrayBuffer());
    assert.equal(buffer.subarray(0, 5).toString(), '%PDF-');
    assert.ok(buffer.length > 1000);
    const streams = [...buffer.toString('latin1').matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)].map((match) => {
      try { return inflateSync(Buffer.from(match[1], 'latin1')).toString(); } catch { return ''; }
    }).join('');
    // PDFKit puede separar una palabra en varios segmentos para ajustar kerning.
    const textoPdf = [...streams.matchAll(/<([a-fA-F0-9]+)>/g)].map((match) => Buffer.from(match[1], 'hex').toString('latin1')).join('');
    if (opciones === cantidades || opciones === detalle) assert.ok(!textoPdf.includes('Ana Prueba'));
    else assert.ok(textoPdf.includes('Ana Prueba'));
  }
  registros.push({ nino: 'n3', estadoNutricional: 'normal', activo: true, fecha: hoy });
  assert.equal((await contarNinosReporte({ estadoNutricional: 'normal' })).ninos, 1);
  assert.equal((await generarDatosReporte({ estadoNutricional: 'normal' })).listadoNutricional[0].clasificacionNutricional, 'Normal');
});
