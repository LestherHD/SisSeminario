import { enviarMensajeTelegram } from '../services/telegramService.js';
import Notificacion from '../models/Notificacion.js';
import Alerta from '../models/Alerta.js';
import Nino from '../models/Nino.js';

export async function prueba(req, res) {
  try {
    const { chatId, mensaje } = req.body;
    const resultado = await enviarMensajeTelegram(
      chatId,
      mensaje || 'Mensaje de prueba desde SCCVI 🏥'
    );

    if (resultado.exito) {
      return res.status(200).json({ mensaje: 'Mensaje enviado correctamente', data: resultado.data });
    }

    return res.status(400).json({ mensaje: 'No se pudo enviar', error: resultado.error });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}

export async function notificarAlerta(req, res) {
  try {
    const { alertaId } = req.body;
    const alerta = await Alerta.findById(alertaId).populate('nino');

    if (!alerta) {
      return res.status(404).json({ mensaje: 'Alerta no encontrada' });
    }

    const nino = await Nino.findById(alerta.nino._id).populate('padres');
    const padres = nino.padres || [];
    const padresConTelegram = padres.filter(
      (padre) => padre.metodoContacto?.includes('telegram') && padre.telegramChatId
    );

    if (padresConTelegram.length === 0) {
      return res.status(200).json({ mensaje: 'Ningún padre tiene Telegram configurado', enviadas: 0 });
    }

    let enviadas = 0;

    for (const padre of padresConTelegram) {
      const mensaje = `🏥 <b>SCCVI - Alerta de Salud</b>\n\nEstimado/a ${padre.nombreCompleto},\n\n${alerta.mensaje}\n\nPor favor acuda al centro de salud.`;
      const resultado = await enviarMensajeTelegram(padre.telegramChatId, mensaje);

      await Notificacion.create({
        padre: padre._id,
        alerta: alerta._id,
        canal: 'telegram',
        mensaje,
        estado: resultado.exito ? 'enviada' : 'fallida',
        fechaEnvio: new Date(),
      });

      if (resultado.exito) {
        enviadas += 1;
      }
    }

    return res.status(200).json({
      mensaje: `Notificaciones enviadas: ${enviadas} de ${padresConTelegram.length}`,
      enviadas,
      totalPadres: padresConTelegram.length,
    });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}
