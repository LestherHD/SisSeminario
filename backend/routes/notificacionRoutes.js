import express from 'express';
import { prueba, pruebaEmail, notificarAlerta } from '../controllers/notificacionController.js';
import { proteger, autorizar } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/prueba', proteger, autorizar('admin', 'encargado'), prueba);
router.post('/prueba-email', proteger, autorizar('admin'), pruebaEmail);
router.post('/alerta', proteger, autorizar('admin', 'encargado', 'personal'), notificarAlerta);

export default router;
