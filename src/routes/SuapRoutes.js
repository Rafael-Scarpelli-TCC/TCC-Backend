import express from 'express';
import { gerarUrlLoginSuap } from '../services/SuapService.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const url = gerarUrlLoginSuap();

    res.redirect(url);
  } catch (error) {
    console.error('Erro ao iniciar login SUAP:', error);

    res.status(500).json({
      message: 'Erro ao iniciar autenticação com o SUAP.',
    });
  }
});

export default router;