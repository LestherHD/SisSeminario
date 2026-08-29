import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js';

export async function proteger(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ mensaje: 'No autorizado, falta token' });
    }

    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const usuario = await Usuario.findById(decoded.id).select('-password');

    if (!usuario) {
      return res.status(401).json({ mensaje: 'Usuario no encontrado' });
    }

    if (
      usuario.passwordChangedAt &&
      decoded.iat * 1000 < usuario.passwordChangedAt.getTime()
    ) {
      return res.status(401).json({ mensaje: 'La contraseña cambió. Inicie sesión nuevamente.' });
    }

    req.usuario = usuario;
    return next();
  } catch (error) {
    return res.status(401).json({ mensaje: 'Token inválido o expirado' });
  }
}

export function autorizar(...roles) {
  return (req, res, next) => {
    if (!req.usuario || !roles.includes(req.usuario.rol)) {
      return res.status(403).json({ mensaje: 'Acceso denegado: rol sin permisos' });
    }

    return next();
  };
}
