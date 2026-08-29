import express from 'express';
import { registrar } from '../controllers/authController.js';
import { actualizar, cambiarEstado, listar } from '../controllers/usuarioController.js';
import { autorizar, proteger } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(proteger, autorizar('admin'));
router.get('/', listar);
router.post('/', registrar);
router.put('/:id', actualizar);
router.patch('/:id/estado', cambiarEstado);

export default router;
