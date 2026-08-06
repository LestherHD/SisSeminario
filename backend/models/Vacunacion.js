import mongoose from 'mongoose';

const vacunacionSchema = new mongoose.Schema(
  {
    nino: { type: mongoose.Schema.Types.ObjectId, ref: 'Nino', required: true },
    vacuna: { type: mongoose.Schema.Types.ObjectId, ref: 'Vacuna', required: true },
    fechaAplicada: { type: Date },
    proximaDosis: { type: Date },
    estado: { type: String, enum: ['completa', 'pendiente', 'atrasada'], default: 'pendiente' },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Vacunacion', vacunacionSchema);