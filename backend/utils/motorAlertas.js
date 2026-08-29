import Nino from '../models/Nino.js';
import RegistroCrecimiento from '../models/RegistroCrecimiento.js';
import Vacunacion from '../models/Vacunacion.js';
import Alerta from '../models/Alerta.js';
import Padre from '../models/Padre.js';
import Notificacion from '../models/Notificacion.js';
import { enviarMensajeTelegram } from '../services/telegramService.js';
import { enviarAlertaEmail } from '../services/emailService.js';

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

async function notificarAlertaNueva(alerta) {
  try {
    const nino = await Nino.findById(alerta.nino).populate('padres');
    const padres = nino?.padres || [];

    for (const padre of padres) {
      if (padre.metodoContacto?.includes('telegram') && padre.telegramChatId) {
        const yaNotificadoTelegram = await Notificacion.findOne({
          alerta: alerta._id,
          padre: padre._id,
          canal: 'telegram',
          estado: 'enviada',
        });

        if (!yaNotificadoTelegram) {
          const encabezado = alerta.tipo === 'critica' ? '🚨 Alerta Crítica' : '🏥 Aviso de Salud';
          const mensaje = `<b>SCCVI - ${encabezado}</b>\n\nEstimado/a ${padre.nombreCompleto},\n\nInformación sobre ${nino.nombreCompleto}:\n${alerta.mensaje}\n\nPor favor comuníquese o acuda al centro de salud.`;
          const resultado = await enviarMensajeTelegram(padre.telegramChatId, mensaje);

          await Notificacion.create({
            padre: padre._id,
            alerta: alerta._id,
            canal: 'telegram',
            mensaje,
            estado: resultado.exito ? 'enviada' : 'fallida',
            fechaEnvio: new Date(),
          });
        }
      }

      if (padre.metodoContacto?.includes('email') && padre.email?.trim()) {
        const yaNotificadoEmail = await Notificacion.findOne({
          alerta: alerta._id,
          padre: padre._id,
          canal: 'email',
          estado: 'enviada',
        });

        if (!yaNotificadoEmail) {
          const resultado = await enviarAlertaEmail(padre, nino, alerta);

          await Notificacion.create({
            padre: padre._id,
            alerta: alerta._id,
            canal: 'email',
            mensaje: alerta.mensaje,
            estado: resultado.exito ? 'enviada' : 'fallida',
            fechaEnvio: new Date(),
          });
        }
      }
    }
  } catch (error) {
    console.error('Error notificando alerta:', error.message);
  }
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
  }).populate('vacuna', 'nombre');

  const evaluaciones = {
    desnutricion: {
      activa: Boolean(ultimoRegistro && ultimoRegistro.percentilPeso < 5),
      tipo: 'critica',
      mensaje: ultimoRegistro
        ? `El niño ${nino.nombreCompleto} presenta percentil de peso ${ultimoRegistro.percentilPeso} (posible desnutrición). Se recomienda evaluación.`
        : '',
    },
    sobrepeso: {
      activa: Boolean(ultimoRegistro && ultimoRegistro.percentilPeso > 95),
      tipo: 'preventiva',
      mensaje: ultimoRegistro
        ? `El niño ${nino.nombreCompleto} presenta percentil de peso ${ultimoRegistro.percentilPeso} (posible sobrepeso).`
        : '',
    },
    sin_registros: {
      activa: !registroReciente,
      tipo: 'preventiva',
      mensaje: `El niño ${nino.nombreCompleto} no tiene controles de crecimiento recientes (más de 3 meses).`,
    },
    vacuna_atrasada: {
      activa: Boolean(dosisAtrasada),
      tipo: 'preventiva',
      mensaje: dosisAtrasada
        ? `La próxima dosis de ${dosisAtrasada.vacuna?.nombre || 'una vacuna'} para ${nino.nombreCompleto} estaba programada para el ${new Date(dosisAtrasada.proximaDosis).toLocaleDateString('es-GT')} y se encuentra pendiente.`
        : '',
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

        await notificarAlertaNueva(alertaCreada);
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
