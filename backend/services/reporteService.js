import { evaluarEdadVacuna } from '../../shared/reglasSalud.mjs';
import Comunidad from '../models/Comunidad.js';
import Nino from '../models/Nino.js';
import RegistroCrecimiento from '../models/RegistroCrecimiento.js';
import Vacuna from '../models/Vacuna.js';
import Vacunacion from '../models/Vacunacion.js';
import { opcionesReporte, normalizarEstado, ESTADOS } from './reporteOpciones.js';
import { construirTablas } from './reporteTablas.js';

const MS_ANIO = 365.2425 * 86400000;

function redondear(valor, decimales = 1) {
  if (!Number.isFinite(valor)) return null;
  return Number(valor.toFixed(decimales));
}

function edadAnios(fechaNacimiento, fecha = new Date()) {
  return Math.max(0, (fecha.getTime() - new Date(fechaNacimiento).getTime()) / MS_ANIO);
}

function etiquetaNutricional(estado) {
  const etiquetas = {
    desnutricion_severa: 'Desnutrición severa',
    desnutricion: 'Desnutrición',
    delgadez_severa: 'Delgadez severa',
    delgadez: 'Delgadez',
    riesgo_sobrepeso: 'Riesgo de sobrepeso',
    sobrepeso: 'Sobrepeso',
    obesidad: 'Obesidad',
  };
  return etiquetas[estado] || '';
}

function filtrosUbicacion(query) {
  const filtro = { activo: true };
  if (query.departamento?.trim()) filtro.departamento = query.departamento.trim();
  if (query.municipio?.trim()) filtro.municipio = query.municipio.trim();
  if (query.comunidad?.trim()) filtro.nombre = query.comunidad.trim();
  return filtro;
}

