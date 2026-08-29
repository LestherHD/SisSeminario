const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

function escaparHtml(valor = '') {
  return String(valor)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function leerRespuesta(response) {
  const texto = await response.text();

  if (!texto) return {};

  try {
    return JSON.parse(texto);
  } catch {
    return texto;
  }
}

export async function enviarEmail(destinatario, asunto, contenidoHtml) {
  try {
    if (!process.env.BREVO_API_KEY) {
      return { exito: false, error: 'BREVO_API_KEY no está configurada' };
    }

    if (!process.env.BREVO_REMITENTE) {
      return { exito: false, error: 'BREVO_REMITENTE no está configurado' };
    }

    const response = await fetch(BREVO_URL, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: 'Centro de Salud SCCVI',
          email: process.env.BREVO_REMITENTE,
        },
        to: [{ email: destinatario }],
        subject: asunto,
        htmlContent: contenidoHtml,
      }),
    });

    const data = await leerRespuesta(response);

    if (response.ok) {
      return { exito: true, data };
    }

    const detalle =
      typeof data === 'string'
        ? data
        : data?.message || data?.error || JSON.stringify(data);

    return {
      exito: false,
      error: detalle || `Brevo respondió con estado ${response.status}`,
    };
  } catch (error) {
    return { exito: false, error: error.message };
  }
}

export async function enviarBienvenida(padre) {
  const nombre = escaparHtml(padre.nombreCompleto || padre.primerNombre || 'madre, padre o tutor');
  const asunto = 'Bienvenido al Centro de Salud Infantil SCCVI';
  const contenidoHtml = `
    <div style="font-family: Arial, sans-serif; color: #334155; line-height: 1.6; max-width: 620px; margin: auto;">
      <h2 style="color: #118AB2;">¡Bienvenido/a al SCCVI, ${nombre}!</h2>
      <p>Estimado/a <strong>${nombre}</strong>:</p>
      <p>
        Ha sido registrado/a correctamente en el Sistema de Control de Crecimiento y
        Vacunación Infantil (SCCVI).
      </p>
      <p>
        Por este medio le haremos llegar información importante relacionada con la salud,
        el crecimiento y la vacunación de su hijo, hija o hijos registrados en el sistema.
      </p>
      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #dbeafe; color: #64748b;">
        Centro de Salud Infantil SCCVI
      </div>
    </div>
  `;

  return enviarEmail(padre.email, asunto, contenidoHtml);
}

export async function enviarAlertaEmail(padre, nino, alerta) {
  const nombrePadre = escaparHtml(
    padre.nombreCompleto || padre.primerNombre || 'madre, padre o tutor'
  );
  const nombreNino = escaparHtml(nino.nombreCompleto || 'su hijo/a');
  const mensaje = escaparHtml(alerta.mensaje || 'Hay información de salud pendiente de revisar.');
  const esVacuna = alerta.motivo === 'vacuna_atrasada';
  const esCritica = alerta.tipo === 'critica';
  const asunto = esVacuna
    ? `Recordatorio de vacunación de ${nino.nombreCompleto}`
    : `${esCritica ? 'Alerta importante' : 'Aviso preventivo'} de salud de ${nino.nombreCompleto}`;
  const color = esCritica ? '#D32F2F' : esVacuna ? '#F59E0B' : '#118AB2';
  const titulo = esVacuna
    ? 'Recordatorio de vacunación'
    : esCritica
      ? 'Alerta importante de salud'
      : 'Aviso preventivo de salud';
  const contenidoHtml = `
    <div style="font-family: Arial, sans-serif; color: #334155; line-height: 1.6; max-width: 620px; margin: auto;">
      <h2 style="color: ${color};">${titulo}</h2>
      <p>Estimado/a <strong>${nombrePadre}</strong>:</p>
      <p>Le informamos sobre el estado de salud de <strong>${nombreNino}</strong>.</p>
      <div style="background: #F8FAFC; border-left: 4px solid ${color}; padding: 14px 16px; margin: 18px 0;">
        ${mensaje}
      </div>
      <p>
        ${esVacuna
          ? 'Por favor comuníquese o acuda al centro de salud para coordinar la dosis pendiente.'
          : 'Le recomendamos comunicarse con el personal del centro de salud para recibir orientación.'}
      </p>
      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #dbeafe; color: #64748b;">
        Centro de Salud Infantil SCCVI
      </div>
    </div>
  `;

  return enviarEmail(padre.email, asunto, contenidoHtml);
}

