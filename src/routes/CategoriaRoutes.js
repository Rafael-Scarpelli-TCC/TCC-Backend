import express from 'express';
import { criarCategoria, listarCategorias, deletarCategoria } from '../controllers/CategoriaController.js';
import { autorizar } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', listarCategorias);
router.post('/', autorizar('ADMINISTRADOR'), criarCategoria);
router.delete('/:id', autorizar('ADMINISTRADOR'), deletarCategoria);

export default router;