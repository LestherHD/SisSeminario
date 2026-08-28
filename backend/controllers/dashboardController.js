import Nino from '../models/Nino.js';
import Comunidad from '../models/Comunidad.js';
import Padre from '../models/Padre.js';
import Vacunacion from '../models/Vacunacion.js';
import Alerta from '../models/Alerta.js';

export async function obtenerEstadisticas(req, res) {
  try {
    const totales = {
      ninos: await Nino.countDocuments({ activo: true }),
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
    });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}
