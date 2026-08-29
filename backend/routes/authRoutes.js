import express from 'express';
import {
  registrar,
  login,
  solicitarRecuperacion,
  restablecerPassword,
  estadoInicial,
  crearAdminInicial,
  verificarAdminInicial,
  reenviarVerificacionInicial,
} from '../controllers/authController.js';
import { autorizar, proteger } from '../middleware/authMiddleware.js';
import {
  limitarLogin,
  limitarRestablecimiento,
  limitarSolicitudRecuperacion,
  limitarConfiguracionInicial,
  limitarVerificacionInicial,
  limitarReenvioInicial,
} from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

router.get('/estado-inicial', estadoInicial);
router.post('/configuracion-inicial', limitarConfiguracionInicial, crearAdminInicial);
router.post('/verificar-configuracion-inicial', limitarVerificacionInicial, verificarAdminInicial);
router.post('/reenviar-configuracion-inicial', limitarReenvioInicial, reenviarVerificacionInicial);
router.post('/register', proteger, autorizar('admin'), registrar);
router.post('/login', limitarLogin, login);
router.post('/solicitar-recuperacion', limitarSolicitudRecuperacion, solicitarRecuperacion);
router.post('/restablecer-password', limitarRestablecimiento, restablecerPassword);
router.get('/perfil', proteger, (req, res) => {
	res.json({ usuario: req.usuario });
});

export default router;
