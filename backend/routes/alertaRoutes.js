import express from 'express';
import { listar, marcarAtendida, eliminar, analizar } from '../controllers/alertaController.js';
import { proteger, autorizar } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', proteger, listar);
router.post('/analizar', proteger, autorizar('admin', 'encargado'), analizar);
router.patch('/:id/atender', proteger, autorizar('admin', 'encargado', 'personal'), marcarAtendida);
router.delete('/:id', proteger, autorizar('admin', 'encargado'), eliminar);

export default router;
