import express from 'express';
import { login, listarUsuarios, atualizarUsuario, criarUsuario } from '../controllers/UsuarioController.js';
import { autenticar, autorizar } from '../middlewares/auth.js';

const router = express.Router();

router.post('/login', login);

router.get('/', autenticar, listarUsuarios);
router.post('/', autenticar, autorizar('ADMINISTRADOR'), criarUsuario);
router.patch('/:id', autenticar, autorizar('ADMINISTRADOR'), atualizarUsuario);

export default router;