import express from 'express';
import {
  registrar,
  listarPorNino,
  actualizar,
  eliminar,
  obtenerCurvas,
} from '../controllers/crecimientoController.js';
import { proteger, autorizar } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', proteger, autorizar('admin', 'encargado', 'personal'), registrar);
router.get('/nino/:ninoId', proteger, listarPorNino);
router.get('/curvas/:ninoId', proteger, obtenerCurvas);
router.patch('/:id', proteger, autorizar('admin', 'encargado', 'personal'), actualizar);
router.delete('/:id', proteger, autorizar('admin', 'encargado', 'personal'), eliminar);

export default router;
