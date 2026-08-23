import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Usuario from './models/Usuario.js';
import Setor from './models/Setor.js';

dotenv.config();

const criarUsuarioSeNaoExiste = async (dados) => {
  const existe = await Usuario.findOne({ email: dados.email });
  if (existe) {
    console.log(`Usuário já existe: ${dados.email}`);
    return existe;
  }
  const usuario = await Usuario.create(dados);
  console.log(`Usuário criado: ${dados.email}`);
  return usuario;
};

const criarSetorSeNaoExiste = async (nome, descricao, aprovadorId) => {
  const existe = await Setor.findOne({ nome });
  if (existe) {
    console.log(`Setor já existe: ${nome}`);
    return existe;
  }
  const setor = await Setor.create({ nome, descricao, aprovador: aprovadorId });
  console.log(`Setor criado: ${nome}`);
  return setor;
};

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  await criarUsuarioSeNaoExiste({
    nome: 'Administrador',
    email: 'admin@ifpr.edu.br',
    senha: 'TROQUE_ESSA_SENHA_AQUI',
    perfil: 'ADMINISTRADOR',
  });

  const aprovador1 = await criarUsuarioSeNaoExiste({
    nome: 'Aprovador 1',
    email: 'aprovador1@ifpr.edu.br',
    senha: 'aprovador123',
    perfil: 'APROVADOR',
  });

  const aprovador2 = await criarUsuarioSeNaoExiste({
    nome: 'Aprovador 2',
    email: 'aprovador2@ifpr.edu.br',
    senha: 'aprovador123',
    perfil: 'APROVADOR',
  });

  const setor1 = await criarSetorSeNaoExiste(
    'Setor 1',
    'Setor de teste 1',
    aprovador1._id
  );

  const setor2 = await criarSetorSeNaoExiste(
    'Setor 2',
    'Setor de teste 2',
    aprovador2._id
  );

  await criarUsuarioSeNaoExiste({
    nome: 'Servidor 1',
    email: 'servidor1@ifpr.edu.br',
    senha: 'servidor123',
    perfil: 'SERVIDOR',
    setor: setor1._id,
  });

  await criarUsuarioSeNaoExiste({
    nome: 'Servidor 2',
    email: 'servidor2@ifpr.edu.br',
    senha: 'servidor123',
    perfil: 'SERVIDOR',
    setor: setor2._id,
  });

  console.log('Seed concluído!');
  process.exit(0);
};

seed().catch((err) => {
  console.error('Erro no seed:', err);
  process.exit(1);
});