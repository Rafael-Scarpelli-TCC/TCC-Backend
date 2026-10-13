import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod;

export async function conectarBancoDeTeste() {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri(), { dbName: 'pca_teste' });
}

export async function limparBancoDeTeste() {
  const { host } = mongoose.connection;
  if (!['127.0.0.1', 'localhost'].includes(host)) {
    throw new Error(`Recusando limpar banco não-local: ${host}`);
  }

  for (const colecao of Object.values(mongoose.connection.collections)) {
    await colecao.deleteMany({});
  }
}

export async function desconectarBancoDeTeste() {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
}