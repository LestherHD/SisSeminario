import Padre from '../models/Padre.js';
import { enviarMensajeTelegram } from './telegramService.js';

let offset = 0;
const esperandoDPI = new Map();

async function consultarUpdates() {
  try {
    const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getUpdates?offset=${offset}&timeout=10`;
    const response = await fetch(url);
    const data = await response.json();

    for (const update of data.result || []) {
      offset = update.update_id + 1;

      if (update.message && update.message.text) {
        const chatId = update.message.chat.id;
        const texto = update.message.text.trim();

        if (texto === '/start') {
          esperandoDPI.set(chatId, true);
          await enviarMensajeTelegram(
            chatId,
            'Bienvenido a SCCVI 🏥\n\nPara vincular tu cuenta y recibir notificaciones sobre la salud de tus hijos, por favor escribe tu número de DPI.'
          );
        } else if (!texto.startsWith('/')) {
          const padre = await Padre.findOne({ dpi: texto, activo: true });

          if (padre) {
            padre.telegramChatId = String(chatId);
            await padre.save();
            esperandoDPI.delete(chatId);
            await enviarMensajeTelegram(
              chatId,
              `¡Vinculación exitosa! ✅\n\nHola ${padre.nombreCompleto}, ahora recibirás notificaciones sobre la salud de tus hijos en el centro SCCVI.`
            );
          } else {
            await enviarMensajeTelegram(
              chatId,
              'No encontré ningún padre registrado con ese DPI. Verifica el número o contacta al centro de salud.'
            );
          }
        }
      }
    }
  } catch (error) {
    console.error('Error consultando updates de Telegram:', error.message);
  }
}

export function iniciarPolling() {
  console.log('🤖 Bot de Telegram escuchando...');

  const loop = async () => {
    await consultarUpdates();
    setTimeout(loop, 3000);
  };

  loop();
}
