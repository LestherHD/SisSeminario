import Padre from '../models/Padre.js';
import { enviarBienvenida } from '../services/emailService.js';

function normalizarDpi(valor) {
  return String(valor || '').replace(/\s+/g, '').trim();
}

function validarMetodoContacto(metodoContacto, email, dpi) {
  if (!Array.isArray(metodoContacto) || metodoContacto.length === 0) {
    return 'Debe seleccionar al menos un método de contacto (Telegram o Email)';
  }

  if (metodoContacto.includes('email') && !email?.trim()) {
    return 'El email es obligatorio si selecciona Email como método de contacto';
  }

  if (metodoContacto.includes('telegram') && !normalizarDpi(dpi)) {
    return 'El DPI es obligatorio para vincular Telegram de forma segura';
  }

  return null;
}

export async function crear(req, res) {
  try {
    const {
      primerNombre,
      segundoNombre,
      tercerNombre,
      primerApellido,
      segundoApellido,
      dpi,
      telefono,
      email,
      metodoContacto,
      comunidad,
    } = req.body;

    const dpiNormalizado = normalizarDpi(dpi);
    const errorValidacion = validarMetodoContacto(metodoContacto, email, dpiNormalizado);
    if (errorValidacion) {
      return res.status(400).json({ mensaje: errorValidacion });
    }

    if (dpiNormalizado && await Padre.exists({ dpi: dpiNormalizado })) {
      return res.status(409).json({ mensaje: 'Ya existe un padre o tutor registrado con este DPI' });
    }

    const padre = await Padre.create({
      primerNombre,
      segundoNombre,
      tercerNombre,
      primerApellido,
      segundoApellido,
      dpi: dpiNormalizado,
      telefono,
      email,
      metodoContacto,
      comunidad,
    });

    if (padre.metodoContacto?.includes('email') && padre.email?.trim()) {
      void enviarBienvenida(padre)
        .then((resultado) => {
          if (resultado.exito) {
            console.log(`Correo de bienvenida enviado a ${padre.email}`);
          } else {
            console.error(`No se pudo enviar la bienvenida a ${padre.email}: ${resultado.error}`);
          }
        })
        .catch((errorEmail) => {
          console.error(`Error inesperado al enviar la bienvenida a ${padre.email}:`, errorEmail.message);
        });
    }

    return res.status(201).json(padre);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}

export async function listar(req, res) {
  try {
    const incluirInactivos = req.query.incluirInactivos === 'true';
    const filtro = incluirInactivos ? {} : { activo: true };
    const padres = await Padre.find(filtro)
      .populate('comunidad', 'nombre departamento municipio activo')
      .sort({ nombreCompleto: 1 });

    return res.status(200).json(padres);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}

export async function obtenerPorId(req, res) {
  try {
    const { id } = req.params;
    const padre = await Padre.findById(id)
      .populate('comunidad', 'nombre departamento municipio activo');

    if (!padre || padre.activo === false) {
      return res.status(404).json({ mensaje: 'Padre no encontrado' });
    }

    return res.status(200).json(padre);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}

export async function actualizar(req, res) {
  try {
    const { id } = req.params;
    const padre = await Padre.findById(id);

    if (!padre) {
      return res.status(404).json({ mensaje: 'Padre no encontrado' });
    }

    const metodoContacto = req.body.metodoContacto ?? padre.metodoContacto;
    const email = req.body.email ?? padre.email;
    const dpi = normalizarDpi(req.body.dpi ?? padre.dpi);
    const errorValidacion = validarMetodoContacto(metodoContacto, email, dpi);
    if (errorValidacion) {
      return res.status(400).json({ mensaje: errorValidacion });
    }

    if (dpi && await Padre.exists({ _id: { $ne: padre._id }, dpi })) {
      return res.status(409).json({ mensaje: 'Ya existe otro padre o tutor con este DPI' });
    }

    const camposPermitidos = [
      'primerNombre', 'segundoNombre', 'tercerNombre', 'primerApellido',
      'segundoApellido', 'dpi', 'telefono', 'email', 'metodoContacto',
      'comunidad',
    ];
    camposPermitidos.forEach((campo) => {
      if (Object.prototype.hasOwnProperty.call(req.body, campo)) {
        padre[campo] = req.body[campo];
      }
    });
    padre.dpi = dpi;
    await padre.save();

    return res.status(200).json(padre);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}

export async function eliminar(req, res) {
  try {
    const { id } = req.params;
    const padre = await Padre.findByIdAndUpdate(
      id,
      { activo: false },
      { new: true }
    );

    if (!padre) {
      return res.status(404).json({ mensaje: 'Padre no encontrado' });
    }

    return res.status(200).json({ mensaje: 'Padre eliminado correctamente' });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}

export async function revocarTelegram(req, res) {
  try {
    const padre = await Padre.findOne({ _id: req.params.id, activo: true });
    if (!padre) return res.status(404).json({ mensaje: 'Padre no encontrado' });
    if (!padre.telegramChatId) {
      return res.status(400).json({ mensaje: 'Este padre no tiene Telegram vinculado' });
    }

    padre.telegramChatId = undefined;
    await padre.save();

    return res.status(200).json({
      mensaje: 'Vinculación de Telegram revocada. El padre puede vincular un nuevo chat con /start.',
    });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al revocar Telegram', error: error.message });
  }
}

export async function reactivar(req, res) {
  try {
    const { id } = req.params;
    const padre = await Padre.findByIdAndUpdate(
      id,
      { activo: true },
      { new: true }
    );

    if (!padre) {
      return res.status(404).json({ mensaje: 'Padre no encontrado' });
    }

    return res.status(200).json(padre);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}
