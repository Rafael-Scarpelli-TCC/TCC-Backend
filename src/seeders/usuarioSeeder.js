import "dotenv/config";
import mongoose from "mongoose";
import Usuario from "../models/Usuario.js";

async function criarUsuariosIniciais() {
  const usuarios = [
    {
      nome: "Administrador",
      email: "admin",
      senha: "admin",
      identificacao: "ADMIN001",
      tipoUsuario: "ADMIN",
      perfil: "ADMIN",
    },
    {
      nome: "Usuário",
      email: "user",
      senha: "user",
      identificacao: "USER001",
      tipoUsuario: "USER",
      perfil: "USER",
    },
    {
      nome: "João Silva",
      email: "joao",
      senha: "user123",
      identificacao: "USER002",
      tipoUsuario: "USER",
      perfil: "USER",
    },
    {
      nome: "Maria Oliveira",
      email: "maria",
      senha: "user123",
      identificacao: "USER003",
      tipoUsuario: "USER",
      perfil: "USER",
    },
    {
      nome: "Pedro Santos",
      email: "pedro",
      senha: "user123",
      identificacao: "USER004",
      tipoUsuario: "USER",
      perfil: "USER",
    },
    {
      nome: "Ana Costa",
      email: "ana",
      senha: "user123",
      identificacao: "USER005",
      tipoUsuario: "USER",
      perfil: "USER",
    },
    {
      nome: "Lucas Ferreira",
      email: "lucas",
      senha: "user123",
      identificacao: "USER006",
      tipoUsuario: "USER",
      perfil: "USER",
    },
    {
      nome: "Beatriz Almeida",
      email: "beatriz",
      senha: "user123",
      identificacao: "USER007",
      tipoUsuario: "USER",
      perfil: "USER",
    },
    {
      nome: "Gabriel Souza",
      email: "gabriel",
      senha: "user123",
      identificacao: "USER008",
      tipoUsuario: "USER",
      perfil: "USER",
    },
    {
      nome: "Juliana Martins",
      email: "juliana",
      senha: "user123",
      identificacao: "USER009",
      tipoUsuario: "USER",
      perfil: "USER",
    },
    {
      nome: "Matheus Rodrigues",
      email: "matheus",
      senha: "user123",
      identificacao: "USER010",
      tipoUsuario: "USER",
      perfil: "USER",
    },
    {
      nome: "Camila Ribeiro",
      email: "camila",
      senha: "user123",
      identificacao: "USER011",
      tipoUsuario: "USER",
      perfil: "USER",
    },
  ];

  for (const usuario of usuarios) {
    const existe = await Usuario.findOne({
      email: usuario.email,
    });

    if (existe) {
      console.log(`Usuário ${usuario.email} já existe.`);
      continue;
    }

    await Usuario.create(usuario);

    console.log(`Usuário ${usuario.email} criado com sucesso!`);
  }
}

async function executarSeeder() {
  try {
    console.log("Iniciando seeder...");

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("Conectado ao MongoDB!");
    console.log("Banco:", mongoose.connection.name);
    console.log("Collection:", Usuario.collection.name);

    await criarUsuariosIniciais();

    const total = await Usuario.countDocuments();

    console.log("\nTotal de usuários:", total);
    console.log("Seeder executado com sucesso!");
  } catch (error) {
    console.error("Erro ao executar seeder:", error);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

executarSeeder();
