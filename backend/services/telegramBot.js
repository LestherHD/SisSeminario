import Padre from '../models/Padre.js';
import { enviarMensajeTelegram } from './telegramService.js';

let offset = 0;
const esperandoDPI = new Map();

function normalizarDpi(valor) {
  return String(valor || '').replace(/\s+/g, '').trim();
}

async function consultarUpdates() {
  try {
    const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getUpdates?offset=${offset}&timeout=10`;
    const response = await fetch(url);
    const data = await response.json();

    for (const update of data.result || []) {
      offset = update.update_id + 1;

      if (update.message && update.message.text) {
        const chatId = String(update.message.chat.id);
        const texto = update.message.text.trim();

        if (texto === '/start') {
          const vinculacionActual = await Padre.findOne({
            telegramChatId: chatId,
            activo: true,
          }).select('nombreCompleto');

          if (vinculacionActual) {
            esperandoDPI.delete(chatId);
            await enviarMensajeTelegram(
              chatId,
              `Este chat ya está vinculado con ${vinculacionActual.nombreCompleto}. Si necesita cambiar la vinculación, solicite al administrador que la revoque.`
            );
            continue;
          }

          esperandoDPI.set(chatId, true);
          await enviarMensajeTelegram(
            chatId,
            'Bienvenido a SCCVI 🏥\n\nPara vincular tu cuenta y recibir notificaciones sobre la salud de tus hijos, por favor escribe tu número de DPI.'
          );
        } else if (!texto.startsWith('/') && esperandoDPI.has(chatId)) {
          const dpi = normalizarDpi(texto);
          const padre = await Padre.findOne({
            dpi,
            activo: true,
            metodoContacto: 'telegram',
          });

          if (padre) {
            if (padre.telegramChatId && padre.telegramChatId !== chatId) {
              esperandoDPI.delete(chatId);
              await enviarMensajeTelegram(
                chatId,
                'Este DPI ya está vinculado a otro chat. Por seguridad, el administrador debe revocar la vinculación anterior antes de registrar un nuevo dispositivo.'
              );
              continue;
            }

            const chatUsado = await Padre.findOne({
              _id: { $ne: padre._id },
              telegramChatId: chatId,
              activo: true,
            }).select('_id');
            if (chatUsado) {
              esperandoDPI.delete(chatId);
              await enviarMensajeTelegram(
                chatId,
                'Este chat ya está vinculado a otro padre o tutor. Solicite al administrador que revise la vinculación.'
              );
              continue;
            }

            padre.telegramChatId = chatId;
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
        } else if (!texto.startsWith('/')) {
          await enviarMensajeTelegram(chatId, 'Para iniciar una vinculación segura, escriba /start.');
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
