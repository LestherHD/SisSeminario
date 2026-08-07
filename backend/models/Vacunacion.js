import mongoose from 'mongoose';

const vacunacionSchema = new mongoose.Schema(
  {
    nino: { type: mongoose.Schema.Types.ObjectId, ref: 'Nino', required: true },
    vacuna: { type: mongoose.Schema.Types.ObjectId, ref: 'Vacuna', required: true },
    numeroDosis: { type: Number, required: true },
    fechaAplicada: { type: Date, required: true },
    proximaDosis: { type: Date },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Vacunacion', vacunacionSchema);