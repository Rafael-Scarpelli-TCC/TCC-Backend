import express from 'express';
import multer from 'multer';
import { importarPlanilha, exportarPlanilha, listarPlanilhas } from '../controllers/PlanilhaController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', listarPlanilhas);

router.post('/importar', (req, res, next) => {
  upload.single('arquivo')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: 'Erro no upload.', error: err.message });
    }
    next();
  });
}, importarPlanilha);

router.get('/exportar/:planilhaId', exportarPlanilha);

export default router;