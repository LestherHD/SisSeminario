import mongoose from 'mongoose';

const registroCrecimientoSchema = new mongoose.Schema(
  {
    nino: { type: mongoose.Schema.Types.ObjectId, ref: 'Nino', required: true },
    peso: { type: Number, required: true },
    talla: { type: Number, required: true },
    fecha: { type: Date, default: Date.now },
    edadMeses: { type: Number },
    percentilPeso: { type: Number },
    percentilTalla: { type: Number },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('RegistroCrecimiento', registroCrecimientoSchema);