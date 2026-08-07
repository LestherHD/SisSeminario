import Vacuna from '../models/Vacuna.js';

export async function crear(req, res) {
  try {
    const { nombre, edadRecomendada, dosis, descripcion } = req.body;

    const vacuna = await Vacuna.create({
      nombre,
      edadRecomendada,
      dosis,
      descripcion,
    });

    return res.status(201).json(vacuna);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}

export async function listar(req, res) {
  try {
    const incluirInactivos = req.query.incluirInactivos === 'true';
    const filtro = incluirInactivos ? {} : { activo: true };
    const vacunas = await Vacuna.find(filtro).sort({ edadRecomendada: 1 });

    return res.status(200).json(vacunas);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}

export async function obtenerPorId(req, res) {
  try {
    const { id } = req.params;
    const vacuna = await Vacuna.findById(id);

    if (!vacuna || vacuna.activo === false) {
      return res.status(404).json({ mensaje: 'Vacuna no encontrada' });
    }

    return res.status(200).json(vacuna);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}

export async function actualizar(req, res) {
  try {
    const { id } = req.params;
    const vacuna = await Vacuna.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!vacuna) {
      return res.status(404).json({ mensaje: 'Vacuna no encontrada' });
    }

    return res.status(200).json(vacuna);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}

export async function eliminar(req, res) {
  try {
    const { id } = req.params;
    const vacuna = await Vacuna.findByIdAndUpdate(id, { activo: false }, { new: true });

    if (!vacuna) {
      return res.status(404).json({ mensaje: 'Vacuna no encontrada' });
    }

    return res.status(200).json({ mensaje: 'Vacuna eliminada correctamente' });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}

export async function reactivar(req, res) {
  try {
    const { id } = req.params;
    const vacuna = await Vacuna.findByIdAndUpdate(id, { activo: true }, { new: true });

    if (!vacuna) {
      return res.status(404).json({ mensaje: 'Vacuna no encontrada' });
    }

    return res.status(200).json(vacuna);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}