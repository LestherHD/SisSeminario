import { COLUMNAS, ESTADOS } from './reporteOpciones.js';

const TITULOS = {
  resumenCantidades: 'Resumen de cantidades', listadoNutricional: 'Estado nutricional de los niños',
  vacunasIncompletas: 'Vacunas incompletas', coberturaVacunacion: 'Cobertura de vacunación', crecimientoPromedio: 'Crecimiento promedio',
};
const columnasDe = (campos) => Object.entries(campos).map(([clave, titulo]) => ({ clave, titulo }));
const promedio = (filas, campo) => {
  const valores = filas.map((fila) => fila[campo]).filter((valor) => Number.isFinite(valor));
  return valores.length ? Number((valores.reduce((a, b) => a + b, 0) / valores.length).toFixed(2)) : null;
};
function agrupar(filas, agrupacion) {
  const grupos = new Map();
  if (agrupacion === 'general') grupos.set('Total', []);
  for (const fila of filas) {
    const grupo = agrupacion === 'porComunidad' ? `${fila.departamento} / ${fila.municipio} / ${fila.comunidad}`
      : agrupacion === 'porSexo' ? fila.sexo === 'M' ? 'Niños' : 'Niñas'
        : agrupacion === 'porEstadoNutricional' ? ESTADOS[fila.estadoNutricional] : 'Total';
    if (!grupos.has(grupo)) grupos.set(grupo, []);
    grupos.get(grupo).push(fila);
  }
  return [...grupos].map(([grupo, miembros]) => {
    const aplicadas = miembros.reduce((s, fila) => s + fila.dosisAplicadas, 0);
    const requeridas = miembros.reduce((s, fila) => s + fila.dosisRequeridas, 0);
    return {
      grupo, ninos: miembros.length, comunidades: new Set(miembros.map((fila) => fila.comunidadId)).size,
      ...Object.fromEntries(Object.keys(ESTADOS).map((estado) => [estado, miembros.filter((fila) => fila.estadoNutricional === estado).length])),
      ninosPendientes: miembros.filter((fila) => fila.vacunasPendientes.length).length,
      vacunasPendientes: miembros.reduce((s, fila) => s + fila.vacunasPendientes.length, 0),
      dosisAplicadas: aplicadas, dosisRequeridas: requeridas,
      esquemasCompletos: miembros.filter((fila) => fila.esquemaCompleto).length,
      cobertura: requeridas ? Number((aplicadas / requeridas * 100).toFixed(1)) : null,
      ninosConMedicion: miembros.filter((fila) => fila.medido).length,
      pesoPromedio: promedio(miembros, 'peso'), tallaPromedio: promedio(miembros, 'talla'), imcPromedio: promedio(miembros, 'imc'),
    };
  });
}

export function construirTablas(datos) {
  const { opciones, listadoNutricional: filas } = datos;
  const tablas = [];
  const agregar = (seccion, tipo, campos, registros) => {
    const columnas = columnasDe(campos);
    tablas.push({ seccion, titulo: TITULOS[seccion], tipo, columnas,
      filas: registros.map((registro) => Object.fromEntries(columnas.map(({ clave }) => [clave, registro[clave] ?? null]))) });
  };
  if (opciones.general) {
    agregar('resumenCantidades', 'cantidades', { ninos: 'Niños', comunidades: 'Comunidades', riesgosNutricionales: 'Riesgos nutricionales', vacunasIncompletas: 'Vacunas incompletas' }, [datos.resumen]);
    agregar('listadoNutricional', 'detalle', { nombre: 'Nombre', edad: 'Edad', sexo: 'Sexo', comunidad: 'Comunidad', clasificacionNutricional: 'Clasificación', peso: 'Peso kg', talla: 'Talla cm', imc: 'IMC', zPeso: 'Z peso', zImc: 'Z IMC', fechaMedicion: 'Medición' }, filas);
    agregar('vacunasIncompletas', 'detalle', { nino: 'Nombre', edad: 'Edad', comunidad: 'Comunidad', municipio: 'Municipio', vacuna: 'Vacuna', dosisAplicadas: 'Dosis aplicadas', dosisRequeridas: 'Dosis requeridas', estado: 'Estado', proximaDosis: 'Próxima dosis' }, datos.vacunasIncompletas);
    agregar('coberturaVacunacion', 'cantidades', { departamento: 'Departamento', municipio: 'Municipio', comunidad: 'Comunidad', ninos: 'Niños', esquemasCompletos: 'Esquemas completos', dosisAplicadas: 'Dosis aplicadas', dosisRequeridas: 'Dosis requeridas', cobertura: 'Cobertura %' }, datos.coberturaVacunacion);
    agregar('crecimientoPromedio', 'cantidades', { departamento: 'Departamento', municipio: 'Municipio', comunidad: 'Comunidad', ninosConMedicion: 'Niños medidos', pesoPromedio: 'Peso promedio kg', tallaPromedio: 'Talla promedio cm', imcPromedio: 'IMC promedio' }, datos.crecimientoPromedio);
    return tablas;
  }
  const grupos = agrupar(filas, opciones.agrupacion);
  const metricas = {
    resumenCantidades: { ninos: 'Niños', comunidades: 'Comunidades' },
    listadoNutricional: { ninos: 'Niños', ...ESTADOS },
    vacunasIncompletas: { ninosPendientes: 'Niños con vacunas pendientes', vacunasPendientes: 'Pares niño/vacuna pendientes' },
    coberturaVacunacion: { ninos: 'Niños', esquemasCompletos: 'Esquemas completos', dosisAplicadas: 'Dosis aplicadas', dosisRequeridas: 'Dosis requeridas', cobertura: 'Cobertura %' },
    crecimientoPromedio: { ninosConMedicion: 'Niños medidos', pesoPromedio: 'Peso promedio kg', tallaPromedio: 'Talla promedio cm', imcPromedio: 'IMC promedio' },
  };
  for (const [seccion, incluida] of Object.entries(opciones.secciones)) {
    if (!incluida) continue;
    if (opciones.modo !== 'detalle' || seccion === 'resumenCantidades') agregar(seccion, 'cantidades', { grupo: 'Grupo', ...metricas[seccion] }, grupos);
    if (opciones.modo !== 'cantidades' && seccion !== 'resumenCantidades') {
      const seleccion = seccion === 'vacunasIncompletas' ? filas.filter((fila) => fila.vacunasPendientes.length)
        : seccion === 'crecimientoPromedio' ? filas.filter((fila) => fila.medido) : filas;
      agregar(seccion, 'detalle', Object.fromEntries(opciones.columnas.map((clave) => [clave, COLUMNAS[clave]])), seleccion);
    }
  }
  return tablas;
}
