import mongoose from 'mongoose';

const alertaSchema = new mongoose.Schema(
  {
    nino: { type: mongoose.Schema.Types.ObjectId, ref: 'Nino', required: true },
    tipo: { type: String, enum: ['preventiva', 'critica'], required: true },
    motivo: {
      type: String,
      enum: [
        'desnutricion',
        'sobrepeso',
        'sin_registros',
        'vacuna_proxima',
        'vacuna_atrasada',
      ],
    },
    mensaje: { type: String, required: true },
    fecha: { type: Date, default: Date.now },
    atendida: { type: Boolean, default: false },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Alerta', alertaSchema);
