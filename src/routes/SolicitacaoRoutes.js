import express from 'express';
import {
  criarSolicitacao,
  listarSolicitacoes,
  listarSolicitacoesAprovador,
  aprovarRejeitarSolicitacao,
  cancelarSolicitacao,
  editarSolicitacao,
} from '../controllers/SolicitacaoController.js';

const router = express.Router();

router.post('/', criarSolicitacao);
router.get('/', listarSolicitacoes);
router.get('/aprovador', listarSolicitacoesAprovador);
router.patch('/:id/decisao', aprovarRejeitarSolicitacao);
router.patch('/:id/cancelar', cancelarSolicitacao);
router.patch('/:id/editar', editarSolicitacao);

export default router;