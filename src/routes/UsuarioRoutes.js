import express from 'express';
import { login, listarUsuarios, atualizarUsuario, criarUsuario } from '../controllers/UsuarioController.js';

const router = express.Router();

router.post('/login', login);
router.post('/', criarUsuario);
router.get('/', listarUsuarios);
router.patch('/:id', atualizarUsuario);

export default router;