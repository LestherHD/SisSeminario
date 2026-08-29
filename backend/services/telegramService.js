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

export async function enviarFotoTelegram(chatId, imagenBase64, caption) {
  try {
    const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendPhoto`;
    const base64Limpio = imagenBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Limpio, 'base64');

    const form = new FormData();
    form.append('chat_id', chatId);
    form.append('caption', caption);
    form.append('parse_mode', 'HTML');
    form.append('photo', new Blob([buffer], { type: 'image/png' }), 'carnet.png');

    const response = await fetch(url, {
      method: 'POST',
      body: form,
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

function escaparHtmlTelegram(valor = '') {
  return String(valor)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export async function enviarCampanaTelegram(padre, campana) {
  const nombrePadre = escaparHtmlTelegram(
    padre.nombreCompleto || padre.primerNombre || 'madre, padre o tutor'
  );
  const nombreCampana = escaparHtmlTelegram(campana.nombre);
  const descripcion = escaparHtmlTelegram(campana.descripcion);
  const ubicacion = campana.comunidad?.nombre
    ? `${campana.comunidad.nombre}, ${campana.municipio}, ${campana.departamento}`
    : campana.municipio
      ? `${campana.municipio}, ${campana.departamento}`
      : campana.departamento;
  const lugar = escaparHtmlTelegram(ubicacion);
  const fecha = new Intl.DateTimeFormat('es-GT', {
    timeZone: 'America/Guatemala',
    dateStyle: 'long',
  }).format(new Date(campana.fechaRealizacion));
  const mensaje = [
    '🏥 <b>SCCVI - Campaña comunitaria</b>',
    '',
    `Estimado/a <b>${nombrePadre}</b>:`,
    '',
    `Le invitamos a participar en <b>${nombreCampana}</b>.`,
    `📅 <b>Fecha:</b> ${fecha}`,
    `📍 <b>Lugar:</b> ${lugar}`,
    '',
    descripcion,
    '',
    'Para más información, comuníquese con el personal del centro de salud.',
  ].join('\n');

  return enviarMensajeTelegram(padre.telegramChatId, mensaje);
}
