import mongoose from 'mongoose';

const comunidadSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },
    ubicacion: { type: String },
    numFamilias: { type: Number, default: 0 },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Comunidad', comunidadSchema);