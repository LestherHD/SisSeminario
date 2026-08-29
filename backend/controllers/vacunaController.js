import Vacuna from '../models/Vacuna.js';

function vacunaParaRespuesta(vacuna) {
  return {
    ...vacuna,
    rangoEdad:
      vacuna.rangoEdad ||
      (vacuna.edadRecomendada != null
        ? `${vacuna.edadRecomendada}-${vacuna.edadRecomendada}`
        : ''),
    dosisMl: vacuna.dosisMl ?? null,
    numeroDosis: vacuna.numeroDosis ?? vacuna.dosisTotales ?? 1,
    intervaloValor: vacuna.intervaloValor ?? vacuna.intervaloMeses ?? 0,
    intervaloUnidad: vacuna.intervaloUnidad || 'meses',
  };
}

function datosVacuna(body) {
  const numeroDosis = Number(body.numeroDosis ?? body.dosisTotales ?? 1);
  const dosisMl = body.dosisMl === '' || body.dosisMl == null ? null : Number(body.dosisMl);
  const intervaloUnidad = ['dias', 'semanas', 'meses'].includes(body.intervaloUnidad)
    ? body.intervaloUnidad
    : 'meses';

  return {
    nombre: body.nombre?.trim(),
    rangoEdad: body.rangoEdad?.trim() || '',
    dosisMl,
    numeroDosis,
    intervaloValor:
      numeroDosis <= 1 ? 0 : Number(body.intervaloValor ?? body.intervaloMeses ?? 0),
    intervaloUnidad,
    descripcion: body.descripcion?.trim() || '',
  };
}

function validarVacuna(datos) {
  const coincidencia = /^(\d+)-(\d+)$/.exec(datos.rangoEdad);

  if (!coincidencia || Number(coincidencia[1]) > Number(coincidencia[2])) {
    return 'El rango de edad debe tener el formato 0-1, sin letras ni espacios';
  }

  if (!Number.isFinite(datos.dosisMl) || datos.dosisMl <= 0) {
    return 'La dosis en ml es obligatoria y debe ser mayor que 0';
  }

  if (!Number.isInteger(datos.numeroDosis) || datos.numeroDosis < 1) {
    return 'El número de dosis debe ser un entero mayor o igual a 1';
  }

  if (
    datos.numeroDosis > 1 &&
    (!Number.isFinite(datos.intervaloValor) || datos.intervaloValor <= 0)
  ) {
    return 'La cantidad del intervalo debe ser mayor que 0';
  }

  return null;
}

export async function crear(req, res) {
  try {
    const datos = datosVacuna(req.body);
    const errorValidacion = validarVacuna(datos);

    if (errorValidacion) {
      return res.status(400).json({ mensaje: errorValidacion });
    }

    const vacuna = await Vacuna.create(datos);

    return res.status(201).json(vacuna);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}

export async function listar(req, res) {
  try {
    const incluirInactivos = req.query.incluirInactivos === 'true';
    const filtro = incluirInactivos ? {} : { activo: true };
    const vacunas = await Vacuna.find(filtro).sort({ nombre: 1 }).lean();

    return res.status(200).json(vacunas.map(vacunaParaRespuesta));
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}

export async function obtenerPorId(req, res) {
  try {
    const { id } = req.params;
    const vacuna = await Vacuna.findById(id).lean();

    if (!vacuna || vacuna.activo === false) {
      return res.status(404).json({ mensaje: 'Vacuna no encontrada' });
    }

    return res.status(200).json(vacunaParaRespuesta(vacuna));
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}

export async function actualizar(req, res) {
  try {
    const { id } = req.params;
    const datos = datosVacuna(req.body);
    const errorValidacion = validarVacuna(datos);

    if (errorValidacion) {
      return res.status(400).json({ mensaje: errorValidacion });
    }

    const vacuna = await Vacuna.findByIdAndUpdate(id, datos, {
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
