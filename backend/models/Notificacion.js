import mongoose from 'mongoose';

const notificacionSchema = new mongoose.Schema(
  {
    padre: { type: mongoose.Schema.Types.ObjectId, ref: 'Padre', required: true },
    alerta: { type: mongoose.Schema.Types.ObjectId, ref: 'Alerta' },
    campana: { type: mongoose.Schema.Types.ObjectId, ref: 'Campana' },
    canal: { type: String, enum: ['email', 'telegram', 'whatsapp'], required: true },
    mensaje: { type: String, required: true },
    estado: { type: String, enum: ['enviada', 'pendiente', 'fallida'], default: 'pendiente' },
    fechaEnvio: { type: Date },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Notificacion', notificacionSchema);
