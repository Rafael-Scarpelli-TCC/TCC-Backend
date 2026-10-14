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

describe("CT-11 - Usuário sem permissão de aprovação não decide", () => {
  let usuarioComum, solicitacao, antes;

  beforeAll(async () => {
    await conectarBancoDeTeste();
  });

  beforeEach(async () => {
    await limparBancoDeTeste();

    const setor = await criarSetor(); // setor sem aprovador
    const solicitante = await criarUsuario({ setor: setor._id });
    usuarioComum = await criarUsuario({ setor: setor._id }); // USER, não é aprovador nem ADMIN

    solicitacao = await Solicitacao.create({
      solicitante: solicitante._id,
      setor: setor._id,
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
    "usuário sem permissão tenta %s: 403, sem alteração e sem log",
    async (_nome, decisao) => {
      const resposta = await request(app)
        .patch(`/api/solicitacoes/${solicitacao._id}/decisao`)
        .set("Authorization", `Bearer ${gerarToken(usuarioComum)}`)
        .send({ decisao, comentario: "Tentativa indevida." });

      expect(resposta.status).toBe(403);
      expect(await Solicitacao.findById(solicitacao._id).lean()).toEqual(antes);
      expect(await Log.countDocuments()).toBe(0);
    },
  );
});
