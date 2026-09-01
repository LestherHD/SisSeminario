import express from 'express';
import {
  crear,
  listar,
  obtenerPorId,
  actualizar,
  eliminar,
  reactivar,
  revocarTelegram,
} from '../controllers/padreController.js';
import { proteger, autorizar } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', proteger, listar);
router.get('/:id', proteger, obtenerPorId);
router.post('/', proteger, autorizar('admin', 'encargado', 'personal'), crear);
router.put('/:id', proteger, autorizar('admin', 'encargado', 'personal'), actualizar);
router.patch('/:id/telegram/revocar', proteger, autorizar('admin'), revocarTelegram);
router.delete('/:id', proteger, autorizar('admin', 'encargado'), eliminar);
router.patch('/:id/reactivar', proteger, autorizar('admin', 'encargado'), reactivar);

export default router;
