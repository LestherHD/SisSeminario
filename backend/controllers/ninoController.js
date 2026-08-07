import Nino from '../models/Nino.js';

export async function crear(req, res) {
  try {
    const { nombre, fechaNacimiento, sexo, comunidad, padres } = req.body;

    const nino = await Nino.create({
      nombre,
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
      .populate('comunidad', 'nombre')
      .populate('padres', 'nombre')
      .sort({ nombre: 1 });

    return res.status(200).json(ninos);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}

export async function obtenerPorId(req, res) {
  try {
    const { id } = req.params;
    const nino = await Nino.findById(id)
      .populate('comunidad', 'nombre')
      .populate('padres', 'nombre');

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
    const nino = await Nino.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!nino) {
      return res.status(404).json({ mensaje: 'Niño no encontrado' });
    }

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
