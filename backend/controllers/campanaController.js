import mongoose from 'mongoose';
import Campana from '../models/Campana.js';
import Comunidad from '../models/Comunidad.js';
import Padre from '../models/Padre.js';
import Notificacion from '../models/Notificacion.js';
import { enviarCampanaEmail } from '../services/emailService.js';
import { enviarCampanaTelegram } from '../services/telegramService.js';

const ZONA_HORARIA = 'America/Guatemala';

function fechaGuatemala(fecha = new Date()) {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_HORARIA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(fecha);
  const valores = Object.fromEntries(partes.map(({ type, value }) => [type, value]));
  return `${valores.year}-${valores.month}-${valores.day}`;
}

function normalizarFecha(valor) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(valor || ''))) return null;
  const fecha = new Date(`${valor}T12:00:00.000Z`);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function calcularEstado(fechaRealizacion) {
  const hoy = fechaGuatemala();
  const fechaCampana = new Date(fechaRealizacion).toISOString().slice(0, 10);

  if (fechaCampana > hoy) return 'proxima';
  if (fechaCampana < hoy) return 'finalizada';
  return 'en_curso';
}

function conEstado(campana) {
  return { ...campana, estado: calcularEstado(campana.fechaRealizacion) };
}

async function validarDestino({ alcance, departamento, municipio, comunidad }) {
  if (!['departamento', 'municipio', 'comunidad'].includes(alcance)) {
    return { error: 'Seleccione un alcance válido' };
  }

  if (!departamento?.trim()) {
    return { error: 'El departamento es obligatorio' };
  }

  if (alcance !== 'departamento' && !municipio?.trim()) {
    return { error: 'El municipio es obligatorio para este alcance' };
  }

  if (alcance === 'comunidad') {
    if (!mongoose.isValidObjectId(comunidad)) {
      return { error: 'Seleccione una comunidad o aldea válida' };
    }

    const comunidadEncontrada = await Comunidad.findOne({ _id: comunidad, activo: true }).lean();
    if (!comunidadEncontrada) return { error: 'La comunidad seleccionada no existe o está inactiva' };

    return {
      destino: {
        alcance,
        departamento: comunidadEncontrada.departamento,
        municipio: comunidadEncontrada.municipio,
        comunidad: comunidadEncontrada._id,
      },
    };
  }

  return {
    destino: {
      alcance,
      departamento: departamento.trim(),
      municipio: alcance === 'municipio' ? municipio.trim() : '',
      comunidad: null,
    },
  };
}

export async function listar(req, res) {
  try {
    const campanas = await Campana.find({ activo: true })
      .populate('comunidad', 'nombre departamento municipio')
      .sort({ fechaRealizacion: -1, createdAt: -1 })
      .lean();

    return res.status(200).json(campanas.map(conEstado));
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al cargar campañas', error: error.message });
  }
}

export async function crear(req, res) {
  try {
    const { nombre, descripcion, fechaRealizacion } = req.body;
    if (!nombre?.trim()) return res.status(400).json({ mensaje: 'El nombre es obligatorio' });
    if (!descripcion?.trim()) {
      return res.status(400).json({ mensaje: 'La descripción o mensaje es obligatorio' });
    }

    const fecha = normalizarFecha(fechaRealizacion);
    if (!fecha) return res.status(400).json({ mensaje: 'Seleccione una fecha válida' });

    const validacion = await validarDestino(req.body);
    if (validacion.error) return res.status(400).json({ mensaje: validacion.error });

    const campana = await Campana.create({
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      fechaRealizacion: fecha,
      ...validacion.destino,
      creadoPor: req.usuario?._id,
    });

    return res.status(201).json(conEstado(campana.toObject()));
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al crear la campaña', error: error.message });
  }
}

export async function actualizar(req, res) {
  try {
    const campanaActual = await Campana.findOne({ _id: req.params.id, activo: true });
    if (!campanaActual) return res.status(404).json({ mensaje: 'Campaña no encontrada' });
    if (campanaActual.notificacionEnviada) {
      return res.status(409).json({
        mensaje: 'No se puede editar una campaña que ya fue notificada',
      });
    }

    const { nombre, descripcion, fechaRealizacion } = req.body;
    if (!nombre?.trim()) return res.status(400).json({ mensaje: 'El nombre es obligatorio' });
    if (!descripcion?.trim()) {
      return res.status(400).json({ mensaje: 'La descripción o mensaje es obligatorio' });
    }

    const fecha = normalizarFecha(fechaRealizacion);
    if (!fecha) return res.status(400).json({ mensaje: 'Seleccione una fecha válida' });

    const validacion = await validarDestino(req.body);
    if (validacion.error) return res.status(400).json({ mensaje: validacion.error });

    Object.assign(campanaActual, {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      fechaRealizacion: fecha,
      ...validacion.destino,
    });
    await campanaActual.save();

    return res.status(200).json(conEstado(campanaActual.toObject()));
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al actualizar la campaña', error: error.message });
  }
}

