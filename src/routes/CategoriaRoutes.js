import express from 'express';

import {
  criarCategoria,
  listarCategorias,
  deletarCategoria
} from '../controllers/CategoriaController.js';

import { autorizar } from '../middlewares/auth.js';

const router = express.Router();

router.get(
  '/',
  listarCategorias
);

router.post(
  '/',
  autorizar('ADMIN'),
  criarCategoria
);

router.delete(
  '/:id',
  autorizar('ADMIN'),
  deletarCategoria
);

export default router;