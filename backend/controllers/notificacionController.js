import { enviarMensajeTelegram } from '../services/telegramService.js';
import Notificacion from '../models/Notificacion.js';
import Alerta from '../models/Alerta.js';
import Nino from '../models/Nino.js';
import { enviarAlertaEmail, enviarBienvenida } from '../services/emailService.js';

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

export async function pruebaEmail(req, res) {
  try {
    const { email, nombre } = req.body;

    if (!email?.trim()) {
      return res.status(400).json({ mensaje: 'El email es obligatorio' });
    }

    const resultado = await enviarBienvenida({
      email: email.trim(),
      nombreCompleto: nombre?.trim() || 'Usuario de prueba',
    });

    if (resultado.exito) {
      return res.status(200).json({ mensaje: 'Correo enviado correctamente', data: resultado.data });
    }

    return res.status(502).json({ mensaje: 'No se pudo enviar el correo', error: resultado.error });
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
    let enviadas = 0;
    let intentos = 0;

    for (const padre of padres) {
      if (padre.metodoContacto?.includes('telegram') && padre.telegramChatId) {
        intentos += 1;
        const mensaje = `🏥 <b>SCCVI - Alerta de Salud</b>\n\nEstimado/a ${padre.nombreCompleto},\n\nInformación sobre ${nino.nombreCompleto}:\n${alerta.mensaje}\n\nPor favor comuníquese o acuda al centro de salud.`;
        const resultado = await enviarMensajeTelegram(padre.telegramChatId, mensaje);

        await Notificacion.create({
          padre: padre._id,
          alerta: alerta._id,
          canal: 'telegram',
          mensaje,
          estado: resultado.exito ? 'enviada' : 'fallida',
          fechaEnvio: new Date(),
        });

        if (resultado.exito) enviadas += 1;
      }

      if (padre.metodoContacto?.includes('email') && padre.email?.trim()) {
        intentos += 1;
        const resultado = await enviarAlertaEmail(padre, nino, alerta);

        await Notificacion.create({
          padre: padre._id,
          alerta: alerta._id,
          canal: 'email',
          mensaje: alerta.mensaje,
          estado: resultado.exito ? 'enviada' : 'fallida',
          fechaEnvio: new Date(),
        });

        if (resultado.exito) enviadas += 1;
      }
    }

    return res.status(200).json({
      mensaje:
        intentos > 0
          ? `Notificaciones enviadas: ${enviadas} de ${intentos}`
          : 'Ningún padre tiene Telegram o Email configurado',
      enviadas,
      intentos,
      totalPadres: padres.length,
    });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}