export async function enviarCodigoRecuperacion(usuario, codigo) {
  const nombre = escaparHtml(usuario.nombre || 'usuario');
  const codigoSeguro = escaparHtml(codigo);
  const asunto = 'Código para restablecer su contraseña de SCCVI';
  const contenidoHtml = `
    <div style="font-family: Arial, sans-serif; color: #334155; line-height: 1.6; max-width: 620px; margin: auto;">
      <h2 style="color: #118AB2;">Recuperación de contraseña</h2>
      <p>Hola <strong>${nombre}</strong>:</p>
      <p>Recibimos una solicitud para cambiar la contraseña de su cuenta de SCCVI.</p>
      <div style="background: #F0F9FF; border: 1px solid #BAE6FD; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
        <p style="margin: 0 0 8px; color: #64748B;">Su código de confirmación es:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #118AB2;">${codigoSeguro}</div>
      </div>
      <p>Este código vence en <strong>10 minutos</strong> y solo puede utilizarse una vez.</p>
      <p>Si usted no solicitó este cambio, ignore este correo. Su contraseña seguirá siendo la misma.</p>
      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #dbeafe; color: #64748b;">
        Centro de Salud Infantil SCCVI
      </div>
    </div>
  `;

  return enviarEmail(usuario.email, asunto, contenidoHtml);
}

export async function enviarCodigoVerificacionInicial(usuario, codigo) {
  const nombre = escaparHtml(usuario.nombre || 'administrador');
  const codigoSeguro = escaparHtml(codigo);
  const asunto = 'Verifique la cuenta administradora de SCCVI';
  const contenidoHtml = `
    <div style="font-family: Arial, sans-serif; color: #334155; line-height: 1.6; max-width: 620px; margin: auto;">
      <h2 style="color: #118AB2;">Verificación del administrador inicial</h2>
      <p>Hola <strong>${nombre}</strong>:</p>
      <p>
        Se solicitó crear la primera cuenta administradora del Sistema de Control de
        Crecimiento y Vacunación Infantil (SCCVI).
      </p>
      <div style="background: #F0F9FF; border: 1px solid #BAE6FD; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
        <p style="margin: 0 0 8px; color: #64748B;">Código de verificación:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #118AB2;">${codigoSeguro}</div>
      </div>
      <p>El código vence en <strong>10 minutos</strong> y solo puede utilizarse una vez.</p>
      <p>Si usted no inició esta configuración, no comparta el código.</p>
      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #dbeafe; color: #64748b;">
        Centro de Salud Infantil SCCVI
      </div>
    </div>
  `;

  return enviarEmail(usuario.email, asunto, contenidoHtml);
}

export async function enviarCampanaEmail(padre, campana) {
  const nombrePadre = escaparHtml(
    padre.nombreCompleto || padre.primerNombre || 'madre, padre o tutor'
  );
  const nombreCampana = escaparHtml(campana.nombre);
  const descripcion = escaparHtml(campana.descripcion).replaceAll('\n', '<br>');
  const comunidad = campana.comunidad?.nombre
    ? `${campana.comunidad.nombre}, ${campana.municipio}, ${campana.departamento}`
    : campana.municipio
      ? `${campana.municipio}, ${campana.departamento}`
      : campana.departamento;
  const lugar = escaparHtml(comunidad);
  const fecha = new Intl.DateTimeFormat('es-GT', {
    timeZone: 'America/Guatemala',
    dateStyle: 'long',
  }).format(new Date(campana.fechaRealizacion));
  const asunto = `Campaña comunitaria: ${campana.nombre}`;
  const contenidoHtml = `
    <div style="font-family: Arial, sans-serif; color: #334155; line-height: 1.6; max-width: 620px; margin: auto;">
      <h2 style="color: #118AB2;">${nombreCampana}</h2>
      <p>Estimado/a <strong>${nombrePadre}</strong>:</p>
      <p>El Centro de Salud Infantil SCCVI le invita a participar en la siguiente campaña comunitaria:</p>
      <div style="background: #F0F9FF; border-left: 4px solid #118AB2; padding: 16px; margin: 18px 0;">
        <p style="margin: 0 0 8px;"><strong>Fecha:</strong> ${fecha}</p>
        <p style="margin: 0 0 8px;"><strong>Lugar:</strong> ${lugar}</p>
        <p style="margin: 0;">${descripcion}</p>
      </div>
      <p>Le esperamos. Para más información, comuníquese con el personal del centro de salud.</p>
      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #dbeafe; color: #64748b;">
        Centro de Salud Infantil SCCVI
      </div>
    </div>
  `;

  return enviarEmail(padre.email, asunto, contenidoHtml);
}
