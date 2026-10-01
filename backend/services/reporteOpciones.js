export const SECCIONES = ['resumenCantidades', 'listadoNutricional', 'vacunasIncompletas', 'coberturaVacunacion', 'crecimientoPromedio'];
export const COLUMNAS = { nombre: 'Nombre', edad: 'Edad (años)', sexo: 'Sexo', comunidad: 'Comunidad', peso: 'Peso kg', talla: 'Talla cm', clasificacionNutricional: 'Clasificación nutricional', vacunacion: 'Vacunación' };
export const ESTADOS = { normal: 'Normal', desnutricion: 'Desnutrición / delgadez', riesgo_sobrepeso: 'Riesgo de sobrepeso', sobrepeso: 'Sobrepeso', obesidad: 'Obesidad', sin_datos: 'Sin datos' };
export function errorOpciones(mensaje) { return Object.assign(new Error(mensaje), { status: 400 }); }
export function normalizarEstado(estado) {
  if (['desnutricion_severa', 'delgadez', 'delgadez_severa'].includes(estado)) return 'desnutricion';
  return Object.hasOwn(ESTADOS, estado) ? estado : 'sin_datos';
}
export function opcionesReporte(query = {}) {
  const texto = (campo, defecto = '') => {
    if (query[campo] == null || query[campo] === '') return defecto;
    if (typeof query[campo] !== 'string') throw errorOpciones(`Valor inválido: ${campo}`);
    return query[campo].trim() || defecto;
  };
  const booleano = (campo, defecto) => {
    const valor = query[campo];
    if (valor === undefined || valor === '') return defecto;
    if (valor === true || valor === 'true') return true;
    if (valor === false || valor === 'false') return false;
    throw errorOpciones(`Se esperaba true o false en ${campo}`);
  };
  const filtros = Object.fromEntries(['departamento', 'municipio', 'comunidad', 'sexo'].map((campo) => [campo, texto(campo)]));
  if (filtros.sexo && !['M', 'F'].includes(filtros.sexo)) throw errorOpciones('Sexo debe ser M o F.');
  for (const campo of ['edadMin', 'edadMax']) {
    const valor = texto(campo);
    filtros[campo] = valor === '' ? null : Number(valor);
    if (valor !== '' && (!Number.isFinite(filtros[campo]) || filtros[campo] < 0 || !Number.isFinite(new Date(Date.now() - (filtros[campo] + 1) * 365.2425 * 86400000).getTime()))) {
      throw errorOpciones('Las edades deben ser números no negativos dentro del rango de fechas admitido.');
    }
  }
  if (filtros.edadMin != null && filtros.edadMax != null && filtros.edadMin > filtros.edadMax) throw errorOpciones('La edad mínima no puede superar la máxima.');
  const estados = query.estadoNutricional ?? '';
  if (!(typeof estados === 'string' || (Array.isArray(estados) && estados.every((v) => typeof v === 'string')))) throw errorOpciones('Lista de estados inválida.');
  filtros.estadoNutricional = [...new Set((Array.isArray(estados) ? estados : estados.split(',')).map((v) => v.trim()).filter(Boolean))];
  if (filtros.estadoNutricional.some((v) => !Object.hasOwn(ESTADOS, v))) throw errorOpciones('Estado nutricional inválido.');
  const general = booleano('general', false) || !['modo', 'agrupacion', ...SECCIONES, ...Object.keys(COLUMNAS).map((campo) => `col_${campo}`)].some((campo) => query[campo] !== undefined && query[campo] !== '');
  const modo = general ? 'ambos' : texto('modo', 'ambos');
  const agrupacion = general ? 'porComunidad' : texto('agrupacion', 'general');
  if (!['cantidades', 'detalle', 'ambos'].includes(modo)) throw errorOpciones('Modo de presentación inválido.');
  if (!['porComunidad', 'porSexo', 'porEstadoNutricional', 'general'].includes(agrupacion)) throw errorOpciones('Agrupación inválida.');
  const secciones = Object.fromEntries(SECCIONES.map((campo) => [campo, general || booleano(campo, true)]));
  const columnas = Object.keys(COLUMNAS).filter((campo) => general || booleano(`col_${campo}`, true));
  if (!Object.values(secciones).some(Boolean)) throw errorOpciones('Selecciona al menos una sección.');
  if (modo !== 'cantidades' && !columnas.length && SECCIONES.slice(1).some((campo) => secciones[campo])) throw errorOpciones('Selecciona al menos una columna de detalle.');
  return { filtros, general, modo, agrupacion, secciones, columnas };
}
