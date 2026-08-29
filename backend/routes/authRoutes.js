import express from 'express';
import {
  registrar,
  login,
  solicitarRecuperacion,
  restablecerPassword,
} from '../controllers/authController.js';
import { autorizar, proteger } from '../middleware/authMiddleware.js';
import {
  limitarLogin,
  limitarRestablecimiento,
  limitarSolicitudRecuperacion,
} from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

router.post('/register', proteger, autorizar('admin'), registrar);
router.post('/login', limitarLogin, login);
router.post('/solicitar-recuperacion', limitarSolicitudRecuperacion, solicitarRecuperacion);
router.post('/restablecer-password', limitarRestablecimiento, restablecerPassword);
router.get('/perfil', proteger, (req, res) => {
	res.json({ usuario: req.usuario });
});

export default router;
