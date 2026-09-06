import express from 'express';
import {
  gerarUrlLoginSuap,
  consultarUsuarioSuap,
} from '../services/SuapService.js';

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

router.post('/usuario', async (req, res) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({
        message: 'Access token não fornecido.',
      });
    }

    const usuarioSuap = await consultarUsuarioSuap(accessToken);

    res.json({
      message: 'Usuário do SUAP consultado com sucesso.',
      usuario: usuarioSuap,
    });

  } catch (error) {
    console.error('Erro ao consultar usuário SUAP:', error);

    res.status(500).json({
      message: 'Erro ao consultar usuário no SUAP.',
      error: error.message,
    });
  }
});


export default router;