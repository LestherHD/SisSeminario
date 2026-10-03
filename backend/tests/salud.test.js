import test from 'node:test';
import assert from 'node:assert/strict';
import { controlCrecimiento, mesesCumplidos, sumarMeses, evaluarEdadVacuna } from '../../shared/reglasSalud.mjs';
import { registrar } from '../controllers/vacunacionController.js';
import Nino from '../models/Nino.js';
import Vacuna from '../models/Vacuna.js';
import Vacunacion from '../models/Vacunacion.js';

test('Controles: límites por cumpleaños, cierre de mes y frecuencia desde los cinco años', () => {
  const nacio = '2020-10-02';
  for (const [fecha, meses] of [['2022-10-01', 1], ['2022-10-02', 3], ['2023-10-01', 3], ['2023-10-02', 6], ['2025-10-01', 6], ['2025-10-02', 3]]) {
    assert.equal(controlCrecimiento(nacio, null, fecha).meses, meses);
  }
  assert.equal(sumarMeses('2024-01-31', 1).toISOString().slice(0, 10), '2024-02-29');
  assert.equal(mesesCumplidos('2024-01-31', '2024-02-28'), 0);
  assert.equal(mesesCumplidos('2024-01-31', '2024-02-29'), 1);
  assert.equal(controlCrecimiento(nacio, '2024-01-31', '2024-07-31').vencido, false);
  assert.equal(controlCrecimiento(nacio, '2024-01-31', '2024-08-01').vencido, true);
  assert.equal(controlCrecimiento(nacio, null, '2024-08-01').vencido, true);
});

test('Vacunas: meses incluidos, años históricos, fechas de aplicación y fechas inválidas', () => {
  const vacuna = { rangoEdad: '2-5', rangoEdadUnidad: 'meses' };
  for (const [fecha, permitido] of [['2024-02-29', false], ['2024-03-01', true], ['2024-06-30', true], ['2024-07-01', false]]) {
    assert.equal(evaluarEdadVacuna(vacuna, '2024-01-01', fecha).permitida, permitido);
  }
  assert.equal(evaluarEdadVacuna({ rangoEdad: '0-1' }, '2020-01-01', '2021-12-31').permitida, true);
  assert.equal(evaluarEdadVacuna({ rangoEdad: '0-1' }, '2020-01-01', '2022-01-01').permitida, false);
  assert.equal(evaluarEdadVacuna(vacuna, '2024-01-01', '2024-02-30').permitida, false);
  assert.equal(evaluarEdadVacuna(vacuna, '2024-01-01', '2023-12-31').permitida, false);
  assert.equal(evaluarEdadVacuna({}, '2024-01-01', '2024-03-01').permitida, false);
});

test('API de vacunación rechaza fuera de edad antes de escribir', async (t) => {
  const originales = [Vacuna.findById, Nino.findOne, Vacunacion.create, Vacunacion.countDocuments, Nino.findById];
  t.after(() => { [Vacuna.findById, Nino.findOne, Vacunacion.create, Vacunacion.countDocuments, Nino.findById] = originales; });
  Vacuna.findById = () => ({ lean: async () => ({ activo: true, rangoEdad: '2-5', rangoEdadUnidad: 'meses' }) });
  Nino.findOne = () => ({ lean: async () => ({ activo: true, fechaNacimiento: new Date('2020-01-01') }) });
  let escrituras = 0;
  Vacunacion.create = async () => { escrituras++; };
  for (const fechaAplicada of ['2022-01-01', '2019-12-31', '2099-01-01', '2020-02-30']) {
    const res = { status(codigo) { this.codigo = codigo; return this; }, json(body) { this.body = body; return this; } };
    await registrar({ body: { nino: '000000000000000000000001', vacuna: '000000000000000000000002', fechaAplicada } }, res);
    assert.equal(res.codigo, 400);
  }
  assert.equal(escrituras, 0);
  Vacunacion.countDocuments = async () => 0;
  Nino.findById = async () => null; // Evitar ejecutar notificaciones en esta prueba de registro.
  Vacunacion.create = async (datos) => { escrituras++; return datos; };
  const res = { status(codigo) { this.codigo = codigo; return this; }, json(body) { this.body = body; return this; } };
  await registrar({ body: { nino: '000000000000000000000001', vacuna: '000000000000000000000002', fechaAplicada: '2020-03-01' } }, res);
  assert.equal(res.codigo, 201);
  assert.equal(escrituras, 1);
});
