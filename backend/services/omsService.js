import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIRECTORIO_OMS = path.join(__dirname, '..', 'data', 'oms');
const DIAS_POR_MES = 30.4375;
const PERCENTILES_CURVA = [
  ['p3', -1.8808],
  ['p15', -1.0364],
  ['p50', 0],
  ['p85', 1.0364],
  ['p97', 1.8808],
];

const ARCHIVOS = {
  oms2006: {
    peso: 'who2006_peso_edad.txt',
    talla: 'who2006_talla_edad.txt',
    imc: 'who2006_imc_edad.txt',
  },
  oms2007: {
    peso: 'who2007_peso_edad.txt',
    talla: 'who2007_talla_edad.txt',
    imc: 'who2007_imc_edad.txt',
  },
};

const tablas = new Map();

function cargarTabla(referencia, indicador) {
  const claveCache = `${referencia}:${indicador}`;
  if (tablas.has(claveCache)) return tablas.get(claveCache);

  const archivo = path.join(DIRECTORIO_OMS, ARCHIVOS[referencia][indicador]);
  const lineas = fs.readFileSync(archivo, 'utf8').trim().split(/\r?\n/).slice(1);
  const tabla = new Map();

  for (const linea of lineas) {
    const columnas = linea.trim().split(/\s+/);
    if (columnas.length < 5) continue;

    const sexo = Number(columnas[0]);
    const edad = Number(columnas[1]);
    const l = Number(columnas[2]);
    const m = Number(columnas[3]);
    const s = Number(columnas[4]);

    if ([sexo, edad, l, m, s].some((valor) => !Number.isFinite(valor))) continue;
    tabla.set(`${sexo}:${edad}`, { l, m, s });
  }

  tablas.set(claveCache, tabla);
  return tabla;
}

function codigoSexo(sexo) {
  if (sexo === 'M' || sexo === 1 || sexo === '1') return 1;
  if (sexo === 'F' || sexo === 2 || sexo === '2') return 2;
  throw new Error('Sexo no válido para la evaluación OMS');
}

export function calcularEdadOms(fechaNacimiento, fechaMedicion = new Date()) {
  const nacimiento = new Date(fechaNacimiento);
  const medicion = new Date(fechaMedicion);
  if (Number.isNaN(nacimiento.getTime()) || Number.isNaN(medicion.getTime())) {
    throw new Error('La fecha de nacimiento o medición no es válida');
  }

  const edadDiasExacta = (medicion.getTime() - nacimiento.getTime()) / 86400000;
  if (edadDiasExacta < 0) throw new Error('La medición no puede ser anterior al nacimiento');

  return {
    edadDias: Math.floor(edadDiasExacta),
    edadMesesExacta: edadDiasExacta / DIAS_POR_MES,
  };
}

function obtenerLms(indicador, sexo, edadDias, edadMesesExacta) {
  const sexoOms = codigoSexo(sexo);

  if (edadMesesExacta < 60) {
    const tabla = cargarTabla('oms2006', indicador);
    return {
      ...tabla.get(`${sexoOms}:${Math.min(1856, Math.max(0, Math.round(edadDias)))}`),
      referencia: 'OMS 2006',
    };
  }

  const limiteMeses = indicador === 'peso' ? 120 : 228;
  if (edadMesesExacta > limiteMeses) return null;

  const tabla = cargarTabla('oms2007', indicador);
  const edadInferior = Math.max(60, Math.floor(edadMesesExacta));
  const edadSuperior = Math.min(limiteMeses, Math.ceil(edadMesesExacta));
  const inferior = tabla.get(`${sexoOms}:${edadInferior}`);
  const superior = tabla.get(`${sexoOms}:${edadSuperior}`) ?? inferior;
  if (!inferior || !superior) return null;

  const proporcion = edadSuperior === edadInferior
    ? 0
    : (edadMesesExacta - edadInferior) / (edadSuperior - edadInferior);

  return {
    l: inferior.l + (superior.l - inferior.l) * proporcion,
    m: inferior.m + (superior.m - inferior.m) * proporcion,
    s: inferior.s + (superior.s - inferior.s) * proporcion,
    referencia: 'OMS 2007',
  };
}

function valorDesdeZ({ l, m, s }, z) {
  if (Math.abs(l) < 1e-12) return m * Math.exp(s * z);
  const base = 1 + l * s * z;
  return base > 0 ? m * Math.pow(base, 1 / l) : null;
}

