import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const usuarioSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    rol: { type: String, enum: ['admin', 'personal', 'encargado'], default: 'personal' },
    activo: { type: Boolean, default: true },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
    resetPasswordAttempts: { type: Number, default: 0, select: false },
    resetPasswordSolicitadoEn: { type: Date, select: false },
    passwordChangedAt: { type: Date },
  },
  { timestamps: true }
);

usuarioSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

usuarioSchema.methods.compararPassword = function (passwordPlano) {
  return bcrypt.compare(passwordPlano, this.password);
};

export default mongoose.model('Usuario', usuarioSchema);
