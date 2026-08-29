import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import Usuario from '../models/Usuario.js';
import {
  enviarCodigoRecuperacion,
  enviarCodigoVerificacionInicial,
} from '../services/emailService.js';

const DURACION_CODIGO_MS = 10 * 60 * 1000;
const ESPERA_REENVIO_MS = 60 * 1000;
const MAX_INTENTOS_CODIGO = 5;
const MENSAJE_SOLICITUD =
  'Si el correo pertenece a una cuenta activa, recibirá un código de recuperación.';
let creandoAdminInicial = false;

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

function ocultarEmail(email = '') {
  const [usuario, dominio] = email.split('@');
  if (!dominio) return 'correo registrado';
  const visibles = usuario.slice(0, Math.min(2, usuario.length));
  return `${visibles}${'*'.repeat(Math.max(3, usuario.length - visibles.length))}@${dominio}`;
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
    if (req.usuario?.rol !== 'admin') {
      return res.status(403).json({ mensaje: 'Solo un administrador puede crear usuarios' });
    }

    const nombre = req.body.nombre?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const { password } = req.body;
    const rol = req.body.rol || 'personal';

    if (!nombre || !email || !password) {
      return res.status(400).json({ mensaje: 'Nombre, correo y contraseña son obligatorios' });
    }

    if (!['admin', 'encargado', 'personal'].includes(rol)) {
      return res.status(400).json({ mensaje: 'El rol seleccionado no es válido' });
    }

    if (!passwordSegura(password)) {
      return res.status(400).json({
        mensaje:
          'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número',
      });
    }

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

    return res.status(201).json({
      mensaje: 'Usuario creado correctamente',
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
    const email = req.body.email?.trim().toLowerCase();
    const { password } = req.body;

    if (!email || !password) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas' });
    }

    const usuario = await Usuario.findOne({ email, activo: true });
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

export async function estadoInicial(req, res) {
  try {
    const adminActivo = await Usuario.exists({ rol: 'admin', activo: true });
    if (adminActivo) {
      return res.status(200).json({
        requiereConfiguracion: false,
        requiereVerificacion: false,
      });
    }

    const pendiente = await Usuario.findOne({
      rol: 'admin',
      activo: false,
      emailVerificado: false,
    }).select('email');

    if (pendiente) {
      return res.status(200).json({
        requiereConfiguracion: false,
        requiereVerificacion: true,
        correo: ocultarEmail(pendiente.email),
      });
    }

    const existeUsuario = await Usuario.exists({});
    return res.status(200).json({
      requiereConfiguracion: !existeUsuario,
      requiereVerificacion: false,
    });
  } catch (error) {
    return res.status(500).json({ mensaje: 'No se pudo verificar la configuración inicial' });
  }
}

export async function crearAdminInicial(req, res) {
  if (creandoAdminInicial) {
    return res.status(409).json({ mensaje: 'La configuración inicial ya está en proceso' });
  }

  creandoAdminInicial = true;
  try {
    const existeUsuario = await Usuario.exists({});
    if (existeUsuario) {
      return res.status(403).json({
        mensaje: 'La configuración inicial ya fue completada',
      });
    }

    const nombre = req.body.nombre?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const { password, confirmarPassword } = req.body;

    if (!nombre || !email || !password || !confirmarPassword) {
      return res.status(400).json({ mensaje: 'Complete todos los campos' });
    }

    if (password !== confirmarPassword) {
      return res.status(400).json({ mensaje: 'Las contraseñas no coinciden' });
    }

    if (!passwordSegura(password)) {
      return res.status(400).json({
        mensaje:
          'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número',
      });
    }

    const codigo = String(crypto.randomInt(100000, 1000000));
    const ahora = Date.now();
    const usuario = await Usuario.create({
      nombre,
      email,
      password,
      rol: 'admin',
      activo: false,
      emailVerificado: false,
      verificacionEmailToken: hashCodigo(codigo),
      verificacionEmailExpires: new Date(ahora + DURACION_CODIGO_MS),
      verificacionEmailAttempts: 0,
      verificacionEmailSolicitadoEn: new Date(ahora),
    });

    const resultado = await enviarCodigoVerificacionInicial(usuario, codigo);
    if (!resultado.exito) {
      await Usuario.deleteOne({ _id: usuario._id, activo: false, emailVerificado: false });
      return res.status(502).json({
        mensaje: 'No se pudo enviar el código. Verifique la configuración de correo e intente nuevamente.',
      });
    }

    return res.status(201).json({
      mensaje: 'Enviamos un código de verificación al correo del administrador',
      requiereVerificacion: true,
      correo: ocultarEmail(usuario.email),
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ mensaje: 'La configuración inicial ya fue completada' });
    }
    return res.status(500).json({ mensaje: 'No se pudo crear el administrador inicial' });
  } finally {
    creandoAdminInicial = false;
  }
}

export async function verificarAdminInicial(req, res) {
  try {
    const codigo = req.body.codigo?.trim();
    if (!/^\d{6}$/.test(codigo || '')) {
      return res.status(400).json({ mensaje: 'El código debe contener 6 dígitos' });
    }

    const usuario = await Usuario.findOne({
      rol: 'admin',
      activo: false,
      emailVerificado: false,
    }).select(
      '+verificacionEmailToken +verificacionEmailExpires +verificacionEmailAttempts +verificacionEmailSolicitadoEn'
    );

    const tokenVigente =
      usuario?.verificacionEmailToken &&
      usuario.verificacionEmailExpires &&
      usuario.verificacionEmailExpires.getTime() > Date.now();

    if (!tokenVigente || usuario.verificacionEmailAttempts >= MAX_INTENTOS_CODIGO) {
      return res.status(400).json({ mensaje: 'El código es inválido o ha vencido' });
    }

    if (!codigoCoincide(codigo, usuario.verificacionEmailToken)) {
      usuario.verificacionEmailAttempts += 1;
      if (usuario.verificacionEmailAttempts >= MAX_INTENTOS_CODIGO) {
        usuario.verificacionEmailToken = undefined;
        usuario.verificacionEmailExpires = undefined;
      }
      await usuario.save();
      return res.status(400).json({ mensaje: 'El código es inválido o ha vencido' });
    }

    usuario.activo = true;
    usuario.emailVerificado = true;
    usuario.verificacionEmailToken = undefined;
    usuario.verificacionEmailExpires = undefined;
    usuario.verificacionEmailAttempts = 0;
    usuario.verificacionEmailSolicitadoEn = undefined;
    await usuario.save();

    return res.status(200).json({
      mensaje: 'Correo verificado. Ya puede iniciar sesión.',
      email: usuario.email,
    });
  } catch (error) {
    return res.status(500).json({ mensaje: 'No se pudo verificar la cuenta' });
  }
}

export async function reenviarVerificacionInicial(req, res) {
  try {
    const usuario = await Usuario.findOne({
      rol: 'admin',
      activo: false,
      emailVerificado: false,
    }).select('+verificacionEmailSolicitadoEn');

    if (!usuario) {
      return res.status(403).json({ mensaje: 'La configuración inicial ya fue completada' });
    }

    const ultimaSolicitud = usuario.verificacionEmailSolicitadoEn?.getTime() || 0;
    if (Date.now() - ultimaSolicitud < ESPERA_REENVIO_MS) {
      return res.status(429).json({ mensaje: 'Espere un minuto antes de solicitar otro código' });
    }

    const codigo = String(crypto.randomInt(100000, 1000000));
    const resultado = await enviarCodigoVerificacionInicial(usuario, codigo);
    if (!resultado.exito) {
      return res.status(502).json({ mensaje: 'No se pudo reenviar el código' });
    }

    usuario.verificacionEmailToken = hashCodigo(codigo);
    usuario.verificacionEmailExpires = new Date(Date.now() + DURACION_CODIGO_MS);
    usuario.verificacionEmailAttempts = 0;
    usuario.verificacionEmailSolicitadoEn = new Date();
    await usuario.save();

    return res.status(200).json({
      mensaje: 'Se envió un código nuevo',
      correo: ocultarEmail(usuario.email),
    });
  } catch (error) {
    return res.status(500).json({ mensaje: 'No se pudo reenviar el código' });
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
