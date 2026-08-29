import { rateLimit } from 'express-rate-limit';

const QUINCE_MINUTOS = 15 * 60 * 1000;

function crearLimitador({ limite, mensaje, omitirExitos = false }) {
  return rateLimit({
    windowMs: QUINCE_MINUTOS,
    limit: limite,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skipSuccessfulRequests: omitirExitos,
    handler: (req, res) =>
      res.status(429).json({
        mensaje,
      }),
  });
}

export const limitarLogin = crearLimitador({
  limite: 10,
  omitirExitos: true,
  mensaje: 'Demasiados intentos de inicio de sesión. Intente nuevamente en 15 minutos.',
});

export const limitarSolicitudRecuperacion = crearLimitador({
  limite: 3,
  mensaje: 'Demasiadas solicitudes de recuperación. Intente nuevamente en 15 minutos.',
});

export const limitarRestablecimiento = crearLimitador({
  limite: 5,
  mensaje: 'Demasiados intentos de recuperación. Solicite un código nuevo más tarde.',
});

export const limitarConsultaCarnet = crearLimitador({
  limite: 10,
  omitirExitos: true,
  mensaje: 'Demasiados intentos de consulta. Intente nuevamente en 15 minutos.',
});
