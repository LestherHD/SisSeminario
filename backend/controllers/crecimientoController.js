import RegistroCrecimiento from '../models/RegistroCrecimiento.js';
import Nino from '../models/Nino.js';
import { evaluarMedicionOms, obtenerCurvaOms } from '../services/omsService.js';
import { analizarNino } from '../utils/motorAlertas.js';

export async function registrar(req, res) {
  try {
    const { nino, peso, talla, fecha } = req.body;
    const ninoEncontrado = await Nino.findById(nino);

    if (!ninoEncontrado) {
      return res.status(404).json({ mensaje: 'Niño no encontrado' });
    }

    const fechaMedicion = fecha || new Date();
    const evaluacionOms = evaluarMedicionOms({
      sexo: ninoEncontrado.sexo,
      fechaNacimiento: ninoEncontrado.fechaNacimiento,
      fechaMedicion,
      peso,
      talla,
    });

    const registro = await RegistroCrecimiento.create({
      nino,
      peso,
      talla,
      fecha: fechaMedicion,
      ...evaluacionOms,
    });

    try {
      await analizarNino(nino);
    } catch (errorAlertas) {
      console.error('Error al analizar alertas del niño:', errorAlertas.message);
    }

    return res.status(201).json(registro);
  } catch (error) {
    if (/peso|talla|fecha|medición|nacimiento|sexo/i.test(error.message)) {
      return res.status(400).json({ mensaje: error.message });
    }
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
    const evaluacionOms = evaluarMedicionOms({
      sexo: nino.sexo,
      fechaNacimiento: nino.fechaNacimiento,
      fechaMedicion: fechaActualizada,
      peso: pesoActualizado,
      talla: tallaActualizada,
    });

    registro.peso = pesoActualizado;
    registro.talla = tallaActualizada;
    registro.fecha = fechaActualizada;
    Object.assign(registro, evaluacionOms);
    await registro.save();

    try {
      await analizarNino(nino._id);
    } catch (errorAlertas) {
      console.error('Error al analizar alertas del niño:', errorAlertas.message);
    }

    return res.status(200).json(registro);
  } catch (error) {
    if (/peso|talla|fecha|medición|nacimiento|sexo/i.test(error.message)) {
      return res.status(400).json({ mensaje: error.message });
    }
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}

export async function obtenerCurvas(req, res) {
  try {
    const nino = await Nino.findOne({ _id: req.params.ninoId, activo: true }).lean();
    if (!nino) return res.status(404).json({ mensaje: 'Niño no encontrado' });

    const registros = await RegistroCrecimiento.find({
      nino: nino._id,
      activo: true,
    })
      .sort({ fecha: 1 })
      .lean();

    const edadActual = calcularEdadActualMeses(nino.fechaNacimiento);
    const edadesRegistradas = registros.map((registro) =>
      Number(registro.edadMesesExacta ?? registro.edadMeses ?? 0)
    );
    const edadMaxima = Math.max(12, edadActual, ...edadesRegistradas) + 3;
    const edadMinima = Math.max(0, Math.min(...edadesRegistradas, edadActual) - 6);

    return res.status(200).json({
      referencia: edadMaxima < 60 ? 'OMS 2006' : 'OMS 2006 / OMS 2007',
      peso: {
        referencia: obtenerCurvaOms('peso', nino.sexo, edadMinima, edadMaxima),
        mediciones: registros.map((registro) => ({
          edadMeses: Number(registro.edadMesesExacta ?? registro.edadMeses),
          valor: registro.peso,
          fecha: registro.fecha,
        })),
      },
      talla: {
        referencia: obtenerCurvaOms('talla', nino.sexo, edadMinima, edadMaxima),
        mediciones: registros.map((registro) => ({
          edadMeses: Number(registro.edadMesesExacta ?? registro.edadMeses),
          valor: registro.talla,
          fecha: registro.fecha,
        })),
      },
      imc: {
        referencia: obtenerCurvaOms('imc', nino.sexo, edadMinima, edadMaxima),
        mediciones: registros.map((registro) => ({
          edadMeses: Number(registro.edadMesesExacta ?? registro.edadMeses),
          valor:
            registro.imc ?? Number((registro.peso / (registro.talla / 100) ** 2).toFixed(2)),
          fecha: registro.fecha,
        })),
      },
    });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al cargar curvas OMS', error: error.message });
  }
}

function calcularEdadActualMeses(fechaNacimiento) {
  const dias = Math.max(0, (Date.now() - new Date(fechaNacimiento).getTime()) / 86400000);
  return dias / 30.4375;
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
