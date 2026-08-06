import Padre from '../models/Padre.js';

export async function crear(req, res) {
  try {
    const { nombre, dpi, telefono, email, canalPreferido, comunidad } = req.body;

    const padre = await Padre.create({
      nombre,
      dpi,
      telefono,
      email,
      canalPreferido,
      comunidad,
    });

    return res.status(201).json(padre);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}

export async function listar(req, res) {
  try {
    const padres = await Padre.find({ activo: true })
      .populate('comunidad', 'nombre')
      .sort({ nombre: 1 });

    return res.status(200).json(padres);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}

export async function obtenerPorId(req, res) {
  try {
    const { id } = req.params;
    const padre = await Padre.findById(id).populate('comunidad', 'nombre');

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
    const padre = await Padre.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!padre) {
      return res.status(404).json({ mensaje: 'Padre no encontrado' });
    }

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
