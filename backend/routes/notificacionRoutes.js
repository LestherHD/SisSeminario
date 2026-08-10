import express from 'express';
import { prueba, notificarAlerta } from '../controllers/notificacionController.js';
import { proteger, autorizar } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/prueba', proteger, autorizar('admin', 'encargado'), prueba);
router.post('/alerta', proteger, autorizar('admin', 'encargado', 'personal'), notificarAlerta);

export default router;
