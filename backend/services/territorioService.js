import mongoose from 'mongoose';
import Comunidad from '../models/Comunidad.js';
import Nino from '../models/Nino.js';
import Padre from '../models/Padre.js';
import RegistroCrecimiento from '../models/RegistroCrecimiento.js';
import Vacunacion from '../models/Vacunacion.js';
import Alerta from '../models/Alerta.js';
import Campana from '../models/Campana.js';

const fallo = (mensaje, status = 403) => Object.assign(new Error(mensaje), { status });
const idValido = (id) => typeof id === 'string' && mongoose.isObjectIdOrHexString(id);
export function filtroMunicipios(territorios = []) {
  return territorios.filter((t) => t.alcance === 'municipio').map((t) => ({ departamento: t.departamento, municipio: t.municipio }));
}
export async function validarTerritorios(valor) {
  if (!Array.isArray(valor) || valor.length > 100) throw fallo('Seleccione una lista válida de territorios (máximo 100).', 400);
  const resultado = [];
  for (const territorio of valor) {
    if (territorio?.alcance === 'comunidad') {
      if (!idValido(territorio.comunidad)) throw fallo('Comunidad inválida.', 400);
      const comunidad = await Comunidad.findOne({ _id: territorio.comunidad, activo: true }).lean();
      if (!comunidad) throw fallo('La comunidad asignada no existe o está inactiva.', 400);
      resultado.push({ alcance: 'comunidad', comunidad: comunidad._id, departamento: comunidad.departamento, municipio: comunidad.municipio });
    } else if (territorio?.alcance === 'municipio' && typeof territorio.departamento === 'string' && typeof territorio.municipio === 'string') {
      const departamento = territorio.departamento.trim();
      const municipio = territorio.municipio.trim();
      if (!departamento || !municipio || !await Comunidad.exists({ departamento, municipio, activo: true })) throw fallo('Seleccione un municipio con comunidades activas registradas.', 400);
      resultado.push({ alcance: 'municipio', departamento, municipio });
    } else throw fallo('El territorio debe ser un municipio o una comunidad.', 400);
  }
  return [...new Map(resultado.map((t) => [t.alcance === 'comunidad' ? `c:${t.comunidad}` : `m:${t.departamento}:${t.municipio}`, t])).values()];
}

export function filtroComunidades(req) {
  return req.territorio ? { _id: { $in: req.territorio.comunidades } } : {};
}
export function filtroPoblacion(req) {
  return req.territorio ? { comunidad: { $in: req.territorio.comunidades } } : {};
}
export function filtroNinos(req) {
  return req.territorio ? { nino: { $in: req.territorio.ninos } } : {};
}
export function municipioPermitido(req, departamento, municipio) {
  return !req.territorio || filtroMunicipios(req.usuario.territorios).some((t) => t.departamento === departamento && t.municipio === municipio);
}
export function campanaPermitida(req, campana) {
  if (!req.territorio) return true;
  if (campana.alcance === 'comunidad') return req.territorio.comunidades.some((id) => String(id) === String(campana.comunidad?._id || campana.comunidad));
  return campana.alcance === 'municipio' && municipioPermitido(req, campana.departamento, campana.municipio);
}
export function poblacionPadres(req, select = 'nombreCompleto') {
  return { path: 'padres', select, ...(req.territorio ? { match: filtroPoblacion(req) } : {}) };
}

// Se ejecuta tras verificar el JWT, antes del controlador, también en accesos por ID.
export async function prepararTerritorio(req) {
  if (req.usuario.rol === 'admin') return;
  const modulo = req.baseUrl.split('/').at(-1).toLowerCase();
  if (['auth', 'usuarios'].includes(modulo)) return;
  const territorios = req.usuario.territorios || [];
  if (!territorios.length) throw fallo('Cuenta pendiente de asignación territorial. Solicite al administrador un municipio o comunidad.');
  const condiciones = [...filtroMunicipios(territorios), ...territorios.filter((t) => t.alcance === 'comunidad').map((t) => ({ _id: t.comunidad }))];
  const comunidades = await Comunidad.find({ $or: condiciones }).select('_id').lean();
  const ids = comunidades.map((c) => c._id);
  const ninos = await Nino.find({ comunidad: { $in: ids } }).select('_id').lean();
  req.territorio = { comunidades: ids, ninos: ninos.map((n) => n._id) };
  const comprobar = async (modelo, id, filtro) => {
    if (!idValido(id)) throw fallo('Identificador inválido.', 400);
    if (!await modelo.exists({ $and: [{ _id: id }, filtro] })) throw fallo('Registro fuera de su territorio o inexistente.');
  };
  const comprobarNino = (id) => comprobar(Nino, id, filtroPoblacion(req));
  const body = req.body || {};
  const params = req.params || {};
  if (params.ninoId) await comprobarNino(params.ninoId);
  if (['crecimiento', 'vacunacion'].includes(modulo) && req.method === 'POST') await comprobarNino(body.nino);
  const modelos = { comunidades: Comunidad, padres: Padre, ninos: Nino, crecimiento: RegistroCrecimiento, vacunacion: Vacunacion, alertas: Alerta };
  if (params.id && modelos[modulo]) {
    const filtro = modulo === 'comunidades' ? filtroComunidades(req) : ['padres', 'ninos'].includes(modulo) ? filtroPoblacion(req) : filtroNinos(req);
    await comprobar(modelos[modulo], params.id, filtro);
  }
  if (['padres', 'ninos'].includes(modulo) && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
    if (req.method === 'POST' || Object.hasOwn(body, 'comunidad')) await comprobar(Comunidad, body.comunidad, { ...filtroComunidades(req), activo: true });
    if (Object.hasOwn(body, 'padres')) {
      if (!Array.isArray(body.padres)) throw fallo('Padres debe ser una lista.', 400);
      for (const padre of body.padres) await comprobar(Padre, padre, { ...filtroPoblacion(req), activo: true });
    }
  }
  if (modulo === 'comunidades' && ['POST', 'PUT'].includes(req.method)) {
    if (req.method === 'POST' && !municipioPermitido(req, body.departamento?.trim(), body.municipio?.trim())) throw fallo('Solo puede crear comunidades dentro de un municipio completo asignado.');
    if (req.method === 'PUT') {
      const actual = await Comunidad.findById(params.id).lean();
      if (actual.departamento !== body.departamento?.trim() || actual.municipio !== body.municipio?.trim()) throw fallo('Solo el administrador puede trasladar una comunidad a otro municipio.');
    }
  }
  if (modulo === 'notificaciones') {
    if (req.path.toLowerCase().replace(/\/$/, '') !== '/alerta') throw fallo('Las pruebas de envío globales están reservadas al administrador.');
    await comprobar(Alerta, body.alertaId, filtroNinos(req));
  }
  if (modulo === 'vacunas' && req.method !== 'GET') throw fallo('Solo el administrador puede modificar el catálogo compartido de vacunas.');
  if (modulo === 'campanas') {
    if (params.id) {
      if (!idValido(params.id)) throw fallo('Identificador inválido.', 400);
      const campana = await Campana.findById(params.id).lean();
      if (!campana || !campanaPermitida(req, campana)) throw fallo('Campaña fuera de su territorio o inexistente.');
    }
    if ((req.method === 'POST' && !params.id) || req.method === 'PUT') {
      if (!campanaPermitida(req, body)) throw fallo('La campaña debe corresponder a un municipio completo o comunidad asignados.');
    }
  }
}
