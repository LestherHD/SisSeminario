import test from 'node:test';
import assert from 'node:assert/strict';
import { obtenerEstadisticas } from '../controllers/dashboardController.js';
import Nino from '../models/Nino.js';
import Comunidad from '../models/Comunidad.js';
import Padre from '../models/Padre.js';
import Vacunacion from '../models/Vacunacion.js';
import Alerta from '../models/Alerta.js';
import RegistroCrecimiento from '../models/RegistroCrecimiento.js';

// Fixtures aislados: no conexión a MongoDB ni llamadas a servicios externos.
const coincide = (registro, filtro) => Object.entries(filtro).every(([campo, valor]) => {
  const actual = registro[campo];
  if (valor && typeof valor === 'object') {
    return Object.entries(valor).every(([op, limite]) => {
      if (op === '$in') return limite.includes(actual);
      if (op === '$gte') return actual >= limite;
      if (op === '$lte') return actual <= limite;
      if (op === '$gt') return actual > limite;
      throw new Error(`Operador inesperado: ${op}`);
    });
  }
  return actual === valor;
});
function consulta(valor) {
  return { select() { return this; }, sort() { return this; }, populate() { return this; },
    limit() { return this; }, lean() { return Promise.resolve(valor); },
    then(resolve, reject) { return Promise.resolve(valor).then(resolve, reject); } };
}

test('Dashboard: población compartida, compatibilidad, límites y validación', async (t) => {
  const hoy = new Date();
  const nacimiento = (edad) => new Date(hoy.getTime() - edad * 365.2425 * 86400000);
  const comunidades = [
    { _id: 'c1', activo: true, departamento: 'El Progreso', municipio: 'Sanarate', nombre: 'La Colina' },
    { _id: 'c2', activo: true, departamento: 'Otro', municipio: 'Otro', nombre: 'Centro' },
  ];
  const ninos = [
    { _id: 'n1', activo: true, sexo: 'F', fechaNacimiento: nacimiento(5.5), comunidad: 'c1', padres: ['p1', 'p2'] },
    { _id: 'n2', activo: true, sexo: 'M', fechaNacimiento: nacimiento(7), comunidad: 'c1', padres: ['p1'] },
    { _id: 'n3', activo: false, sexo: 'F', fechaNacimiento: nacimiento(4), comunidad: 'c1', padres: ['p2'] },
  ];
  const padres = ['p1', 'p2', 'p3'].map((_id) => ({ _id, activo: true, comunidad: _id === 'p3' ? 'c2' : 'c1' }));
  const dosis = ['n1', 'n2', 'n3'].map((nino) => ({ nino, activo: true, fechaAplicada: hoy, proximaDosis: null }));
  const alertas = ['n1', 'n2', 'n3'].map((nino) => ({ nino, activo: true, atendida: false, tipo: 'critica', fecha: hoy }));
  const capturas = [];
  for (const [modelo, filas] of [[Nino, ninos], [Comunidad, comunidades], [Padre, padres], [Vacunacion, dosis], [Alerta, alertas]]) {
    for (const metodo of ['find', 'countDocuments', 'aggregate']) {
      const original = modelo[metodo];
      t.after(() => { modelo[metodo] = original; });
      modelo[metodo] = (filtro) => {
        if (metodo === 'aggregate') {
          capturas.push({ modelo, filtro: filtro[0].$match });
          return Promise.resolve([]);
        }
        const resultado = filas.filter((fila) => coincide(fila, filtro));
        return metodo === 'countDocuments' ? Promise.resolve(resultado.length) : consulta(resultado);
      };
    }
  }
  const original = RegistroCrecimiento.findOne;
  t.after(() => { RegistroCrecimiento.findOne = original; });
  RegistroCrecimiento.findOne = ({ nino }) => consulta({ estadoNutricional: nino === 'n1' ? 'obesidad' : 'normal' });
  async function pedir(query, territorio) {
    const res = { status(codigo) { this.codigo = codigo; return this; }, json(body) { this.body = body; return this; } };
    await obtenerEstadisticas({ query, territorio }, res);
    return res;
  }
  const general = await pedir({});
  assert.equal(general.codigo, 200);
  assert.equal(general.body.totales.ninos, 2);
  assert.equal(general.body.totales.comunidades, 2);
  assert.equal(general.body.totales.padres, 3);
  assert.equal(general.body.totales.dosisAplicadas, 2); // Excluye niño inactivo.
  assert.deepEqual((await pedir({ sexo: '', edadMin: ' ', comunidad: '' })).body, general.body);
  capturas.length = 0;
  const filtrado = await pedir({ departamento: 'El Progreso', municipio: 'Sanarate', comunidad: 'La Colina', sexo: 'F', edadMin: '0', edadMax: '5', periodo: 'todo' });
  assert.equal(filtrado.codigo, 200);
  const { body } = filtrado;
  assert.equal(body.totales.ninos, 1); // 5.5 años sigue incluido con máximo 5.
  assert.equal(body.totales.padres, 2);
  assert.equal(body.totales.comunidades, 1);
  assert.equal(body.totales.dosisAplicadas, 1);
  assert.equal(body.totales.alertasCriticas, 1);
  assert.equal(body.totales.alertasActivas, 1);
  assert.deepEqual(body.porSexo, { ninos: 0, ninas: 1 });
  assert.equal(body.estadoNutricional.obesidad, 1);
  assert.equal(body.estadoNutricional.normal, 0);
  assert.equal(body.coberturaVacunacion.alDia, 1);
  assert.equal(body.actividadPeriodo.dosisAplicadas, 1);
  assert.equal(body.actividadPeriodo.alertasGeneradas, 1);
  assert.equal(body.ninosConAlertasCriticas.length, 1);
  for (const { modelo, filtro } of capturas) {
    assert.deepEqual((modelo === Nino ? filtro._id : filtro.nino).$in, ['n1']);
  }
  for (const query of [{ comunidad: 'Inexistente' }, { edadMax: '4' }, { edadMin: '8' }]) {
    const vacio = await pedir(query);
    assert.equal(vacio.codigo, 200);
    assert.ok(Object.values(vacio.body.totales).every((valor) => valor === 0));
    assert.equal(vacio.body.ninosConAlertasCriticas.length, 0);
  }
  for (const query of [{ sexo: 'X' }, { edadMin: '-1' }, { edadMax: 'NaN' }, { edadMin: '6', edadMax: '5' }, { comunidad: ['a', 'b'] }, { edadMax: '1e99' }]) {
    assert.equal((await pedir(query)).codigo, 400);
  }
  const territorio = { comunidades: ['c1'] };
  const propio = await pedir({}, territorio);
  assert.equal(propio.body.totales.ninos, 2);
  assert.equal(propio.body.totales.comunidades, 1);
  assert.equal(propio.body.totales.padres, 2);
  const fuera = await pedir({ comunidad: 'Centro' }, territorio);
  assert.equal(fuera.body.totales.ninos, 0);
  assert.equal(fuera.body.totales.dosisAplicadas, 0);
  assert.equal(fuera.body.totales.alertasActivas, 0);
});
