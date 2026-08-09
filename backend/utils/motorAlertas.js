import Nino from '../models/Nino.js';
import RegistroCrecimiento from '../models/RegistroCrecimiento.js';
import Vacunacion from '../models/Vacunacion.js';
import Alerta from '../models/Alerta.js';

const TRES_MESES_MS = 1000 * 60 * 60 * 24 * 30 * 3;

async function existeAlertaActiva(ninoId, motivo) {
  const alerta = await Alerta.findOne({
    nino: ninoId,
    motivo,
    activo: true,
    atendida: false,
  });

  return Boolean(alerta);
}

export async function analizarNino(ninoId) {
  const nino = await Nino.findById(ninoId);

  if (!nino || !nino.activo) {
    return { creadas: [], resueltas: 0 };
  }

  const ultimoRegistro = await RegistroCrecimiento.findOne({
    nino: ninoId,
    activo: true,
  }).sort({ fecha: -1 });

  const haceTresMeses = new Date(Date.now() - TRES_MESES_MS);
  const registroReciente = await RegistroCrecimiento.findOne({
    nino: ninoId,
    activo: true,
    fecha: { $gte: haceTresMeses },
  });

  const dosisAtrasada = await Vacunacion.findOne({
    nino: ninoId,
    activo: true,
    proximaDosis: { $exists: true, $ne: null, $lt: new Date() },
  });

  const evaluaciones = {
    desnutricion: {
      activa: Boolean(ultimoRegistro && ultimoRegistro.percentilPeso < 5),
      tipo: 'critica',
      mensaje: ultimoRegistro
        ? `El niño ${nino.nombre} presenta percentil de peso ${ultimoRegistro.percentilPeso} (posible desnutrición). Se recomienda evaluación.`
        : '',
    },
    sobrepeso: {
      activa: Boolean(ultimoRegistro && ultimoRegistro.percentilPeso > 95),
      tipo: 'preventiva',
      mensaje: ultimoRegistro
        ? `El niño ${nino.nombre} presenta percentil de peso ${ultimoRegistro.percentilPeso} (posible sobrepeso).`
        : '',
    },
    sin_registros: {
      activa: !registroReciente,
      tipo: 'preventiva',
      mensaje: `El niño ${nino.nombre} no tiene controles de crecimiento recientes (más de 3 meses).`,
    },
    vacuna_atrasada: {
      activa: Boolean(dosisAtrasada),
      tipo: 'preventiva',
      mensaje: `El niño ${nino.nombre} tiene una o más dosis de vacuna atrasadas.`,
    },
  };

  const creadas = [];
  let resueltas = 0;

  for (const [motivo, evaluacion] of Object.entries(evaluaciones)) {
    if (evaluacion.activa) {
      const yaExiste = await existeAlertaActiva(ninoId, motivo);

      if (!yaExiste) {
        const alertaCreada = await Alerta.create({
          nino: ninoId,
          tipo: evaluacion.tipo,
          motivo,
          mensaje: evaluacion.mensaje,
        });
        creadas.push(alertaCreada);
      }
    } else {
      const resultado = await Alerta.updateMany(
        { nino: ninoId, motivo, activo: true },
        { activo: false }
      );
      resueltas += resultado.modifiedCount || 0;
    }
  }

  return { creadas, resueltas };
}

export async function analizarTodos() {
  const ninos = await Nino.find({ activo: true });

  let total = 0;

  for (const nino of ninos) {
    const resultado = await analizarNino(nino._id);
    total += resultado.creadas.length;
  }

  return total;
}