export async function eliminar(req, res) {
  try {
    const campana = await Campana.findByIdAndUpdate(
      req.params.id,
      { activo: false },
      { new: true }
    );
    if (!campana) return res.status(404).json({ mensaje: 'Campaña no encontrada' });
    return res.status(200).json({ mensaje: 'Campaña eliminada correctamente' });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al eliminar la campaña', error: error.message });
  }
}

export async function enviar(req, res) {
  try {
    const campana = await Campana.findOne({ _id: req.params.id, activo: true }).populate(
      'comunidad',
      'nombre departamento municipio'
    );
    if (!campana) return res.status(404).json({ mensaje: 'Campaña no encontrada' });
    if (campana.notificacionEnviada) {
      return res.status(409).json({ mensaje: 'Esta campaña ya fue notificada' });
    }

    const filtroComunidades = { activo: true, departamento: campana.departamento };
    if (campana.alcance !== 'departamento') filtroComunidades.municipio = campana.municipio;
    if (campana.alcance === 'comunidad') filtroComunidades._id = campana.comunidad?._id;

    const comunidades = await Comunidad.find(filtroComunidades).select('_id').lean();
    const padres = await Padre.find({
      activo: true,
      comunidad: { $in: comunidades.map(({ _id }) => _id) },
      $or: [
        { metodoContacto: 'email', email: { $type: 'string', $ne: '' } },
        { metodoContacto: 'telegram', telegramChatId: { $type: 'string', $ne: '' } },
      ],
    }).select('nombreCompleto primerNombre email telegramChatId metodoContacto').lean();

    const destinatariosEmail = Array.from(
      padres.reduce((unicos, padre) => {
        if (!padre.metodoContacto?.includes('email')) return unicos;
        const email = padre.email?.trim().toLowerCase();
        if (email && !unicos.has(email)) unicos.set(email, { ...padre, email });
        return unicos;
      }, new Map()).values()
    );

    const destinatariosTelegram = Array.from(
      padres.reduce((unicos, padre) => {
        if (!padre.metodoContacto?.includes('telegram')) return unicos;
        const chatId = padre.telegramChatId?.trim();
        if (chatId && !unicos.has(chatId)) {
          unicos.set(chatId, { ...padre, telegramChatId: chatId });
        }
        return unicos;
      }, new Map()).values()
    );

    if (destinatariosEmail.length === 0 && destinatariosTelegram.length === 0) {
      return res.status(400).json({
        mensaje:
          'No hay padres activos con Email o Telegram habilitado en el lugar seleccionado',
      });
    }

    let correosEnviados = 0;
    let correosFallidos = 0;
    let telegramEnviados = 0;
    let telegramFallidos = 0;

    const envios = [
      ...destinatariosEmail.map((padre) => ({ padre, canal: 'email' })),
      ...destinatariosTelegram.map((padre) => ({ padre, canal: 'telegram' })),
    ];

    for (let indice = 0; indice < envios.length; indice += 5) {
      const lote = envios.slice(indice, indice + 5);
      const resultados = await Promise.all(
        lote.map(async ({ padre, canal }) => {
          const resultado =
            canal === 'email'
              ? await enviarCampanaEmail(padre, campana)
              : await enviarCampanaTelegram(padre, campana);

          await Notificacion.create({
            padre: padre._id,
            campana: campana._id,
            canal,
            mensaje: campana.descripcion,
            estado: resultado.exito ? 'enviada' : 'fallida',
            fechaEnvio: new Date(),
          });

          return { canal, ...resultado };
        })
      );
      resultados.forEach((resultado) => {
        if (resultado.canal === 'email') {
          if (resultado.exito) correosEnviados += 1;
          else correosFallidos += 1;
        } else if (resultado.exito) telegramEnviados += 1;
        else telegramFallidos += 1;
      });
    }

    const enviados = correosEnviados + telegramEnviados;
    const fallidos = correosFallidos + telegramFallidos;
    campana.destinatariosEnviados = enviados;
    campana.destinatariosFallidos = fallidos;
    campana.correosEnviados = correosEnviados;
    campana.correosFallidos = correosFallidos;
    campana.telegramEnviados = telegramEnviados;
    campana.telegramFallidos = telegramFallidos;
    if (enviados > 0) {
      campana.notificacionEnviada = true;
      campana.fechaEnvio = new Date();
    }
    await campana.save();

    const codigo = enviados > 0 ? 200 : 502;
    return res.status(codigo).json({
      mensaje:
        enviados > 0
          ? `Campaña notificada: ${correosEnviados} por Email y ${telegramEnviados} por Telegram`
          : 'No se pudo enviar ninguna notificación de la campaña',
      enviados,
      fallidos,
      correosEnviados,
      correosFallidos,
      telegramEnviados,
      telegramFallidos,
      totalPadres: padres.length,
      totalIntentos: envios.length,
    });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al enviar la campaña', error: error.message });
  }
}
