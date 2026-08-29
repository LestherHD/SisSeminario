import Comunidad from '../models/Comunidad.js';
import Nino from '../models/Nino.js';

export async function crear(req, res) {
  try {
    const { nombre, departamento, municipio } = req.body;

    if (!nombre?.trim() || !departamento?.trim() || !municipio?.trim()) {
      return res.status(400).json({ mensaje: 'Nombre, departamento y municipio son obligatorios' });
    }

    const existente = await Comunidad.findOne({
      nombre: nombre.trim(),
      departamento: departamento.trim(),
      municipio: municipio.trim(),
    }).collation({ locale: 'es', strength: 2 });

    if (existente) {
      return res.status(409).json({
        mensaje: 'Esta comunidad ya está registrada en el municipio seleccionado',
      });
    }

    const comunidad = await Comunidad.create({
      nombre: nombre.trim(),
      departamento: departamento.trim(),
      municipio: municipio.trim(),
    });

    return res.status(201).json(comunidad);
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        mensaje: 'Esta comunidad ya está registrada en el municipio seleccionado',
      });
    }
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}

export async function listar(req, res) {
  try {
    const incluirInactivos = req.query.incluirInactivos === 'true';
    const filtro = incluirInactivos ? {} : { activo: true };
    const comunidades = await Comunidad.find(filtro).sort({ nombre: 1 }).lean();
    const comunidadesConFamilias = await Promise.all(
      comunidades.map(async (comunidad) => {
        const ninos = await Nino.find({
          comunidad: comunidad._id,
          activo: true,
        })
          .select('padres')
          .lean();

        const familias = new Set();
        ninos.forEach((nino) => {
          const padres = (nino.padres || []).map(String).sort();
          if (padres.length > 0) {
            familias.add(padres.join('-'));
          }
        });

        return { ...comunidad, numeroFamilias: familias.size };
      })
    );

    return res.status(200).json(comunidadesConFamilias);
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
    const { nombre, departamento, municipio } = req.body;

    if (!nombre?.trim() || !departamento?.trim() || !municipio?.trim()) {
      return res.status(400).json({ mensaje: 'Nombre, departamento y municipio son obligatorios' });
    }

    const existente = await Comunidad.findOne({
      _id: { $ne: id },
      nombre: nombre.trim(),
      departamento: departamento.trim(),
      municipio: municipio.trim(),
    }).collation({ locale: 'es', strength: 2 });

    if (existente) {
      return res.status(409).json({
        mensaje: 'Esta comunidad ya está registrada en el municipio seleccionado',
      });
    }

    const comunidad = await Comunidad.findByIdAndUpdate(id, {
      nombre: nombre.trim(),
      departamento: departamento.trim(),
      municipio: municipio.trim(),
    }, {
      new: true,
      runValidators: true,
    });

    if (!comunidad) {
      return res.status(404).json({ mensaje: 'Comunidad no encontrada' });
    }

    return res.status(200).json(comunidad);
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        mensaje: 'Esta comunidad ya está registrada en el municipio seleccionado',
      });
    }
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

export async function reactivar(req, res) {
  try {
    const { id } = req.params;
    const comunidad = await Comunidad.findByIdAndUpdate(
      id,
      { activo: true },
      { new: true }
    );

    if (!comunidad) {
      return res.status(404).json({ mensaje: 'Comunidad no encontrada' });
    }

    return res.status(200).json(comunidad);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}
