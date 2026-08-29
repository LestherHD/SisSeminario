import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import Usuario from '../models/Usuario.js';
import { enviarCodigoRecuperacion } from '../services/emailService.js';

const DURACION_CODIGO_MS = 10 * 60 * 1000;
const ESPERA_REENVIO_MS = 60 * 1000;
const MAX_INTENTOS_CODIGO = 5;
const MENSAJE_SOLICITUD =
  'Si el correo pertenece a una cuenta activa, recibirá un código de recuperación.';

function hashCodigo(codigo) {
  return crypto.createHash('sha256').update(String(codigo)).digest('hex');
}

function codigoCoincide(codigo, hashGuardado) {
  const recibido = Buffer.from(hashCodigo(codigo), 'hex');
  const guardado = Buffer.from(hashGuardado, 'hex');
  return recibido.length === guardado.length && crypto.timingSafeEqual(recibido, guardado);
}

function passwordSegura(password) {
  return (
    typeof password === 'string' &&
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password)
  );
}

function generarToken(usuario) {
  return jwt.sign(
    { id: usuario._id, rol: usuario.rol },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function registrar(req, res) {
  try {
    const { nombre, email, password, rol } = req.body;

    const existeUsuario = await Usuario.findOne({ email });
    if (existeUsuario) {
      return res.status(400).json({ mensaje: 'El email ya está registrado' });
    }

    const usuario = await Usuario.create({
      nombre,
      email,
      password,
      rol,
    });

    const token = generarToken(usuario);

    return res.status(201).json({
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas' });
    }

    const coincide = await usuario.compararPassword(password);
    if (!coincide) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas' });
    }

    const token = generarToken(usuario);

    return res.status(200).json({
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}

export async function solicitarRecuperacion(req, res) {
  try {
    const email = req.body.email?.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ mensaje: 'El correo electrónico es obligatorio' });
    }

    const usuario = await Usuario.findOne({ email, activo: true }).select(
      '+resetPasswordSolicitadoEn'
    );

    if (!usuario) {
      return res.status(200).json({ mensaje: MENSAJE_SOLICITUD });
    }

    const ahora = Date.now();
    const ultimaSolicitud = usuario.resetPasswordSolicitadoEn?.getTime() || 0;

    if (ahora - ultimaSolicitud < ESPERA_REENVIO_MS) {
      return res.status(200).json({ mensaje: MENSAJE_SOLICITUD });
    }

    const codigo = String(crypto.randomInt(100000, 1000000));
    usuario.resetPasswordToken = hashCodigo(codigo);
    usuario.resetPasswordExpires = new Date(ahora + DURACION_CODIGO_MS);
    usuario.resetPasswordAttempts = 0;
    usuario.resetPasswordSolicitadoEn = new Date(ahora);
    await usuario.save();

    const resultado = await enviarCodigoRecuperacion(usuario, codigo);

    if (!resultado.exito) {
      usuario.resetPasswordToken = undefined;
      usuario.resetPasswordExpires = undefined;
      usuario.resetPasswordAttempts = 0;
      usuario.resetPasswordSolicitadoEn = undefined;
      await usuario.save();
      console.error(`No se pudo enviar el código de recuperación a ${usuario.email}: ${resultado.error}`);
    }

    return res.status(200).json({ mensaje: MENSAJE_SOLICITUD });
  } catch (error) {
    console.error('Error solicitando recuperación de contraseña:', error.message);
    return res.status(200).json({ mensaje: MENSAJE_SOLICITUD });
  }
}

export async function restablecerPassword(req, res) {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const codigo = req.body.codigo?.trim();
    const { nuevaPassword, confirmarPassword } = req.body;

    if (!email || !codigo || !nuevaPassword || !confirmarPassword) {
      return res.status(400).json({ mensaje: 'Complete todos los campos' });
    }

    if (!/^\d{6}$/.test(codigo)) {
      return res.status(400).json({ mensaje: 'El código debe contener 6 dígitos' });
    }

    if (nuevaPassword !== confirmarPassword) {
      return res.status(400).json({ mensaje: 'Las contraseñas no coinciden' });
    }

    if (!passwordSegura(nuevaPassword)) {
      return res.status(400).json({
        mensaje: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número',
      });
    }

    const usuario = await Usuario.findOne({ email, activo: true }).select(
      '+resetPasswordToken +resetPasswordExpires +resetPasswordAttempts +resetPasswordSolicitadoEn'
    );

    const tokenVigente =
      usuario?.resetPasswordToken &&
      usuario.resetPasswordExpires &&
      usuario.resetPasswordExpires.getTime() > Date.now();

    if (!tokenVigente) {
      return res.status(400).json({ mensaje: 'El código es inválido o ha vencido' });
    }

    if (usuario.resetPasswordAttempts >= MAX_INTENTOS_CODIGO) {
      return res.status(400).json({ mensaje: 'El código es inválido o ha vencido' });
    }

    if (!codigoCoincide(codigo, usuario.resetPasswordToken)) {
      usuario.resetPasswordAttempts += 1;

      if (usuario.resetPasswordAttempts >= MAX_INTENTOS_CODIGO) {
        usuario.resetPasswordToken = undefined;
        usuario.resetPasswordExpires = undefined;
      }

      await usuario.save();
      return res.status(400).json({ mensaje: 'El código es inválido o ha vencido' });
    }

    usuario.password = nuevaPassword;
    usuario.passwordChangedAt = new Date();
    usuario.resetPasswordToken = undefined;
    usuario.resetPasswordExpires = undefined;
    usuario.resetPasswordAttempts = 0;
    usuario.resetPasswordSolicitadoEn = undefined;
    await usuario.save();

    return res.status(200).json({
      mensaje: 'Contraseña actualizada correctamente. Ya puede iniciar sesión.',
    });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error del servidor', error: error.message });
  }
}
