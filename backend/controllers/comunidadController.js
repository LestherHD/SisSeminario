import Comunidad from '../models/Comunidad.js';

export async function crear(req, res) {
  try {
    const { nombre, ubicacion, numFamilias } = req.body;

    const comunidad = await Comunidad.create({
      nombre,
      ubicacion,
      numFamilias,
    });

    return res.status(201).json(comunidad);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}

export async function listar(req, res) {
  try {
    const comunidades = await Comunidad.find({ activo: true }).sort({ nombre: 1 });

    return res.status(200).json(comunidades);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}

export async function obtenerPorId(req, res) {
  try {
    const { id } = req.params;
    const comunidad = await Comunidad.findById(id);

    if (!comunidad || comunidad.activo === false) {
      return res.status(404).json({ mensaje: 'Comunidad no encontrada' });
    }

    return res.status(200).json(comunidad);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}

export async function actualizar(req, res) {
  try {
    const { id } = req.params;
    const comunidad = await Comunidad.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!comunidad) {
      return res.status(404).json({ mensaje: 'Comunidad no encontrada' });
    }

    return res.status(200).json(comunidad);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}

export async function eliminar(req, res) {
  try {
    const { id } = req.params;
    const comunidad = await Comunidad.findByIdAndUpdate(
      id,
      { activo: false },
      { new: true }
    );

    if (!comunidad) {
      return res.status(404).json({ mensaje: 'Comunidad no encontrada' });
    }

    return res.status(200).json({ mensaje: 'Comunidad eliminada correctamente' });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}