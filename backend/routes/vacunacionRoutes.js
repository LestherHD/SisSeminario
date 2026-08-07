import express from 'express';
import {
  registrar,
  resumenPorNino,
  listarDosisPorNino,
  eliminar,
} from '../controllers/vacunacionController.js';
import { proteger, autorizar } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', proteger, autorizar('admin', 'encargado', 'personal'), registrar);
router.get('/resumen/:ninoId', proteger, resumenPorNino);
router.get('/nino/:ninoId', proteger, listarDosisPorNino);
router.delete('/:id', proteger, autorizar('admin', 'encargado', 'personal'), eliminar);

export default router;