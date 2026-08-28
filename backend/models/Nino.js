import mongoose from 'mongoose';

const ninoSchema = new mongoose.Schema(
  {
    primerNombre: { type: String, required: true, trim: true },
    segundoNombre: { type: String, trim: true, default: '' },
    tercerNombre: { type: String, trim: true, default: '' },
    primerApellido: { type: String, required: true, trim: true },
    segundoApellido: { type: String, required: true, trim: true },
    nombreCompleto: { type: String, trim: true },
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

ninoSchema.pre('save', function () {
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

export default mongoose.model('Nino', ninoSchema);
