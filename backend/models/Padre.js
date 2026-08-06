import mongoose from 'mongoose';

const padreSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },
    dpi: { type: String },
    telefono: { type: String },
    email: { type: String },
    canalPreferido: { type: String, enum: ['email', 'telegram', 'whatsapp'], default: 'email' },
    telegramChatId: { type: String },
    comunidad: { type: mongoose.Schema.Types.ObjectId, ref: 'Comunidad', required: true },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Padre', padreSchema);