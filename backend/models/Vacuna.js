import mongoose from 'mongoose';

const vacunaSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },
    edadRecomendada: { type: Number },
    dosis: { type: String },
    descripcion: { type: String },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Vacuna', vacunaSchema);