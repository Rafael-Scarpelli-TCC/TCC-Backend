import request from "supertest";

import app from "../../src/app.js";
import Solicitacao from "../../src/models/Solicitacao.js";
import Log from "../../src/models/Log.js";

import {
  conectarBancoDeTeste,
  limparBancoDeTeste,
  desconectarBancoDeTeste,
} from "../helpers/db.js";

import { criarSetor, criarUsuario, gerarToken } from "../helpers/factories.js";

describe("CT-03 - Rejeitar criação com dados inválidos", () => {
  let token;

  const corpoValido = {
    descricao: "Caneta esferográfica azul",
    descricaoSucinta: "Caneta azul",
    unidadeFornecimento: "CAIXA",
    valorUnitarioEstimado: 10,
    quantidade: 5,
    grauPrioridade: "MEDIA",
    justificativa: "Teste de validação.",
  };

  const casos = [
    ["sem descrição", { descricao: undefined }],
    ["sem quantidade", { quantidade: undefined }],
    ["quantidade igual a zero", { quantidade: 0 }],
    ["quantidade negativa", { quantidade: -3 }],
    ["quantidade não numérica", { quantidade: "abc" }],
  ];

  beforeAll(async () => {
    await conectarBancoDeTeste();
  });

  beforeEach(async () => {
    await limparBancoDeTeste();
    const setor = await criarSetor();
    const usuario = await criarUsuario({ setor: setor._id });
    token = gerarToken(usuario);
  });

  afterAll(async () => {
    await desconectarBancoDeTeste();
  });

  it.each(casos)(
    "rejeita com 400 e não cria solicitação nem log: %s",
    async (_nome, alteracao) => {
      const resposta = await request(app)
        .post("/api/solicitacoes")
        .set("Authorization", `Bearer ${token}`)
        .send({ ...corpoValido, ...alteracao });

      expect(resposta.status).toBe(400);
      expect(resposta.body.message).toBeDefined();
      expect(await Solicitacao.countDocuments()).toBe(0);
      expect(await Log.countDocuments()).toBe(0);
    },
  );
});
