import Nino from '../models/Nino.js';
import Comunidad from '../models/Comunidad.js';
import Padre from '../models/Padre.js';
import Vacunacion from '../models/Vacunacion.js';
import Alerta from '../models/Alerta.js';
import RegistroCrecimiento from '../models/RegistroCrecimiento.js';

function obtenerFechaInicio(periodo) {
  const hoy = new Date();

  if (periodo === 'mes') {
    return new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  }
  if (periodo === '3meses') {
    return new Date(hoy.getFullYear(), hoy.getMonth() - 2, 1);
  }
  if (periodo === '6meses') {
    return new Date(hoy.getFullYear(), hoy.getMonth() - 5, 1);
  }

  return null;
}

export async function obtenerEstadisticas(req, res) {
  try {
    const periodo = ['mes', '3meses', '6meses', 'todo'].includes(req.query.periodo)
      ? req.query.periodo
      : 'mes';
    const fechaInicio = obtenerFechaInicio(periodo);
    const ninosActivos = await Nino.find({ activo: true }).select('_id sexo').lean();

    const totales = {
      ninos: ninosActivos.length,
      comunidades: await Comunidad.countDocuments({ activo: true }),
      padres: await Padre.countDocuments({ activo: true }),
      dosisAplicadas: await Vacunacion.countDocuments({ activo: true }),
      alertasActivas: await Alerta.countDocuments({ activo: true, atendida: false }),
      alertasCriticas: await Alerta.countDocuments({
        activo: true,
        atendida: false,
        tipo: 'critica',
      }),
    };

    const porSexo = ninosActivos.reduce(
      (conteo, nino) => {
        if (nino.sexo === 'M') conteo.ninos += 1;
        if (nino.sexo === 'F') conteo.ninas += 1;
        return conteo;
      },
      { ninos: 0, ninas: 0 }
    );

    const estadoNutricional = {
      desnutricion: 0,
      normal: 0,
      sobrepeso: 0,
      obesidad: 0,
      sinDatos: 0,
    };
    const coberturaVacunacion = { alDia: 0, atrasados: 0, sinEsquema: 0 };
    const hoy = new Date();

    await Promise.all(
      ninosActivos.map(async (nino) => {
        const [ultimoCrecimiento, vacunaciones] = await Promise.all([
          RegistroCrecimiento.findOne({ nino: nino._id, activo: true })
            .sort({ fecha: -1 })
            .select('estadoNutricional')
            .lean(),
          Vacunacion.find({ nino: nino._id, activo: true })
            .select('proximaDosis')
            .lean(),
        ]);

        const estado = ultimoCrecimiento?.estadoNutricional;
        if (!estado || estado === 'sin_datos') {
          estadoNutricional.sinDatos += 1;
        } else if (
          ['desnutricion', 'desnutricion_severa', 'delgadez', 'delgadez_severa'].includes(estado)
        ) {
          estadoNutricional.desnutricion += 1;
        } else if (estado === 'normal') {
          estadoNutricional.normal += 1;
        } else if (['riesgo_sobrepeso', 'sobrepeso'].includes(estado)) {
          estadoNutricional.sobrepeso += 1;
        } else {
          estadoNutricional.obesidad += 1;
        }

        if (vacunaciones.length === 0) {
          coberturaVacunacion.sinEsquema += 1;
        } else if (
          vacunaciones.some(
            (vacunacion) => vacunacion.proximaDosis && vacunacion.proximaDosis < hoy
          )
        ) {
          coberturaVacunacion.atrasados += 1;
        } else {
          coberturaVacunacion.alDia += 1;
        }
      })
    );

    totales.ninosVacunados = coberturaVacunacion.alDia + coberturaVacunacion.atrasados;
    totales.coberturaVacunacion = totales.ninos
      ? Math.round((totales.ninosVacunados / totales.ninos) * 100)
      : 0;

    const filtroFechaVacunacion = fechaInicio ? { fechaAplicada: { $gte: fechaInicio } } : {};
    const filtroFechaAlertas = fechaInicio ? { fecha: { $gte: fechaInicio } } : {};
    const actividadPeriodo = {
      periodo,
      fechaInicio,
      dosisAplicadas: await Vacunacion.countDocuments({
        activo: true,
        ...filtroFechaVacunacion,
      }),
      alertasGeneradas: await Alerta.countDocuments({
        activo: true,
        ...filtroFechaAlertas,
      }),
    };

    const ninosPorComunidad = await Nino.aggregate([
      { $match: { activo: true } },
      { $group: { _id: '$comunidad', cantidad: { $sum: 1 } } },
      {
        $lookup: {
          from: 'comunidads',
          localField: '_id',
          foreignField: '_id',
          as: 'comunidadInfo',
        },
      },
      {
        $project: {
          _id: 0,
          nombre: { $arrayElemAt: ['$comunidadInfo.nombre', 0] },
          cantidad: 1,
        },
      },
    ]);

    const ninosPorUbicacion = await Nino.aggregate([
      { $match: { activo: true } },
      {
        $lookup: {
          from: 'comunidads',
          localField: 'comunidad',
          foreignField: '_id',
          as: 'comunidadInfo',
        },
      },
      { $unwind: '$comunidadInfo' },
      { $match: { 'comunidadInfo.activo': true } },
      {
        $group: {
          _id: {
            comunidadId: '$comunidadInfo._id',
            comunidad: '$comunidadInfo.nombre',
            municipio: '$comunidadInfo.municipio',
            departamento: '$comunidadInfo.departamento',
          },
          cantidad: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          comunidadId: '$_id.comunidadId',
          comunidad: '$_id.comunidad',
          municipio: '$_id.municipio',
          departamento: '$_id.departamento',
          cantidad: 1,
        },
      },
      { $sort: { departamento: 1, municipio: 1, comunidad: 1 } },
    ]);

    const alertasPorTipo = await Alerta.aggregate([
      { $match: { activo: true, atendida: false } },
      { $group: { _id: '$tipo', cantidad: { $sum: 1 } } },
      { $project: { _id: 0, tipo: '$_id', cantidad: 1 } },
    ]);

    const alertasPorMotivo = await Alerta.aggregate([
      { $match: { activo: true, atendida: false } },
      { $group: { _id: '$motivo', cantidad: { $sum: 1 } } },
      { $project: { _id: 0, motivo: '$_id', cantidad: 1 } },
    ]);

    const alertasCriticasDetalle = await Alerta.find({
      activo: true,
      atendida: false,
      tipo: 'critica',
    })
      .populate('nino', 'nombreCompleto')
      .limit(10);

    const ninosConAlertasCriticas = alertasCriticasDetalle.map((alerta) => ({
      ninoNombre: alerta.nino?.nombreCompleto || '-',
      mensaje: alerta.mensaje,
      fecha: alerta.fecha,
    }));

    return res.status(200).json({
      totales,
      ninosPorComunidad,
      alertasPorTipo,
      alertasPorMotivo,
      ninosConAlertasCriticas,
      porSexo,
      estadoNutricional,
      coberturaVacunacion,
      actividadPeriodo,
      ninosPorUbicacion,
    });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}
