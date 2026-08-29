import express from 'express';
import {
  registrar,
  login,
  solicitarRecuperacion,
  restablecerPassword,
} from '../controllers/authController.js';
import { proteger } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registrar);
router.post('/login', login);
router.post('/solicitar-recuperacion', solicitarRecuperacion);
router.post('/restablecer-password', restablecerPassword);
router.get('/perfil', proteger, (req, res) => {
	res.json({ usuario: req.usuario });
});

export default router;
