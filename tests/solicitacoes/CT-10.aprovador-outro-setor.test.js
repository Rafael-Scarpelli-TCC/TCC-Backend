import request from "supertest";

import app from "../../src/app.js";
import Solicitacao from "../../src/models/Solicitacao.js";
import Log from "../../src/models/Log.js";

import {
  conectarBancoDeTeste,
  limparBancoDeTeste,
  desconectarBancoDeTeste,
} from "../helpers/db.js";

import {
  criarUsuario,
  criarSetorComAprovador,
  gerarToken,
} from "../helpers/factories.js";

describe("CT-10 - Aprovador não decide solicitação de outro setor", () => {
  let aprovadorY, solicitacao, antes;

  beforeAll(async () => {
    await conectarBancoDeTeste();
  });

  beforeEach(async () => {
    await limparBancoDeTeste();

    const { setor: setorX } = await criarSetorComAprovador();
    ({ aprovador: aprovadorY } = await criarSetorComAprovador());
    const solicitante = await criarUsuario({ setor: setorX._id });

    solicitacao = await Solicitacao.create({
      solicitante: solicitante._id,
      setor: setorX._id,
      descricao: "Caneta esferográfica azul",
      quantidade: 5,
      valorUnitarioEstimado: 10,
      valorTotal: 50,
      grauPrioridade: "MEDIA",
    });

    antes = await Solicitacao.findById(solicitacao._id).lean();
  });

  afterAll(async () => {
    await desconectarBancoDeTeste();
  });

  it.each([
    ["aprovar", true],
    ["rejeitar", false],
  ])(
    "aprovador do setor Y tenta %s solicitação do setor X: 403, sem alteração e sem log",
    async (_nome, decisao) => {
      const resposta = await request(app)
        .patch(`/api/solicitacoes/${solicitacao._id}/decisao`)
        .set("Authorization", `Bearer ${gerarToken(aprovadorY)}`)
        .send({ decisao, comentario: "Tentativa indevida." });

      expect(resposta.status).toBe(403);
      expect(await Solicitacao.findById(solicitacao._id).lean()).toEqual(antes);
      expect(await Log.countDocuments()).toBe(0);
    },
  );
});
