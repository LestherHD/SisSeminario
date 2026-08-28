import Padre from '../models/Padre.js';

function validarMetodoContacto(metodoContacto, email) {
  if (!Array.isArray(metodoContacto) || metodoContacto.length === 0) {
    return 'Debe seleccionar al menos un método de contacto (Telegram o Email)';
  }

  if (metodoContacto.includes('email') && !email?.trim()) {
    return 'El email es obligatorio si selecciona Email como método de contacto';
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
      telegramChatId,
      comunidad,
    } = req.body;

    const errorValidacion = validarMetodoContacto(metodoContacto, email);
    if (errorValidacion) {
      return res.status(400).json({ mensaje: errorValidacion });
    }

    const padre = await Padre.create({
      primerNombre,
      segundoNombre,
      tercerNombre,
      primerApellido,
      segundoApellido,
      dpi,
      telefono,
      email,
      metodoContacto,
      telegramChatId,
      comunidad,
    });

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
    const errorValidacion = validarMetodoContacto(metodoContacto, email);
    if (errorValidacion) {
      return res.status(400).json({ mensaje: errorValidacion });
    }

    const camposPermitidos = [
      'primerNombre', 'segundoNombre', 'tercerNombre', 'primerApellido',
      'segundoApellido', 'dpi', 'telefono', 'email', 'metodoContacto',
      'telegramChatId', 'comunidad',
    ];
    camposPermitidos.forEach((campo) => {
      if (Object.prototype.hasOwnProperty.call(req.body, campo)) {
        padre[campo] = req.body[campo];
      }
    });
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
