import mongoose from 'mongoose';

const registroCrecimientoSchema = new mongoose.Schema(
  {
    nino: { type: mongoose.Schema.Types.ObjectId, ref: 'Nino', required: true },
    peso: { type: Number, required: true },
    talla: { type: Number, required: true },
    fecha: { type: Date, default: Date.now },
    edadMeses: { type: Number },
    edadDias: { type: Number },
    edadMesesExacta: { type: Number },
    imc: { type: Number },
    zPesoEdad: { type: Number, default: null },
    zTallaEdad: { type: Number, default: null },
    zImcEdad: { type: Number, default: null },
    percentilPeso: { type: Number },
    percentilTalla: { type: Number },
    percentilImc: { type: Number, default: null },
    estadoNutricional: { type: String, default: 'sin_datos' },
    estadoTalla: { type: String, default: 'sin_datos' },
    referenciaOms: { type: String, default: '' },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('RegistroCrecimiento', registroCrecimientoSchema);
