import Vacunacion from '../models/Vacunacion.js';
import Vacuna from '../models/Vacuna.js';
import { calcularProximaDosis } from '../utils/calculos.js';
import { analizarNino } from '../utils/motorAlertas.js';

export async function registrar(req, res) {
  try {
    const { nino, vacuna, fechaAplicada } = req.body;

    const vacunaCatalogo = await Vacuna.findById(vacuna).lean();

    if (!vacunaCatalogo) {
      return res.status(404).json({ mensaje: 'Vacuna no encontrada' });
    }

    const aplicadas = await Vacunacion.countDocuments({ nino, vacuna, activo: true });
    const numeroDosis = aplicadas + 1;
    const dosisDelEsquema = vacunaCatalogo.numeroDosis ?? vacunaCatalogo.dosisTotales ?? 1;

    if (numeroDosis > dosisDelEsquema) {
      return res
        .status(400)
        .json({ mensaje: `El esquema ya está completo (${aplicadas} de ${dosisDelEsquema} dosis)` });
    }

    let proximaDosis = null;

    if (numeroDosis < dosisDelEsquema) {
      if (vacunaCatalogo.intervaloValor > 0) {
        proximaDosis = calcularProximaDosis(
          fechaAplicada,
          vacunaCatalogo.intervaloValor,
          vacunaCatalogo.intervaloUnidad
        );
      } else if (vacunaCatalogo.intervaloMeses > 0) {
        proximaDosis = calcularProximaDosis(fechaAplicada, vacunaCatalogo.intervaloMeses);
      }
    }

    const registro = await Vacunacion.create({
      nino,
      vacuna,
      numeroDosis,
      fechaAplicada,
      proximaDosis,
    });

    try {
      await analizarNino(nino);
    } catch (errorAlertas) {
      console.error('Error al analizar alertas del niño:', errorAlertas.message);
    }

    return res.status(201).json({
      registro,
      mensaje: `Dosis ${numeroDosis} de ${dosisDelEsquema} registrada`,
    });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}

export async function resumenPorNino(req, res) {
  try {
    const registros = await Vacunacion.find({
      nino: req.params.ninoId,
      activo: true,
    })
      .populate('vacuna', 'nombre numeroDosis dosisTotales')
      .sort({ fechaAplicada: 1 });

    const hoy = new Date();
    const grupos = new Map();

    for (const registro of registros) {
      const vacunaId = registro.vacuna?._id?.toString();

      if (!vacunaId) {
        continue;
      }

      if (!grupos.has(vacunaId)) {
        grupos.set(vacunaId, []);
      }

      grupos.get(vacunaId).push(registro);
    }

    const resumenes = Array.from(grupos.values()).map((grupo) => {
      const ordenado = [...grupo].sort((a, b) => a.numeroDosis - b.numeroDosis);
      const ultima = ordenado[ordenado.length - 1];
      const vacuna = ultima.vacuna;
      const dosisAplicadas = grupo.length;
      const dosisTotales = vacuna?.numeroDosis ?? vacuna?.dosisTotales ?? 1;
      const proximaDosis = ultima.proximaDosis || null;
      let estado = 'al_dia';

      if (dosisAplicadas >= dosisTotales) {
        estado = 'completa';
      } else if (proximaDosis && new Date(proximaDosis) < hoy) {
        estado = 'atrasada';
      }

      return {
        vacuna: {
          _id: vacuna?._id,
          nombre: vacuna?.nombre,
        },
        dosisAplicadas,
        dosisTotales,
        ultimaFecha: ultima.fechaAplicada,
        proximaDosis,
        estado,
      };
    });

    return res.status(200).json(resumenes);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}

export async function listarDosisPorNino(req, res) {
  try {
    const registros = await Vacunacion.find({
      nino: req.params.ninoId,
      activo: true,
    })
      .populate('vacuna', 'nombre')
      .sort({ vacuna: 1, numeroDosis: 1 });

    return res.status(200).json(registros);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}

export async function eliminar(req, res) {
  try {
    const registro = await Vacunacion.findByIdAndUpdate(
      req.params.id,
      { activo: false },
      { new: true }
    );

    if (!registro) {
      return res.status(404).json({ mensaje: 'Registro de vacunación no encontrado' });
    }

    return res.status(200).json({ mensaje: 'Registro de vacunación eliminado' });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}
