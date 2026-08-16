import express from 'express';
import { criarSetor, listarSetores, atualizarSetor, deletarSetor } from '../controllers/SetorController.js';

const router = express.Router();

router.post('/', criarSetor);
router.get('/', listarSetores);
router.patch('/:id', atualizarSetor);
router.delete('/:id', deletarSetor);

export default router;