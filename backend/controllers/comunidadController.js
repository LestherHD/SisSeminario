import Comunidad from '../models/Comunidad.js';
import Nino from '../models/Nino.js';

export async function crear(req, res) {
  try {
    const { nombre, departamento, municipio } = req.body;

    const comunidad = await Comunidad.create({
      nombre,
      departamento,
      municipio,
    });

    return res.status(201).json(comunidad);
  } catch (error) {
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
    const comunidad = await Comunidad.findByIdAndUpdate(id, {
      nombre,
      departamento,
      municipio,
    }, {
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
