import 'dotenv/config';
import mongoose from 'mongoose';

import app from './app.js';

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB conectado!');

    app.listen(process.env.PORT, () => {
      console.log(
        `Servidor rodando na porta ${process.env.PORT}`
      );
    });
  })
  .catch((error) => {
    console.error(
      'Erro ao conectar no MongoDB:',
      error
    );
  });