import mongoose from 'mongoose';

const usuarioSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    rol: { type: String, enum: ['admin', 'personal', 'encargado'], default: 'personal' },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Usuario', usuarioSchema);