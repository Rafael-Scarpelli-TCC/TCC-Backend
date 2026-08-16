import express from 'express';
import { listarItens } from '../controllers/ItemCompraController.js';

const router = express.Router();

router.get('/', listarItens);

export default router;