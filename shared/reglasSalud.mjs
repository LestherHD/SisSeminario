// Reglas operativas compartidas por la API y la interfaz, usando fechas UTC de calendario.
export function fechaDia(valor) {
  if (valor == null || valor === '') return null;
  const fecha = new Date(valor);
  if (!Number.isFinite(fecha.getTime())) return null;
  const dia = fecha.toISOString().slice(0, 10);
  if (typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor) && dia !== valor) return null;
  return new Date(`${dia}T00:00:00.000Z`);
}
export function sumarMeses(fecha, meses) {
  const inicio = fechaDia(fecha);
  if (!inicio || !Number.isSafeInteger(meses) || meses < 0) return null;
  const resultado = new Date(inicio);
  resultado.setUTCDate(1);
  resultado.setUTCMonth(resultado.getUTCMonth() + meses);
  if (!Number.isFinite(resultado.getTime())) return null;
  const ultimo = new Date(Date.UTC(resultado.getUTCFullYear(), resultado.getUTCMonth() + 1, 0)).getUTCDate();
  resultado.setUTCDate(Math.min(inicio.getUTCDate(), ultimo));
  return resultado;
}
export function mesesCumplidos(nacimiento, fecha = new Date()) {
  const inicio = fechaDia(nacimiento);
  const fin = fechaDia(fecha);
  if (!inicio || !fin || fin < inicio) return null;
  let meses = (fin.getUTCFullYear() - inicio.getUTCFullYear()) * 12 + fin.getUTCMonth() - inicio.getUTCMonth();
  if (sumarMeses(inicio, meses) > fin) meses -= 1;
  return meses;
}
export function controlCrecimiento(nacimiento, ultimoControl, fecha = new Date()) {
  const edad = mesesCumplidos(nacimiento, fecha);
  if (edad == null) return null;
  const meses = edad < 24 ? 1 : edad < 36 ? 3 : edad < 60 ? 6 : 3;
  const ultimaFecha = fechaDia(ultimoControl);
  const proximaFecha = ultimaFecha ? sumarMeses(ultimaFecha, meses) : null;
  return { meses, ultimaFecha, proximaFecha, vencido: !proximaFecha || fechaDia(fecha) > proximaFecha };
}
export function rangoVacunaMeses(vacuna) {
  const rango = /^(\d+)-(\d+)$/.exec(vacuna?.rangoEdad || '');
  const unidad = vacuna?.rangoEdadUnidad || 'anios';
  if (!rango || !['anios', 'meses'].includes(unidad)) return null;
  const minimo = Number(rango[1]);
  const maximo = Number(rango[2]);
  const factor = unidad === 'anios' ? 12 : 1;
  if (!Number.isSafeInteger(minimo) || !Number.isSafeInteger(maximo) || minimo > maximo || maximo > 1000) return null;
  return { minimo: minimo * factor, limite: (maximo + 1) * factor, unidad };
}
export function etiquetaRangoVacuna(vacuna) {
  return `${vacuna?.rangoEdad || 'Sin rango'} ${vacuna?.rangoEdadUnidad === 'meses' ? 'meses' : 'años'}`;
}
export function evaluarEdadVacuna(vacuna, nacimiento, fecha) {
  const edad = mesesCumplidos(nacimiento, fecha);
  if (edad == null) return { permitida: false, motivo: 'La fecha de aplicación debe ser válida y no anterior al nacimiento.' };
  const rango = rangoVacunaMeses(vacuna);
  if (!rango) return { permitida: false, motivo: 'El catálogo no tiene un rango de edad válido. Solicite su revisión al administrador.' };
  const permitida = edad >= rango.minimo && edad < rango.limite;
  return { permitida, motivo: permitida ? '' : `No corresponde a su edad en la fecha de aplicación (${edad} meses). Rango permitido: ${etiquetaRangoVacuna(vacuna)}.` };
}
