import mongoose from 'mongoose';

const ninoSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },
    fechaNacimiento: { type: Date, required: true },
    sexo: { type: String, enum: ['M', 'F'], required: true },
    comunidad: { type: mongoose.Schema.Types.ObjectId, ref: 'Comunidad', required: true },
    padres: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Padre' }],
    codigoQR: { type: String },
    codigoCarnet: { type: String, unique: true, sparse: true },
    pin: { type: String },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Nino', ninoSchema);