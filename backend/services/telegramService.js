export async function enviarMensajeTelegram(chatId, mensaje) {
  try {
    const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: mensaje, parse_mode: 'HTML' }),
    });

    const data = await response.json();

    if (response.ok && data.ok) {
      return { exito: true, data };
    }

    return { exito: false, error: data.description || 'Error al enviar' };
  } catch (error) {
    return { exito: false, error: error.message };
  }
}
