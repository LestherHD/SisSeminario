import Nino from '../models/Nino.js';
import RegistroCrecimiento from '../models/RegistroCrecimiento.js';
import Vacunacion from '../models/Vacunacion.js';
import Alerta from '../models/Alerta.js';
import Padre from '../models/Padre.js';
import Notificacion from '../models/Notificacion.js';
import { enviarMensajeTelegram } from '../services/telegramService.js';
import { enviarAlertaEmail } from '../services/emailService.js';

const DIA_MS = 1000 * 60 * 60 * 24;
const MES_PROMEDIO_MS = DIA_MS * 30.4375;

async function buscarAlertaActiva(ninoId, motivo) {
  return Alerta.findOne({
    nino: ninoId,
    motivo,
    activo: true,
  });
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

  const ahora = new Date();
  const edadMeses = Math.max(
    0,
    (ahora.getTime() - new Date(nino.fechaNacimiento).getTime()) / MES_PROMEDIO_MS
  );
  const mesesControl = edadMeses < 24 ? 1 : 3;
  const fechaLimiteControl = new Date(ahora.getTime() - mesesControl * MES_PROMEDIO_MS);
  const sinControlReciente = !ultimoRegistro || ultimoRegistro.fecha < fechaLimiteControl;

  const inicioHoyUtc = new Date(ahora);
  inicioHoyUtc.setUTCHours(0, 0, 0, 0);
  const inicioMananaUtc = new Date(inicioHoyUtc.getTime() + DIA_MS);
  const finMananaUtc = new Date(inicioMananaUtc.getTime() + DIA_MS);

  const dosisAtrasada = await Vacunacion.findOne({
    nino: ninoId,
    activo: true,
    proximaDosis: { $exists: true, $ne: null, $lt: inicioHoyUtc },
  }).sort({ proximaDosis: 1 }).populate('vacuna', 'nombre');

  const dosisProxima = await Vacunacion.findOne({
    nino: ninoId,
    activo: true,
    proximaDosis: { $gte: inicioMananaUtc, $lt: finMananaUtc },
  }).populate('vacuna', 'nombre');

  const estadoNutricional = ultimoRegistro?.estadoNutricional;
  const estadosDesnutricion = [
    'desnutricion_severa',
    'desnutricion',
    'delgadez_severa',
    'delgadez',
  ];
  const estadosSobrepeso = ['riesgo_sobrepeso', 'sobrepeso', 'obesidad'];
  const esDesnutricion = estadosDesnutricion.includes(estadoNutricional);
  const esSobrepeso = estadosSobrepeso.includes(estadoNutricional);

  const evaluaciones = {
    desnutricion: {
      activa: esDesnutricion,
      tipo: 'critica',
      mensaje: ultimoRegistro
        ? `${nino.nombreCompleto} presenta ${estadoNutricional.replaceAll('_', ' ')} según IMC para la edad (OMS, puntaje Z ${ultimoRegistro.zImcEdad}). Por favor acuda al centro de salud para evaluación.`
        : '',
    },
    sobrepeso: {
      activa: esSobrepeso,
      tipo: estadoNutricional === 'obesidad' ? 'critica' : 'preventiva',
      mensaje: ultimoRegistro
        ? `${nino.nombreCompleto} presenta ${estadoNutricional.replaceAll('_', ' ')} según IMC para la edad (OMS, puntaje Z ${ultimoRegistro.zImcEdad}). Por favor acuda al centro de salud para evaluación.`
        : '',
    },
    sin_registros: {
      activa: sinControlReciente,
      tipo: 'preventiva',
      mensaje: `${nino.nombreCompleto} no cuenta con un registro de crecimiento en ${mesesControl === 1 ? 'el último mes' : 'los últimos 3 meses'}. Por favor acuda al centro de salud para realizar su control.`,
    },
    vacuna_proxima: {
      activa: Boolean(dosisProxima),
      tipo: 'preventiva',
      mensaje: dosisProxima
        ? `Recordatorio: mañana corresponde la próxima dosis de ${dosisProxima.vacuna?.nombre || 'una vacuna'} para ${nino.nombreCompleto}. Por favor acuda al centro de salud.`
        : '',
    },
    vacuna_atrasada: {
      activa: Boolean(dosisAtrasada),
      tipo: 'preventiva',
      mensaje: dosisAtrasada
        ? `La dosis de ${dosisAtrasada.vacuna?.nombre || 'una vacuna'} para ${nino.nombreCompleto}, programada para el ${new Intl.DateTimeFormat('es-GT', { timeZone: 'UTC' }).format(new Date(dosisAtrasada.proximaDosis))}, ya venció y continúa pendiente. Por favor acuda al centro de salud.`
        : '',
    },
  };

  const creadas = [];
  let resueltas = 0;

  for (const [motivo, evaluacion] of Object.entries(evaluaciones)) {
    if (evaluacion.activa) {
      const alertaExistente = await buscarAlertaActiva(ninoId, motivo);

      if (!alertaExistente) {
        const alertaCreada = await Alerta.create({
          nino: ninoId,
          tipo: evaluacion.tipo,
          motivo,
          mensaje: evaluacion.mensaje,
        });
        creadas.push(alertaCreada);

        await notificarAlertaNueva(alertaCreada);
      } else if (
        alertaExistente.tipo !== evaluacion.tipo ||
        alertaExistente.mensaje !== evaluacion.mensaje
      ) {
        alertaExistente.tipo = evaluacion.tipo;
        alertaExistente.mensaje = evaluacion.mensaje;
        await alertaExistente.save();
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
