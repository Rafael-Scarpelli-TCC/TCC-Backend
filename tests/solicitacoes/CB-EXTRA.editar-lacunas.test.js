import request from "supertest";
import mongoose from "mongoose";
import { jest } from "@jest/globals";

import app from "../../src/app.js";
import Solicitacao from "../../src/models/Solicitacao.js";
import Log from "../../src/models/Log.js";

import {
  conectarBancoDeTeste,
  limparBancoDeTeste,
  desconectarBancoDeTeste,
} from "../helpers/db.js";

import { criarSetor, criarUsuario, gerarToken } from "../helpers/factories.js";

describe("CB-EXTRA - lacunas de cobertura em editarSolicitacao (complementar ao plano)", () => {
  let solicitante, solicitacao;

  const editar = (id, corpo) =>
    request(app)
      .patch(`/api/solicitacoes/${id}/editar`)
      .set("Authorization", `Bearer ${gerarToken(solicitante)}`)
      .send(corpo);

  beforeAll(async () => {
    await conectarBancoDeTeste();
  });

  beforeEach(async () => {
    await limparBancoDeTeste();

    const setor = await criarSetor();
    solicitante = await criarUsuario({ setor: setor._id });

    solicitacao = await Solicitacao.create({
      solicitante: solicitante._id,
      setor: setor._id,
      descricao: "Caneta esferográfica azul",
      quantidade: 5,
      valorUnitarioEstimado: 10,
      valorTotal: 50,
      grauPrioridade: "MEDIA",
      justificativa: "Justificativa original.",
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await desconectarBancoDeTeste();
  });

  it("solicitação inexistente retorna 404 e não gera log", async () => {
    const idInexistente = new mongoose.Types.ObjectId();

    const resposta = await editar(idInexistente, { quantidade: 2 });

    expect(resposta.status).toBe(404);
    expect(await Log.countDocuments()).toBe(0);
  });

  it("altera a data desejada de aquisição", async () => {
    const resposta = await editar(solicitacao._id, {
      dataDesejadaAquisicao: "2026-12-20",
    });

    expect(resposta.status).toBe(200);

    const salva = await Solicitacao.findById(solicitacao._id);
    expect(salva.dataDesejadaAquisicao.toISOString().slice(0, 10)).toBe(
      "2026-12-20",
    );
  });

  it("altera a observação", async () => {
    const resposta = await editar(solicitacao._id, {
      observacao: "Observação do solicitante.",
    });

    expect(resposta.status).toBe(200);

    const salva = await Solicitacao.findById(solicitacao._id);
    expect(salva.observacao).toBe("Observação do solicitante.");
  });

  it("id inválido provoca erro interno (500) e não gera log", async () => {
    // silencia o console.error do controlador durante este teste
    jest.spyOn(console, "error").mockImplementation(() => {});

    const resposta = await editar("id-invalido", { quantidade: 2 });

    expect(resposta.status).toBe(500);
    expect(resposta.body.message).toBeDefined();
    expect(await Log.countDocuments()).toBe(0);
  });
});
