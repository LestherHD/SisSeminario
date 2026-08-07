import RegistroCrecimiento from '../models/RegistroCrecimiento.js';
import Nino from '../models/Nino.js';
import { calcularEdadMeses, calcularPercentil } from '../utils/calculos.js';

export async function registrar(req, res) {
  try {
    const { nino, peso, talla, fecha } = req.body;
    const ninoEncontrado = await Nino.findById(nino);

    if (!ninoEncontrado) {
      return res.status(404).json({ mensaje: 'Niño no encontrado' });
    }

    const fechaMedicion = fecha || new Date();
    const edadMeses = calcularEdadMeses(ninoEncontrado.fechaNacimiento, fechaMedicion);
    const percentilPeso = calcularPercentil('peso', ninoEncontrado.sexo, edadMeses, peso);
    const percentilTalla = calcularPercentil('talla', ninoEncontrado.sexo, edadMeses, talla);

    const registro = await RegistroCrecimiento.create({
      nino,
      peso,
      talla,
      fecha: fechaMedicion,
      edadMeses,
      percentilPeso,
      percentilTalla,
    });

    return res.status(201).json(registro);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}

export async function listarPorNino(req, res) {
  try {
    const { ninoId } = req.params;
    const registros = await RegistroCrecimiento.find({ nino: ninoId, activo: true }).sort({ fecha: 1 });

    return res.status(200).json(registros);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}

export async function eliminar(req, res) {
  try {
    const { id } = req.params;
    const registro = await RegistroCrecimiento.findByIdAndUpdate(
      id,
      { activo: false },
      { new: true }
    );

    if (!registro) {
      return res.status(404).json({ mensaje: 'Registro no encontrado' });
    }

    return res.status(200).json({ mensaje: 'Registro eliminado correctamente' });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}