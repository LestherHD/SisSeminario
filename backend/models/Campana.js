import mongoose from 'mongoose';

const campanaSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    descripcion: { type: String, required: true, trim: true },
    alcance: {
      type: String,
      enum: ['departamento', 'municipio', 'comunidad'],
      required: true,
    },
    departamento: { type: String, required: true, trim: true },
    municipio: { type: String, trim: true, default: '' },
    comunidad: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comunidad',
      default: null,
    },
    fechaRealizacion: { type: Date, required: true },
    notificacionEnviada: { type: Boolean, default: false },
    fechaEnvio: { type: Date, default: null },
    destinatariosEnviados: { type: Number, default: 0 },
    destinatariosFallidos: { type: Number, default: 0 },
    correosEnviados: { type: Number, default: 0 },
    correosFallidos: { type: Number, default: 0 },
    telegramEnviados: { type: Number, default: 0 },
    telegramFallidos: { type: Number, default: 0 },
    creadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Campana', campanaSchema);
