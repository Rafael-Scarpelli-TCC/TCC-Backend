import express from 'express';
import { gerarUrlLoginSuap } from '../services/SuapService.js';

const router = express.Router();

router.get('/', (req, res) => {
  const url = gerarUrlLoginSuap();

  res.redirect(url);
});

export default router;