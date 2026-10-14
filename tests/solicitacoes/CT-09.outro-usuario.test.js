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

describe("CT-09 - Usuário comum não edita nem cancela solicitação de outro", () => {
  let usuarioB, solicitacao, antes;

  beforeAll(async () => {
    await conectarBancoDeTeste();
  });

  beforeEach(async () => {
    await limparBancoDeTeste();

    const setor = await criarSetor();
    const usuarioA = await criarUsuario({ setor: setor._id });
    usuarioB = await criarUsuario({ setor: setor._id }); // mesmo setor, mas não é aprovador nem ADMIN

    solicitacao = await Solicitacao.create({
      solicitante: usuarioA._id,
      setor: setor._id,
      descricao: "Caneta esferográfica azul",
      quantidade: 5,
      valorUnitarioEstimado: 10,
      valorTotal: 50,
      grauPrioridade: "MEDIA",
      justificativa: "Justificativa original.",
    });

    antes = await Solicitacao.findById(solicitacao._id).lean();
  });

  afterAll(async () => {
    await desconectarBancoDeTeste();
  });

  it("B tenta editar a solicitação de A: 403, sem alteração e sem log", async () => {
    const resposta = await request(app)
      .patch(`/api/solicitacoes/${solicitacao._id}/editar`)
      .set("Authorization", `Bearer ${gerarToken(usuarioB)}`)
      .send({
        quantidade: 99,
        grauPrioridade: "ALTA",
        justificativa: "Indevida.",
      });

    expect(resposta.status).toBe(403);
    expect(await Solicitacao.findById(solicitacao._id).lean()).toEqual(antes);
    expect(await Log.countDocuments()).toBe(0);
  });

  it("B tenta cancelar a solicitação de A: 4xx, sem alteração e sem log", async () => {
    const resposta = await request(app)
      .patch(`/api/solicitacoes/${solicitacao._id}/cancelar`)
      .set("Authorization", `Bearer ${gerarToken(usuarioB)}`);

    expect(resposta.status).toBeGreaterThanOrEqual(400);
    expect(resposta.status).toBeLessThan(500);
    expect(await Solicitacao.findById(solicitacao._id).lean()).toEqual(antes);
    expect(await Log.countDocuments()).toBe(0);
  });
});
