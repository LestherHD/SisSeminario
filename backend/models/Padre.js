import mongoose from 'mongoose';

const padreSchema = new mongoose.Schema(
  {
    primerNombre: { type: String, required: true, trim: true },
    segundoNombre: { type: String, trim: true, default: '' },
    tercerNombre: { type: String, trim: true, default: '' },
    primerApellido: { type: String, required: true, trim: true },
    segundoApellido: { type: String, required: true, trim: true },
    nombreCompleto: { type: String, trim: true },
    dpi: { type: String },
    telefono: { type: String },
    email: { type: String },
    metodoContacto: { type: [String], enum: ['telegram', 'email'], default: [] },
    telegramChatId: { type: String },
    comunidad: { type: mongoose.Schema.Types.ObjectId, ref: 'Comunidad', required: true },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

padreSchema.pre('save', function () {
  this.nombreCompleto = [
    this.primerNombre,
    this.segundoNombre,
    this.tercerNombre,
    this.primerApellido,
    this.segundoApellido,
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
});

export default mongoose.model('Padre', padreSchema);
