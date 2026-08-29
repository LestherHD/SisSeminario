import express from 'express';
import { obtenerEstadisticas } from '../controllers/dashboardController.js';
import { autorizar, proteger } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', proteger, autorizar('admin', 'encargado'), obtenerEstadisticas);

export default router;
