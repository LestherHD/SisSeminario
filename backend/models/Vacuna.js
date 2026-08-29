import mongoose from 'mongoose';

const vacunaSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    rangoEdad: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator(valor) {
          const coincidencia = /^(\d+)-(\d+)$/.exec(valor);
          return Boolean(coincidencia && Number(coincidencia[1]) <= Number(coincidencia[2]));
        },
        message: 'El rango de edad debe tener el formato 0-1',
      },
    },
    dosisMl: { type: Number, required: true, min: 0.01 },
    numeroDosis: { type: Number, required: true, min: 1 },
    intervaloValor: { type: Number, min: 0, default: 0 },
    intervaloUnidad: {
      type: String,
      enum: ['dias', 'semanas', 'meses'],
      default: 'meses',
    },
    descripcion: { type: String, trim: true, default: '' },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Vacuna', vacunaSchema);
