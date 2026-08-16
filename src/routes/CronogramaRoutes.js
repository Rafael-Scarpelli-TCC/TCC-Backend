import express from 'express';
import {
  criarCronograma,
  listarCronogramas,
  encerrarCronograma,
  isAberto,
} from '../controllers/CronogramaController.js';

const router = express.Router();

router.post('/', criarCronograma);
router.get('/', listarCronogramas);
router.patch('/:id/encerrar', encerrarCronograma);
router.get('/aberto', isAberto);

export default router;