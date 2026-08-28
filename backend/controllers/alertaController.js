import Alerta from '../models/Alerta.js';
import { analizarTodos } from '../utils/motorAlertas.js';

export async function listar(req, res) {
  try {
    const soloActivas = req.query.soloActivas !== 'false';
    const filtro = { activo: true };

    if (soloActivas) {
      filtro.atendida = false;
    }

    const alertas = await Alerta.find(filtro).populate('nino', 'nombreCompleto').sort({ fecha: -1 });

    return res.status(200).json(alertas);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}

export async function marcarAtendida(req, res) {
  try {
    const alerta = await Alerta.findByIdAndUpdate(
      req.params.id,
      { atendida: true },
      { new: true }
    );

    if (!alerta) {
      return res.status(404).json({ mensaje: 'Alerta no encontrada' });
    }

    return res.status(200).json(alerta);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}

export async function eliminar(req, res) {
  try {
    const alerta = await Alerta.findByIdAndUpdate(
      req.params.id,
      { activo: false },
      { new: true }
    );

    if (!alerta) {
      return res.status(404).json({ mensaje: 'Alerta no encontrada' });
    }

    return res.status(200).json({ mensaje: 'Alerta eliminada' });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}

export async function analizar(req, res) {
  try {
    const total = await analizarTodos();

    return res.status(200).json({
      mensaje: `Análisis completo. ${total} alertas nuevas generadas.`,
      total,
    });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}