export async function generarDatosReporte(query = {}, territorio = null) {
  const opciones = opcionesReporte(query);
  const { filtros } = opciones;
  const hoy = new Date();
  const comunidades = await Comunidad.find({ ...filtrosUbicacion(filtros), ...(territorio ? { _id: { $in: territorio.comunidades } } : {}) })
    .select('nombre departamento municipio')
    .sort({ departamento: 1, municipio: 1, nombre: 1 })
    .lean();
  const idsComunidades = comunidades.map(({ _id }) => _id);
  const comunidadesPorId = new Map(comunidades.map((item) => [String(item._id), item]));

  let ninos = idsComunidades.length
    ? await Nino.find({ activo: true, comunidad: { $in: idsComunidades }, ...(filtros.sexo ? { sexo: filtros.sexo } : {}) })
      .select('nombreCompleto fechaNacimiento sexo comunidad')
      .sort({ nombreCompleto: 1 })
      .lean()
    : [];
  ninos = ninos.filter((nino) => {
    const edad = (hoy - new Date(nino.fechaNacimiento)) / MS_ANIO;
    return (filtros.edadMin == null || edad >= filtros.edadMin) && (filtros.edadMax == null || edad < filtros.edadMax + 1);
  });
  const idsNinos = ninos.map(({ _id }) => _id);

  const [crecimientos, vacunas, aplicaciones] = await Promise.all([
    RegistroCrecimiento.find({ activo: true, nino: { $in: idsNinos } })
      .sort({ fecha: -1 })
      .lean(),
    query.soloConteo === true ? [] : Vacuna.find({ activo: true }).select('nombre rangoEdad rangoEdadUnidad numeroDosis').lean(),
    query.soloConteo === true ? [] : Vacunacion.find({ activo: true, nino: { $in: idsNinos } })
      .select('nino vacuna numeroDosis fechaAplicada proximaDosis')
      .sort({ fechaAplicada: -1 })
      .lean(),
  ]);

  const ultimoCrecimiento = new Map();
  for (const registro of crecimientos) {
    const clave = String(registro.nino);
    if (!ultimoCrecimiento.has(clave)) ultimoCrecimiento.set(clave, registro);
  }
  if (filtros.estadoNutricional.length) {
    ninos = ninos.filter((nino) => filtros.estadoNutricional.includes(normalizarEstado(ultimoCrecimiento.get(String(nino._id))?.estadoNutricional)));
  }
  if (query.soloConteo === true) return { ninos: ninos.length };

  const aplicacionesPorNinoVacuna = aplicaciones.reduce((mapa, aplicacion) => {
    const clave = `${aplicacion.nino}:${aplicacion.vacuna}`;
    if (!mapa.has(clave)) mapa.set(clave, []);
    mapa.get(clave).push(aplicacion);
    return mapa;
  }, new Map());

  const riesgosNutricionales = [];
  const listadoNutricional = [];
  const vacunasIncompletas = [];
  const coberturaPorComunidad = new Map();
  const crecimientoPorComunidad = new Map();
  const comunidadesSeleccionadas = new Set(ninos.map((nino) => String(nino.comunidad)));
  const filtraPoblacion = filtros.sexo || filtros.edadMin != null || filtros.edadMax != null || filtros.estadoNutricional.length;
  const comunidadesReporte = filtraPoblacion ? comunidades.filter((comunidad) => comunidadesSeleccionadas.has(String(comunidad._id))) : comunidades;

  for (const comunidad of comunidadesReporte) {
    const datosBase = {
      comunidad: comunidad.nombre,
      municipio: comunidad.municipio,
      departamento: comunidad.departamento,
    };
    coberturaPorComunidad.set(String(comunidad._id), {
      ...datosBase,
      ninos: 0,
      dosisAplicadas: 0,
      dosisRequeridas: 0,
      esquemasCompletos: 0,
    });
    crecimientoPorComunidad.set(String(comunidad._id), {
      ...datosBase,
      ninosConMedicion: 0,
      sumaPeso: 0,
      sumaTalla: 0,
      sumaImc: 0,
    });
  }

  for (const nino of ninos) {
    const comunidad = comunidadesPorId.get(String(nino.comunidad));
    if (!comunidad) continue;
    const ubicacion = {
      comunidad: comunidad.nombre,
      municipio: comunidad.municipio,
      departamento: comunidad.departamento,
    };
    const edadExacta = edadAnios(nino.fechaNacimiento, hoy);
    const edad = Math.floor(edadExacta);
    const crecimiento = ultimoCrecimiento.get(String(nino._id));
    const detalle = {
      id: String(nino._id), nino: nino.nombreCompleto, nombre: nino.nombreCompleto,
      edad, sexo: nino.sexo, ...ubicacion,
      comunidadId: String(nino.comunidad),
      estadoNutricional: normalizarEstado(crecimiento?.estadoNutricional),
      clasificacionNutricional: etiquetaNutricional(crecimiento?.estadoNutricional) || ESTADOS[normalizarEstado(crecimiento?.estadoNutricional)],
      peso: crecimiento?.peso ?? null, talla: crecimiento?.talla ?? null,
      imc: crecimiento?.imc ?? null, zPeso: crecimiento?.zPesoEdad ?? null, zImc: crecimiento?.zImcEdad ?? null,
      fechaMedicion: crecimiento?.fecha ?? null, medido: Boolean(crecimiento),
      dosisAplicadas: 0, dosisRequeridas: 0, vacunasPendientes: [], esquemaCompleto: false,
    };
    detalle.clasificacion = detalle.clasificacionNutricional;
    listadoNutricional.push(detalle);

    if (crecimiento) {
      const clasificaciones = [];
      if (crecimiento.zPesoEdad != null && crecimiento.zPesoEdad < -2) {
        clasificaciones.push('Bajo peso');
      }
      const nutricion = etiquetaNutricional(crecimiento.estadoNutricional);
      if (nutricion && crecimiento.estadoNutricional !== 'normal') clasificaciones.push(nutricion);

      if (clasificaciones.length) {
        riesgosNutricionales.push({
          nino: nino.nombreCompleto,
          edad,
          ...ubicacion,
          fechaMedicion: crecimiento.fecha,
          peso: crecimiento.peso,
          talla: crecimiento.talla,
          imc: crecimiento.imc,
          zPeso: crecimiento.zPesoEdad,
          zImc: crecimiento.zImcEdad,
          clasificacion: [...new Set(clasificaciones)].join(' / '),
        });
      }

      const grupoCrecimiento = crecimientoPorComunidad.get(String(nino.comunidad));
      grupoCrecimiento.ninosConMedicion += 1;
      grupoCrecimiento.sumaPeso += Number(crecimiento.peso) || 0;
      grupoCrecimiento.sumaTalla += Number(crecimiento.talla) || 0;
      grupoCrecimiento.sumaImc += Number(crecimiento.imc) || 0;
    }

    const vacunasEdad = vacunas.filter((vacuna) => {
      return evaluarEdadVacuna(vacuna, nino.fechaNacimiento, hoy).permitida;
    });
    const cobertura = coberturaPorComunidad.get(String(nino.comunidad));
    cobertura.ninos += 1;
    let esquemaCompleto = vacunasEdad.length > 0;

    for (const vacuna of vacunasEdad) {
      const dosisRequeridas = vacuna.numeroDosis || 1;
      const registros = aplicacionesPorNinoVacuna.get(`${nino._id}:${vacuna._id}`) || [];
      const dosisAplicadas = Math.min(dosisRequeridas, registros.length);
      cobertura.dosisRequeridas += dosisRequeridas;
      cobertura.dosisAplicadas += dosisAplicadas;
      detalle.dosisRequeridas += dosisRequeridas;
      detalle.dosisAplicadas += dosisAplicadas;

      if (dosisAplicadas < dosisRequeridas) {
        esquemaCompleto = false;
        const ultima = registros[0];
        const atrasada = ultima?.proximaDosis && new Date(ultima.proximaDosis) < hoy;
        detalle.vacunasPendientes.push(`${vacuna.nombre}: ${dosisAplicadas}/${dosisRequeridas} (${dosisAplicadas === 0 ? 'Sin iniciar' : atrasada ? 'Atrasada' : 'Incompleta'})`);
        vacunasIncompletas.push({
          nino: nino.nombreCompleto,
          edad,
          ...ubicacion,
          vacuna: vacuna.nombre,
          dosisAplicadas,
          dosisRequeridas,
          estado: dosisAplicadas === 0 ? 'Sin iniciar' : atrasada ? 'Atrasada' : 'Incompleta',
          proximaDosis: ultima?.proximaDosis || null,
        });
      }
    }
    if (esquemaCompleto) cobertura.esquemasCompletos += 1;
    detalle.esquemaCompleto = esquemaCompleto;
    detalle.vacunacion = detalle.vacunasPendientes.length ? detalle.vacunasPendientes.join('; ') : esquemaCompleto ? 'Esquema completo' : 'Sin vacunas aplicables por edad';
  }

  const coberturaVacunacion = Array.from(coberturaPorComunidad.values()).map((item) => ({
    comunidad: item.comunidad,
    municipio: item.municipio,
    departamento: item.departamento,
    ninos: item.ninos,
    esquemasCompletos: item.esquemasCompletos,
    dosisAplicadas: item.dosisAplicadas,
    dosisRequeridas: item.dosisRequeridas,
    cobertura: item.dosisRequeridas
      ? redondear((item.dosisAplicadas / item.dosisRequeridas) * 100)
      : null,
  }));

  const crecimientoPromedio = Array.from(crecimientoPorComunidad.values()).map((item) => ({
    comunidad: item.comunidad,
    municipio: item.municipio,
    departamento: item.departamento,
    ninosConMedicion: item.ninosConMedicion,
    pesoPromedio: item.ninosConMedicion ? redondear(item.sumaPeso / item.ninosConMedicion, 2) : null,
    tallaPromedio: item.ninosConMedicion ? redondear(item.sumaTalla / item.ninosConMedicion, 2) : null,
    imcPromedio: item.ninosConMedicion ? redondear(item.sumaImc / item.ninosConMedicion, 2) : null,
  }));

  const datos = {
    generadoEn: hoy,
    filtros,
    opciones,
    resumen: {
      ninos: ninos.length,
      comunidades: comunidadesReporte.length,
      riesgosNutricionales: riesgosNutricionales.length,
      vacunasIncompletas: vacunasIncompletas.length,
    },
    riesgosNutricionales,
    vacunasIncompletas,
    coberturaVacunacion,
    crecimientoPromedio,
    listadoNutricional,
  };
  const tablas = construirTablas(datos);
  // Las solicitudes personalizadas solo devuelven las tablas y columnas elegidas.
  // Se conservan los campos históricos para los clientes del reporte general.
  return opciones.general ? { ...datos, tablas } : { generadoEn: hoy, filtros, opciones, coincidencias: ninos.length, tablas };
}

export async function contarNinosReporte(query = {}, territorio = null) {
  return generarDatosReporte({ ...query, soloConteo: true }, territorio);
}
