import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import { once } from 'node:events';
import { proteger } from '../middleware/authMiddleware.js';
import { listar as listarNinos } from '../controllers/ninoController.js';
import { validarTerritorios } from '../services/territorioService.js';
import Usuario from '../models/Usuario.js';
import Comunidad from '../models/Comunidad.js';
import Nino from '../models/Nino.js';
import Padre from '../models/Padre.js';
import Alerta from '../models/Alerta.js';
import RegistroCrecimiento from '../models/RegistroCrecimiento.js';
import Vacunacion from '../models/Vacunacion.js';
import Campana from '../models/Campana.js';

const id = (n) => String(n).padStart(24, '0');
function coincide(fila, filtro) {
  return Object.entries(filtro).every(([campo, valor]) => {
    if (campo === '$and') return valor.every((f) => coincide(fila, f));
    if (campo === '$or') return valor.some((f) => coincide(fila, f));
    if (valor?.$in) return valor.$in.map(String).includes(String(fila[campo]));
    return String(fila[campo]) === String(valor);
  });
}
const consulta = (valor) => ({ select() { return this; }, populate() { return this; }, sort() { return this; }, lean: async () => valor, then: (ok, fail) => Promise.resolve(valor).then(ok, fail) });

test('JWT + territorio: aislamiento por ID, destinos, listados y cambios de asignación', async (t) => {
  const secretoAnterior = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'clave-solo-para-prueba-local';
  t.after(() => { if (secretoAnterior == null) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = secretoAnterior; });
  const comunidades = [
    { _id: id(1), nombre: 'Uno', departamento: 'A', municipio: 'Uno', activo: true },
    { _id: id(2), nombre: 'Dos', departamento: 'A', municipio: 'Dos', activo: true },
    { _id: id(3), nombre: 'Tres', departamento: 'A', municipio: 'Uno', activo: true },
  ];
  const ninos = [{ _id: id(11), comunidad: id(1), activo: true }, { _id: id(12), comunidad: id(2), activo: true }];
  const porNino = [{ _id: id(21), nino: id(11) }, { _id: id(22), nino: id(12) }];
  for (const [modelo, filas] of [[Comunidad, comunidades], [Nino, ninos], [Padre, ninos], [Alerta, porNino], [RegistroCrecimiento, porNino], [Vacunacion, porNino], [Campana, [
    { _id: id(31), alcance: 'comunidad', comunidad: id(1) }, { _id: id(32), alcance: 'municipio', departamento: 'A', municipio: 'Dos' },
  ]]]) {
    for (const metodo of ['find', 'findOne', 'findById', 'exists']) {
      const anterior = modelo[metodo]; t.after(() => { modelo[metodo] = anterior; });
      modelo[metodo] = (filtro) => {
        const resultado = filas.filter((fila) => coincide(fila, metodo === 'findById' ? { _id: filtro } : filtro));
        return consulta(metodo === 'find' ? resultado : resultado[0] || null);
      };
    }
  }
  let usuario = { _id: id(99), rol: 'personal', activo: true, territorios: [{ alcance: 'comunidad', comunidad: id(1), departamento: 'A', municipio: 'Uno' }] };
  const originalUsuario = Usuario.findById;
  t.after(() => { Usuario.findById = originalUsuario; });
  Usuario.findById = () => consulta(usuario);
  const app = express(); app.use(express.json());
  let acciones = 0;
  const completado = (req, res) => { acciones++; res.json({ ok: true }); };
  const rutas = {
    ninos: [['get', '/', listarNinos], ['get', '/:id'], ['put', '/:id'], ['post', '/']],
    padres: [['get', '/:id'], ['put', '/:id']],
    comunidades: [['get', '/:id'], ['put', '/:id'], ['post', '/']],
    crecimiento: [['get', '/curvas/:ninoId'], ['patch', '/:id'], ['post', '/']],
    vacunacion: [['get', '/nino/:ninoId'], ['delete', '/:id'], ['post', '/']],
    alertas: [['patch', '/:id/atender']],
    carnet: [['get', '/generar/:ninoId'], ['post', '/enviar/:ninoId'], ['get', '/expediente/:ninoId']],
    notificaciones: [['post', '/alerta'], ['post', '/prueba']],
    campanas: [['post', '/'], ['post', '/:id/enviar'], ['get', '/:id/destinatarios']],
    vacunas: [['get', '/'], ['post', '/']],
  };
  for (const [modulo, definiciones] of Object.entries(rutas)) {
    const router = express.Router();
    for (const [metodo, ruta, controlador] of definiciones) router[metodo](ruta, proteger, controlador || completado);
    app.use(`/api/${modulo}`, router);
  }
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const token = jwt.sign({ id: id(99), rol: 'personal' }, process.env.JWT_SECRET);
  const request = (ruta, method = 'GET', body) => fetch(`http://127.0.0.1:${server.address().port}/api/${ruta}`, {
    method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const lista = await request('ninos'); assert.equal(lista.status, 200); assert.deepEqual((await lista.json()).map((n) => n._id), [id(11)]);
  for (const [ruta, metodo, body] of [
    [`ninos/${id(12)}`, 'GET'], [`NINOS/${id(12)}`, 'GET'], [`padres/${id(12)}`, 'PUT', { nombre: 'Cambio' }],
    [`comunidades/${id(2)}`, 'GET'], [`comunidades/${id(1)}`, 'PUT', { departamento: 'A', municipio: 'Dos' }],
    [`ninos/${id(11)}`, 'PUT', { comunidad: id(2) }], [`ninos/${id(11)}`, 'PUT', { padres: [id(12)] }],
    ['ninos', 'POST', { comunidad: id(2) }], ['crecimiento', 'POST', { nino: id(12) }],
    [`crecimiento/curvas/${id(12)}`, 'GET'], [`crecimiento/${id(22)}`, 'PATCH', {}],
    [`vacunacion/nino/${id(12)}`, 'GET'], [`vacunacion/${id(22)}`, 'DELETE'],
    [`alertas/${id(22)}/atender`, 'PATCH', {}], [`carnet/generar/${id(12)}`, 'GET'],
    [`carnet/enviar/${id(12)}`, 'POST', {}], [`carnet/expediente/${id(12)}`, 'GET'],
    ['notificaciones/alerta', 'POST', { alertaId: id(22) }], ['notificaciones/prueba', 'POST', { chatId: 'externo' }],
    ['campanas', 'POST', { alcance: 'municipio', departamento: 'A', municipio: 'Uno' }],
    [`campanas/${id(32)}/enviar`, 'POST', {}], [`campanas/${id(32)}/destinatarios`, 'GET'], ['vacunas', 'POST', {}],
  ]) assert.equal((await request(ruta, metodo, body)).status, 403, `${metodo} ${ruta}`);
  assert.equal(acciones, 0);
  assert.equal((await request(`ninos/${id(11)}`)).status, 200);
  assert.equal((await request(`comunidades/${id(1)}`)).status, 200);
  usuario.territorios = [{ alcance: 'municipio', departamento: 'A', municipio: 'Uno' }];
  comunidades.push({ _id: id(4), nombre: 'Nueva', departamento: 'A', municipio: 'Uno', activo: true });
  assert.equal((await request(`comunidades/${id(4)}`)).status, 200);
  assert.equal((await request(`comunidades/${id(3)}`)).status, 200);
  assert.equal((await request('campanas', 'POST', { alcance: 'municipio', departamento: 'A', municipio: 'Uno' })).status, 200);
  usuario.territorios = []; assert.equal((await request('ninos')).status, 403);
  usuario.rol = 'admin'; assert.equal((await request(`ninos/${id(12)}`)).status, 200);
  assert.equal((await request('vacunas', 'POST', {})).status, 200);
  assert.deepEqual(await validarTerritorios([{ alcance: 'comunidad', comunidad: id(1) }]), [{ alcance: 'comunidad', comunidad: id(1), departamento: 'A', municipio: 'Uno' }]);
  await assert.rejects(validarTerritorios([{ alcance: 'municipio', departamento: 'A', municipio: 'No existe' }]), { status: 400 });
});
