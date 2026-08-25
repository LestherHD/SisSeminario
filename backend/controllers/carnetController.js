import QRCode from 'qrcode';
import Nino from '../models/Nino.js';
import Vacunacion from '../models/Vacunacion.js';
import RegistroCrecimiento from '../models/RegistroCrecimiento.js';
import { enviarMensajeTelegram, enviarFotoTelegram } from '../services/telegramService.js';

async function generarCodigoUnico() {
  let codigo;
  let existe = true;

  while (existe) {
    const numero = Math.floor(1000 + Math.random() * 9000);
    codigo = `CS-${numero}`;
    existe = await Nino.findOne({ codigoCarnet: codigo });
  }

  return codigo;
}

export async function generarCarnet(req, res) {
  try {
    const nino = await Nino.findById(req.params.ninoId);

    if (!nino) {
      return res.status(404).json({ mensaje: 'Niño no encontrado' });
    }

    if (!nino.codigoCarnet) {
      nino.codigoCarnet = await generarCodigoUnico();
    }

    if (!nino.pin) {
      nino.pin = Math.floor(1000 + Math.random() * 9000).toString();
    }

    const urlCarnet = `http://localhost:5173/carnet/${nino.codigoCarnet}`;
    const qrDataUrl = await QRCode.toDataURL(urlCarnet);

    nino.codigoQR = urlCarnet;
    await nino.save();

    return res.status(200).json({
      qrImagen: qrDataUrl,
      codigoCarnet: nino.codigoCarnet,
      pin: nino.pin,
      url: urlCarnet,
      ninoNombre: nino.nombre,
    });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}

export async function enviarCarnetTelegram(req, res) {
  try {
    const nino = await Nino.findById(req.params.ninoId).populate('padres');

    if (!nino) {
      return res.status(404).json({ mensaje: 'Niño no encontrado' });
    }

    if (!nino.codigoCarnet) {
      nino.codigoCarnet = await generarCodigoUnico();
    }

    if (!nino.pin) {
      nino.pin = Math.floor(1000 + Math.random() * 9000).toString();
    }

    const urlCarnet = `http://localhost:5173/carnet/${nino.codigoCarnet}`;
    const qrDataUrl = await QRCode.toDataURL(urlCarnet);

    nino.codigoQR = urlCarnet;
    await nino.save();

    const padresConTelegram = (nino.padres || []).filter((padre) => padre.telegramChatId);

    if (padresConTelegram.length === 0) {
      return res.status(200).json({ mensaje: 'Ningún padre tiene Telegram configurado', enviados: 0 });
    }

    let enviados = 0;

    for (const padre of padresConTelegram) {
      const mensaje = `🏥 <b>SCCVI - Carnet de Salud de ${nino.nombre}</b>\n\nAcceso al carnet de salud:\n\n🔗 Link: ${urlCarnet}\n🔑 Código: ${nino.codigoCarnet}\n📌 PIN: ${nino.pin}\n\nGuarda este mensaje. Puedes usar el link o ingresar el código y PIN en la página.`;

      await enviarMensajeTelegram(padre.telegramChatId, mensaje);
      const resultado = await enviarFotoTelegram(padre.telegramChatId, qrDataUrl, 'Código QR del carnet');

      if (resultado.exito) {
        enviados += 1;
      }
    }

    return res.status(200).json({
      mensaje: `Carnet enviado a ${enviados} padre(s) por Telegram`,
      enviados,
    });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}

export async function verCarnetPublico(req, res) {
  try {
    const { codigo } = req.params;
    const { pin } = req.body;

    const nino = await Nino.findOne({ codigoCarnet: codigo, activo: true }).populate('comunidad', 'nombre');

    if (!nino) {
      return res.status(404).json({ mensaje: 'Carnet no encontrado' });
    }

    if (pin !== nino.pin) {
      return res.status(401).json({ mensaje: 'PIN incorrecto' });
    }

    const vacunacionesRaw = await Vacunacion.find({ nino: nino._id, activo: true }).populate('vacuna', 'nombre');
    const vacunas = vacunacionesRaw.map((v) => ({
      vacuna: v.vacuna?.nombre,
      numeroDosis: v.numeroDosis,
      fechaAplicada: v.fechaAplicada,
    }));

    const crecimientoRaw = await RegistroCrecimiento.find({ nino: nino._id, activo: true })
      .sort({ fecha: -1 })
      .limit(5);
    const crecimiento = crecimientoRaw.map((c) => ({
      fecha: c.fecha,
      peso: c.peso,
      talla: c.talla,
      edadMeses: c.edadMeses,
      percentilPeso: c.percentilPeso,
      percentilTalla: c.percentilTalla,
    }));

    return res.status(200).json({
      nino: {
        nombre: nino.nombre,
        fechaNacimiento: nino.fechaNacimiento,
        sexo: nino.sexo,
        comunidad: nino.comunidad?.nombre,
      },
      vacunas,
      crecimiento,
    });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}
