import express from 'express';
import { obtenerEstadisticas } from '../controllers/dashboardController.js';
import { proteger } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', proteger, obtenerEstadisticas);

export default router;
