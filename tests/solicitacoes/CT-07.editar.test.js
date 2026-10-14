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

describe("CT-07 - Editar solicitação PENDENTE", () => {
  let solicitante, solicitacao;

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
      dataDesejadaAquisicao: new Date("2026-11-15"),
      justificativa: "Justificativa original.",
    });
  });

  afterAll(async () => {
    await desconectarBancoDeTeste();
  });

  it("altera quantidade, prioridade, data e justificativa, recalcula o total e registra o log", async () => {
    const resposta = await request(app)
      .patch(`/api/solicitacoes/${solicitacao._id}/editar`)
      .set("Authorization", `Bearer ${gerarToken(solicitante)}`)
      .send({
        quantidade: 8,
        grauPrioridade: "ALTA",
        dataDesejadaAquisicao: "2026-12-20",
        justificativa: "Justificativa atualizada.",
      });

    expect(resposta.status).toBe(200);
    expect(resposta.body.message).toBe("Solicitação atualizada com sucesso!");

    const salva = await Solicitacao.findById(solicitacao._id);
    expect(salva.quantidade).toBe(8);
    expect(salva.grauPrioridade).toBe("ALTA");
    expect(salva.dataDesejadaAquisicao.toISOString().slice(0, 10)).toBe(
      "2026-12-20",
    );
    expect(salva.justificativa).toBe("Justificativa atualizada.");

    // total recalculado: 8 x 10 = 80
    expect(salva.valorTotal).toBe(80);

    // o que não foi enviado permanece igual
    expect(salva.status).toBe("PENDENTE");
    expect(salva.descricao).toBe("Caneta esferográfica azul");
    expect(salva.valorUnitarioEstimado).toBe(10);

    const logs = await Log.find({ solicitacao: solicitacao._id });
    expect(logs).toHaveLength(1);
    expect(logs[0].acao).toBe("EDICAO");
    expect(String(logs[0].usuario)).toBe(String(solicitante._id));
  });
});
