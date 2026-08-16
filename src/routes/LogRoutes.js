import express from 'express';
import { listarLogs } from '../controllers/LogController.js';

const router = express.Router();

router.get('/:solicitacaoId', listarLogs);

export default router;