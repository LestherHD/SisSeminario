import mongoose from 'mongoose';

const comunidadSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    departamento: { type: String, required: true, trim: true },
    municipio: { type: String, required: true, trim: true },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

comunidadSchema.index(
  { departamento: 1, municipio: 1, nombre: 1 },
  {
    unique: true,
    collation: { locale: 'es', strength: 2 },
    partialFilterExpression: {
      departamento: { $type: 'string' },
      municipio: { $type: 'string' },
      nombre: { $type: 'string' },
    },
    name: 'comunidad_ubicacion_nombre_unico',
  }
);

export default mongoose.model('Comunidad', comunidadSchema);