function zLms(valor, lms, ajustarExtremos = false) {
  if (!lms || !Number.isFinite(valor) || valor <= 0) return null;
  const { l, m, s } = lms;
  let z = Math.abs(l) < 1e-12
    ? Math.log(valor / m) / s
    : (Math.pow(valor / m, l) - 1) / (l * s);

  if (ajustarExtremos && z > 3) {
    const sd2 = valorDesdeZ(lms, 2);
    const sd3 = valorDesdeZ(lms, 3);
    z = 3 + (valor - sd3) / (sd3 - sd2);
  } else if (ajustarExtremos && z < -3) {
    const sdMenos2 = valorDesdeZ(lms, -2);
    const sdMenos3 = valorDesdeZ(lms, -3);
    z = -3 + (valor - sdMenos3) / (sdMenos2 - sdMenos3);
  }

  return Number(z.toFixed(3));
}

function erf(x) {
  const signo = x < 0 ? -1 : 1;
  const valor = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * valor);
  const aproximacion = 1 - (((((1.061405429 * t - 1.453152027) * t)
    + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-valor * valor);
  return signo * aproximacion;
}

export function percentilDesdeZ(z) {
  if (z == null || !Number.isFinite(Number(z))) return null;
  const percentil = 50 * (1 + erf(Number(z) / Math.sqrt(2)));
  return Number(Math.min(99.9, Math.max(0.1, percentil)).toFixed(1));
}

function clasificarEstadoNutricional(zImc, edadMesesExacta) {
  if (zImc == null) return 'sin_datos';

  if (edadMesesExacta < 60) {
    if (zImc < -3) return 'desnutricion_severa';
    if (zImc < -2) return 'desnutricion';
    if (zImc <= 1) return 'normal';
    if (zImc <= 2) return 'riesgo_sobrepeso';
    if (zImc <= 3) return 'sobrepeso';
    return 'obesidad';
  }

  if (zImc < -3) return 'delgadez_severa';
  if (zImc < -2) return 'delgadez';
  if (zImc <= 1) return 'normal';
  if (zImc <= 2) return 'sobrepeso';
  return 'obesidad';
}

function clasificarTalla(zTalla) {
  if (zTalla == null) return 'sin_datos';
  if (zTalla < -3) return 'talla_baja_severa';
  if (zTalla < -2) return 'talla_baja';
  if (zTalla <= 2) return 'normal';
  return 'talla_alta';
}

export function evaluarMedicionOms({ sexo, fechaNacimiento, fechaMedicion, peso, talla }) {
  const pesoNumero = Number(peso);
  const tallaNumero = Number(talla);
  if (!Number.isFinite(pesoNumero) || pesoNumero <= 0) throw new Error('El peso debe ser mayor que cero');
  if (!Number.isFinite(tallaNumero) || tallaNumero <= 0) throw new Error('La talla debe ser mayor que cero');

  const { edadDias, edadMesesExacta } = calcularEdadOms(fechaNacimiento, fechaMedicion);
  const imc = pesoNumero / Math.pow(tallaNumero / 100, 2);
  const lmsPeso = obtenerLms('peso', sexo, edadDias, edadMesesExacta);
  const lmsTalla = obtenerLms('talla', sexo, edadDias, edadMesesExacta);
  const lmsImc = obtenerLms('imc', sexo, edadDias, edadMesesExacta);

  const zPesoEdad = zLms(pesoNumero, lmsPeso, true);
  const zTallaEdad = zLms(tallaNumero, lmsTalla, false);
  const zImcEdad = zLms(imc, lmsImc, true);

  return {
    edadMeses: Math.floor(edadMesesExacta),
    edadDias,
    edadMesesExacta: Number(edadMesesExacta.toFixed(2)),
    imc: Number(imc.toFixed(2)),
    zPesoEdad,
    zTallaEdad,
    zImcEdad,
    percentilPeso: percentilDesdeZ(zPesoEdad),
    percentilTalla: percentilDesdeZ(zTallaEdad),
    percentilImc: percentilDesdeZ(zImcEdad),
    estadoNutricional: clasificarEstadoNutricional(zImcEdad, edadMesesExacta),
    estadoTalla: clasificarTalla(zTallaEdad),
    referenciaOms: lmsImc?.referencia ?? lmsTalla?.referencia ?? '',
  };
}

export function obtenerCurvaOms(indicador, sexo, edadMinima = 0, edadMaxima = 60) {
  const inicio = Math.max(0, Math.floor(Number(edadMinima)));
  const limiteIndicador = indicador === 'peso' ? 120 : 228;
  const fin = Math.min(limiteIndicador, Math.ceil(Number(edadMaxima)));
  const puntos = [];

  for (let edadMeses = inicio; edadMeses <= fin; edadMeses += 1) {
    const edadDias = Math.round(edadMeses * DIAS_POR_MES);
    const lms = obtenerLms(indicador, sexo, edadDias, edadMeses);
    if (!lms) continue;

    const punto = { edadMeses };
    for (const [nombre, z] of PERCENTILES_CURVA) {
      const valor = valorDesdeZ(lms, z);
      punto[nombre] = valor == null ? null : Number(valor.toFixed(2));
    }
    puntos.push(punto);
  }

  return puntos;
}
