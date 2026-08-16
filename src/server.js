import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import PlanilhaRoutes from './routes/PlanilhaRoutes.js';
import ItemCompraRoutes from './routes/ItemCompraRoutes.js';
import SolicitacaoRoutes from './routes/SolicitacaoRoutes.js';
import CronogramaRoutes from './routes/CronogramaRoutes.js';
import UsuarioRoutes from './routes/UsuarioRoutes.js';
import SetorRoutes from './routes/SetorRoutes.js';
import CategoriaRoutes from './routes/CategoriaRoutes.js';
import { autenticar, autorizar } from './middlewares/auth.js';
import LogRoutes from './routes/LogRoutes.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/usuarios', UsuarioRoutes);

app.use(autenticar);

app.use('/api/planilha', autorizar('ADMINISTRADOR'), PlanilhaRoutes);
app.use('/api/itens', ItemCompraRoutes);
app.use('/api/solicitacoes', SolicitacaoRoutes);
app.use('/api/cronograma', autorizar('ADMINISTRADOR'), CronogramaRoutes);
app.use('/api/setores', autorizar('ADMINISTRADOR'), SetorRoutes);
app.use('/api/categorias', CategoriaRoutes);
app.use('/api/logs', LogRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'API funcionando!' });
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB conectado!');
    app.listen(process.env.PORT, () => {
      console.log(`Servidor rodando na porta ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.error('Erro ao conectar no MongoDB:', err);
  });