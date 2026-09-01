import QRCode from 'qrcode';
import Nino from '../models/Nino.js';
import Vacunacion from '../models/Vacunacion.js';
import RegistroCrecimiento from '../models/RegistroCrecimiento.js';
import Alerta from '../models/Alerta.js';
import { enviarMensajeTelegram, enviarFotoTelegram } from '../services/telegramService.js';
import { asegurarCredencialesCarnet } from '../services/carnetService.js';

export async function generarCarnet(req, res) {
  try {
    const nino = await Nino.findById(req.params.ninoId);

    if (!nino) {
      return res.status(404).json({ mensaje: 'Niño no encontrado' });
    }

    const urlCarnet = await asegurarCredencialesCarnet(nino, req);
    const qrDataUrl = await QRCode.toDataURL(urlCarnet);

    await nino.save();

    return res.status(200).json({
      qrImagen: qrDataUrl,
      codigoCarnet: nino.codigoCarnet,
      pin: nino.pin,
      url: urlCarnet,
      ninoNombre: nino.nombreCompleto,
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

    const urlCarnet = await asegurarCredencialesCarnet(nino, req);
    const qrDataUrl = await QRCode.toDataURL(urlCarnet);

    await nino.save();

    const padresConTelegram = (nino.padres || []).filter(
      (padre) => padre.metodoContacto?.includes('telegram') && padre.telegramChatId
    );

    if (padresConTelegram.length === 0) {
      return res.status(200).json({ mensaje: 'Ningún padre tiene Telegram configurado', enviados: 0 });
    }

    let enviados = 0;

    for (const padre of padresConTelegram) {
      const mensaje = `🏥 <b>SCCVI - Carnet de Salud de ${nino.nombreCompleto}</b>\n\nAcceso al carnet de salud:\n\n🔗 Link: ${urlCarnet}\n🔑 Código: ${nino.codigoCarnet}\n📌 PIN: ${nino.pin}\n\nGuarda este mensaje. Puedes usar el link o ingresar el código y PIN en la página.`;

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

export async function armarExpediente(ninoId) {
  const nino = await Nino.findOne({ _id: ninoId, activo: true })
    .populate('comunidad', 'nombre departamento municipio')
    .populate('padres', 'nombreCompleto')
    .lean();

  if (!nino) {
    return null;
  }

  const [vacunaciones, crecimiento, alertasActivas] = await Promise.all([
    Vacunacion.find({ nino: ninoId, activo: true })
      .populate('vacuna', 'nombre numeroDosis dosisTotales')
      .sort({ fechaAplicada: 1 })
      .lean(),
    RegistroCrecimiento.find({ nino: ninoId, activo: true })
      .sort({ fecha: -1 })
      .lean(),
    Alerta.find({ nino: ninoId, activo: true, atendida: false })
      .sort({ fecha: -1 })
      .select('tipo motivo mensaje fecha')
      .lean(),
  ]);

  const vacunasAgrupadas = new Map();

  for (const aplicacion of vacunaciones) {
    if (!aplicacion.vacuna?._id) continue;

    const clave = aplicacion.vacuna._id.toString();
    const grupo = vacunasAgrupadas.get(clave) || {
      vacuna: aplicacion.vacuna.nombre,
      nombre: aplicacion.vacuna.nombre,
      dosisAplicadas: 0,
      totalEsquema: aplicacion.vacuna.numeroDosis ?? aplicacion.vacuna.dosisTotales ?? 1,
      proximaDosis: null,
      fechas: [],
    };

    grupo.dosisAplicadas += 1;
    grupo.fechas.push(aplicacion.fechaAplicada);
    grupo.proximaDosis = aplicacion.proximaDosis || grupo.proximaDosis;
    vacunasAgrupadas.set(clave, grupo);
  }

  const vacunas = Array.from(vacunasAgrupadas.values()).map((vacuna) => ({
    ...vacuna,
    estado: vacuna.dosisAplicadas >= vacuna.totalEsquema ? 'Completa' : 'En progreso',
    proximaDosis:
      vacuna.dosisAplicadas >= vacuna.totalEsquema ? null : vacuna.proximaDosis,
  }));

  const padres = (nino.padres || []).map((padre) => padre.nombreCompleto).filter(Boolean);

  return {
    nino: {
      _id: nino._id,
      nombreCompleto: nino.nombreCompleto,
      fechaNacimiento: nino.fechaNacimiento,
      sexo: nino.sexo,
      comunidad: nino.comunidad?.nombre || 'Sin comunidad',
      padres,
    },
    padres,
    vacunas,
    crecimiento: crecimiento.map((registro) => ({
      _id: registro._id,
      fecha: registro.fecha,
      peso: registro.peso,
      talla: registro.talla,
      edadMeses: registro.edadMeses,
      edadMesesExacta: registro.edadMesesExacta,
      imc: registro.imc,
      zPesoEdad: registro.zPesoEdad,
      zTallaEdad: registro.zTallaEdad,
      zImcEdad: registro.zImcEdad,
      percentilPeso: registro.percentilPeso,
      percentilTalla: registro.percentilTalla,
      percentilImc: registro.percentilImc,
      estadoNutricional: registro.estadoNutricional,
      estadoTalla: registro.estadoTalla,
      referenciaOms: registro.referenciaOms,
    })),
    alertasActivas,
  };
}

export async function verCarnetPublico(req, res) {
  try {
    const { codigo } = req.params;
    const { pin } = req.body;

    const nino = await Nino.findOne({ codigoCarnet: codigo, activo: true }).select('_id pin');

    if (!nino) {
      return res.status(404).json({ mensaje: 'Carnet no encontrado' });
    }

    if (pin !== nino.pin) {
      return res.status(401).json({ mensaje: 'PIN incorrecto' });
    }

    const expediente = await armarExpediente(nino._id);
    return res.status(200).json(expediente);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}

export async function verExpedienteInterno(req, res) {
  try {
    const expediente = await armarExpediente(req.params.ninoId);

    if (!expediente) {
      return res.status(404).json({ mensaje: 'Niño no encontrado' });
    }

    return res.status(200).json(expediente);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}
