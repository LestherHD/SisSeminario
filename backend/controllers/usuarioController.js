import Usuario from '../models/Usuario.js';

const ROLES = ['admin', 'encargado', 'personal'];

async function esUltimoAdminActivo(usuario) {
  if (usuario.rol !== 'admin' || !usuario.activo) return false;
  const cantidad = await Usuario.countDocuments({ rol: 'admin', activo: true });
  return cantidad <= 1;
}

export async function listar(req, res) {
  try {
    const usuarios = await Usuario.find({})
      .select('-password -resetPasswordToken -resetPasswordExpires -resetPasswordAttempts')
      .sort({ nombre: 1 })
      .lean();
    return res.status(200).json(usuarios);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al cargar usuarios', error: error.message });
  }
}

export async function actualizar(req, res) {
  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    const nombre = req.body.nombre?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const rol = req.body.rol;

    if (!nombre || !email || !ROLES.includes(rol)) {
      return res.status(400).json({ mensaje: 'Nombre, correo y rol son obligatorios' });
    }

    const esPropioUsuario = usuario._id.equals(req.usuario._id);
    if (esPropioUsuario && rol !== usuario.rol) {
      return res.status(400).json({ mensaje: 'No puede cambiar el rol de su propia cuenta' });
    }

    if (usuario.rol === 'admin' && rol !== 'admin' && (await esUltimoAdminActivo(usuario))) {
      return res.status(400).json({ mensaje: 'Debe existir al menos un administrador activo' });
    }

    const emailOcupado = await Usuario.exists({ email, _id: { $ne: usuario._id } });
    if (emailOcupado) return res.status(400).json({ mensaje: 'El correo ya está registrado' });

    usuario.nombre = nombre;
    usuario.email = email;
    usuario.rol = rol;
    await usuario.save();

    return res.status(200).json({
      _id: usuario._id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      activo: usuario.activo,
    });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al actualizar el usuario', error: error.message });
  }
}

export async function cambiarEstado(req, res) {
  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    if (usuario._id.equals(req.usuario._id)) {
      return res.status(400).json({ mensaje: 'No puede desactivar su propia cuenta' });
    }

    const activar = req.body.activo === true;
    if (!activar && (await esUltimoAdminActivo(usuario))) {
      return res.status(400).json({ mensaje: 'Debe existir al menos un administrador activo' });
    }

    usuario.activo = activar;
    await usuario.save();
    return res.status(200).json({ mensaje: activar ? 'Usuario reactivado' : 'Usuario desactivado' });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al cambiar el estado', error: error.message });
  }
}
