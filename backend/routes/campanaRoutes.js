import express from 'express';
import {
  actualizar,
  crear,
  eliminar,
  enviar,
  listar,
  previsualizarDestinatarios,
} from '../controllers/campanaController.js';
import { autorizar, proteger } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', proteger, listar);
router.get('/:id/destinatarios', proteger, previsualizarDestinatarios);
router.post('/', proteger, autorizar('admin', 'encargado'), crear);
router.put('/:id', proteger, autorizar('admin', 'encargado'), actualizar);
router.delete('/:id', proteger, autorizar('admin', 'encargado'), eliminar);
router.post('/:id/enviar', proteger, autorizar('admin', 'encargado'), enviar);

export default router;
