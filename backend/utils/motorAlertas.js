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
    return [];
  }

  const candidatas = [];

  const ultimoRegistro = await RegistroCrecimiento.findOne({
    nino: ninoId,
    activo: true,
  }).sort({ fecha: -1 });

  if (ultimoRegistro) {
    if (ultimoRegistro.percentilPeso < 5) {
      candidatas.push({
        nino: ninoId,
        tipo: 'critica',
        motivo: 'desnutricion',
        mensaje: `El niño ${nino.nombre} presenta percentil de peso ${ultimoRegistro.percentilPeso} (posible desnutrición). Se recomienda evaluación.`,
      });
    } else if (ultimoRegistro.percentilPeso > 95) {
      candidatas.push({
        nino: ninoId,
        tipo: 'preventiva',
        motivo: 'sobrepeso',
        mensaje: `El niño ${nino.nombre} presenta percentil de peso ${ultimoRegistro.percentilPeso} (posible sobrepeso).`,
      });
    }
  }

  const haceTresMeses = new Date(Date.now() - TRES_MESES_MS);
  const registroReciente = await RegistroCrecimiento.findOne({
    nino: ninoId,
    activo: true,
    fecha: { $gte: haceTresMeses },
  });

  if (!registroReciente) {
    candidatas.push({
      nino: ninoId,
      tipo: 'preventiva',
      motivo: 'sin_registros',
      mensaje: `El niño ${nino.nombre} no tiene controles de crecimiento recientes (más de 3 meses).`,
    });
  }

  const dosisAtrasada = await Vacunacion.findOne({
    nino: ninoId,
    activo: true,
    proximaDosis: { $exists: true, $ne: null, $lt: new Date() },
  });

  if (dosisAtrasada) {
    candidatas.push({
      nino: ninoId,
      tipo: 'preventiva',
      motivo: 'vacuna_atrasada',
      mensaje: `El niño ${nino.nombre} tiene una o más dosis de vacuna atrasadas.`,
    });
  }

  const alertasCreadas = [];

  for (const candidata of candidatas) {
    const yaExiste = await existeAlertaActiva(ninoId, candidata.motivo);

    if (!yaExiste) {
      const alertaCreada = await Alerta.create(candidata);
      alertasCreadas.push(alertaCreada);
    }
  }

  return alertasCreadas;
}

export async function analizarTodos() {
  const ninos = await Nino.find({ activo: true });

  let total = 0;

  for (const nino of ninos) {
    const alertasCreadas = await analizarNino(nino._id);
    total += alertasCreadas.length;
  }

  return total;
}
