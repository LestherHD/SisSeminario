import RegistroCrecimiento from '../models/RegistroCrecimiento.js';
import Nino from '../models/Nino.js';
import { calcularEdadMeses, calcularPercentil } from '../utils/calculos.js';
import { analizarNino } from '../utils/motorAlertas.js';

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

    try {
      await analizarNino(nino);
    } catch (errorAlertas) {
      console.error('Error al analizar alertas del niño:', errorAlertas.message);
    }

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

export async function actualizar(req, res) {
  try {
    const { id } = req.params;
    const { peso, talla, fecha } = req.body;
    const registro = await RegistroCrecimiento.findById(id);

    if (!registro || registro.activo === false) {
      return res.status(404).json({ mensaje: 'Registro no encontrado' });
    }

    const nino = await Nino.findById(registro.nino);
    if (!nino || nino.activo === false) {
      return res.status(404).json({ mensaje: 'Niño no encontrado' });
    }

    const pesoActualizado = peso ?? registro.peso;
    const tallaActualizada = talla ?? registro.talla;
    const fechaActualizada = fecha || registro.fecha;
    const edadMeses = calcularEdadMeses(nino.fechaNacimiento, fechaActualizada);

    registro.peso = pesoActualizado;
    registro.talla = tallaActualizada;
    registro.fecha = fechaActualizada;
    registro.edadMeses = edadMeses;
    registro.percentilPeso = calcularPercentil(
      'peso', nino.sexo, edadMeses, pesoActualizado
    );
    registro.percentilTalla = calcularPercentil(
      'talla', nino.sexo, edadMeses, tallaActualizada
    );
    await registro.save();

    try {
      await analizarNino(nino._id);
    } catch (errorAlertas) {
      console.error('Error al analizar alertas del niño:', errorAlertas.message);
    }

    return res.status(200).json(registro);
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
