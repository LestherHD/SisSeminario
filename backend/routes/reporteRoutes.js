import express from 'express';
import {
  exportarExcel,
  exportarPdf,
  obtenerReporte,
} from '../controllers/reporteController.js';
import { autorizar, proteger } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', proteger, autorizar('admin', 'encargado'), obtenerReporte);
router.get('/pdf', proteger, autorizar('admin', 'encargado'), exportarPdf);
router.get('/excel', proteger, autorizar('admin', 'encargado'), exportarExcel);

export default router;
