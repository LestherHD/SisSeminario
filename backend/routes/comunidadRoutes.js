import express from 'express';
import { crear, listar, obtenerPorId, actualizar, eliminar } from '../controllers/comunidadController.js';
import { proteger, autorizar } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', proteger, listar);
router.get('/:id', proteger, obtenerPorId);
router.post('/', proteger, autorizar('admin', 'encargado'), crear);
router.put('/:id', proteger, autorizar('admin', 'encargado'), actualizar);
router.delete('/:id', proteger, autorizar('admin', 'encargado'), eliminar);

export default router;