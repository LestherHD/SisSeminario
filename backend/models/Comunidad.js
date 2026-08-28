import mongoose from 'mongoose';

const comunidadSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    departamento: { type: String, required: true },
    municipio: { type: String, required: true },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Comunidad', comunidadSchema);
