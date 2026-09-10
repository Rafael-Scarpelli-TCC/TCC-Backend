import express from 'express';

import {
  login,
  listarUsuarios,
  atualizarUsuario,
  criarUsuario,
  cadastrarViaSuap,
  verificarIdentificacao
} from '../controllers/UsuarioController.js';

import {
  autenticar,
  autorizar
} from '../middlewares/auth.js';

const router = express.Router();

router.post('/login', login);

router.post('/cadastro-suap', cadastrarViaSuap);

router.get(
  '/verificar-identificacao/:identificacao',
  verificarIdentificacao
);

router.get(
  '/',
  autenticar,
  listarUsuarios
);

router.post(
  '/',
  autenticar,
  autorizar('ADMIN'),
  criarUsuario
);

router.patch(
  '/:id',
  autenticar,
  autorizar('ADMIN'),
  atualizarUsuario
);

export default router;