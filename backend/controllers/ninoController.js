import Nino from '../models/Nino.js';

export async function crear(req, res) {
  try {
    const {
      primerNombre,
      segundoNombre,
      tercerNombre,
      primerApellido,
      segundoApellido,
      fechaNacimiento,
      sexo,
      comunidad,
      padres,
    } = req.body;

    const nino = await Nino.create({
      primerNombre,
      segundoNombre,
      tercerNombre,
      primerApellido,
      segundoApellido,
      fechaNacimiento,
      sexo,
      comunidad,
      padres,
    });

    return res.status(201).json(nino);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}

export async function listar(req, res) {
  try {
    const incluirInactivos = req.query.incluirInactivos === 'true';
    const filtro = incluirInactivos ? {} : { activo: true };
    const ninos = await Nino.find(filtro)
      .populate('comunidad', 'nombre departamento municipio activo')
      .populate('padres', 'nombreCompleto')
      .sort({ nombreCompleto: 1 });

    return res.status(200).json(ninos);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}

export async function obtenerPorId(req, res) {
  try {
    const { id } = req.params;
    const nino = await Nino.findById(id)
      .populate('comunidad', 'nombre departamento municipio activo')
      .populate('padres', 'nombreCompleto');

    if (!nino || nino.activo === false) {
      return res.status(404).json({ mensaje: 'Niño no encontrado' });
    }

    return res.status(200).json(nino);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}

export async function actualizar(req, res) {
  try {
    const { id } = req.params;
    const nino = await Nino.findById(id);

    if (!nino) {
      return res.status(404).json({ mensaje: 'Niño no encontrado' });
    }

    const camposPermitidos = [
      'primerNombre', 'segundoNombre', 'tercerNombre', 'primerApellido',
      'segundoApellido', 'fechaNacimiento', 'sexo', 'comunidad', 'padres',
    ];
    camposPermitidos.forEach((campo) => {
      if (Object.prototype.hasOwnProperty.call(req.body, campo)) {
        nino[campo] = req.body[campo];
      }
    });
    await nino.save();

    return res.status(200).json(nino);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}

export async function eliminar(req, res) {
  try {
    const { id } = req.params;
    const nino = await Nino.findByIdAndUpdate(
      id,
      { activo: false },
      { new: true }
    );

    if (!nino) {
      return res.status(404).json({ mensaje: 'Niño no encontrado' });
    }

    return res.status(200).json({ mensaje: 'Niño eliminado correctamente' });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}

export async function reactivar(req, res) {
  try {
    const { id } = req.params;
    const nino = await Nino.findByIdAndUpdate(
      id,
      { activo: true },
      { new: true }
    );

    if (!nino) {
      return res.status(404).json({ mensaje: 'Niño no encontrado' });
    }

    return res.status(200).json(nino);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}
