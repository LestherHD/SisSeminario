import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import Nino from '../models/Nino.js';
import RegistroCrecimiento from '../models/RegistroCrecimiento.js';
import { evaluarMedicionOms } from '../services/omsService.js';

dotenv.config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });

async function ejecutar() {
  if (!process.env.MONGO_URI) throw new Error('Falta MONGO_URI en backend/.env');
  await mongoose.connect(process.env.MONGO_URI);

  const registros = await RegistroCrecimiento.find({ activo: true });
  const ninos = new Map();
  let actualizados = 0;
  let omitidos = 0;

  for (const registro of registros) {
    const claveNino = String(registro.nino);
    if (!ninos.has(claveNino)) {
      ninos.set(claveNino, await Nino.findById(registro.nino).lean());
    }

    const nino = ninos.get(claveNino);
    if (!nino) {
      omitidos += 1;
      console.warn(`Registro ${registro._id}: niño no encontrado`);
      continue;
    }

    try {
      const evaluacion = evaluarMedicionOms({
        sexo: nino.sexo,
        fechaNacimiento: nino.fechaNacimiento,
        fechaMedicion: registro.fecha,
        peso: registro.peso,
        talla: registro.talla,
      });
      Object.assign(registro, evaluacion);
      await registro.save();
      actualizados += 1;
    } catch (error) {
      omitidos += 1;
      console.warn(`Registro ${registro._id}: ${error.message}`);
    }
  }

  console.log(`Recálculo OMS terminado: ${actualizados} actualizados, ${omitidos} omitidos.`);
}

ejecutar()
  .catch((error) => {
    console.error('No se pudo recalcular el crecimiento:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
