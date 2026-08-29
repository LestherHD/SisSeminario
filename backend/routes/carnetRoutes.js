import express from 'express';
import {
  generarCarnet,
  enviarCarnetTelegram,
  verCarnetPublico,
  verExpedienteInterno,
} from '../controllers/carnetController.js';
import { proteger, autorizar } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/generar/:ninoId', proteger, autorizar('admin', 'encargado', 'personal'), generarCarnet);
router.post('/enviar/:ninoId', proteger, autorizar('admin', 'encargado', 'personal'), enviarCarnetTelegram);
router.get(
  '/expediente/:ninoId',
  proteger,
  autorizar('admin', 'encargado', 'personal'),
  verExpedienteInterno
);
router.post('/ver/:codigo', verCarnetPublico);

export default router;
