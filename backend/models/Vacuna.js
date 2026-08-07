import mongoose from 'mongoose';

const vacunaSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },
    edadRecomendada: { type: Number },
    dosisTotales: { type: Number, default: 1 },
    intervaloValor: { type: Number, default: 0 },
    intervaloUnidad: { type: String, enum: ['dias', 'semanas', 'meses'], default: 'meses' },
    descripcion: { type: String },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Vacuna', vacunaSchema);