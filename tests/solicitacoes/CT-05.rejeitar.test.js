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

describe("CT-05 - Rejeitar solicitação PENDENTE (aprovador do setor)", () => {
  let setor, aprovador, solicitante, solicitacao;

  beforeAll(async () => {
    await conectarBancoDeTeste();
  });

  beforeEach(async () => {
    await limparBancoDeTeste();

    ({ setor, aprovador } = await criarSetorComAprovador());
    solicitante = await criarUsuario({ setor: setor._id });

    solicitacao = await Solicitacao.create({
      solicitante: solicitante._id,
      setor: setor._id,
      descricao: "Caneta esferográfica azul",
      quantidade: 5,
      valorUnitarioEstimado: 10,
      valorTotal: 50,
      grauPrioridade: "MEDIA",
    });
  });

  afterAll(async () => {
    await desconectarBancoDeTeste();
  });

  it.each([
    ["com comentário", "Item não prioritário neste ciclo."],
    ["sem comentário", undefined],
  ])("rejeita solicitação PENDENTE %s", async (_nome, comentario) => {
    const resposta = await request(app)
      .patch(`/api/solicitacoes/${solicitacao._id}/decisao`)
      .set("Authorization", `Bearer ${gerarToken(aprovador)}`)
      .send({ decisao: false, comentario });

    expect(resposta.status).toBe(200);
    expect(resposta.body.message).toBe("Solicitação atualizada com sucesso!");

    const salva = await Solicitacao.findById(solicitacao._id);
    expect(salva.status).toBe("REJEITADA");
    expect(salva.decisao).toBe(false);
    expect(salva.dataAprovacao).toBeInstanceOf(Date);
    expect(salva.comentario).toBe(comentario);

    const logs = await Log.find({ solicitacao: solicitacao._id });
    expect(logs).toHaveLength(1);
    expect(logs[0].acao).toBe("REJEICAO");
    expect(String(logs[0].usuario)).toBe(String(aprovador._id));
    expect(logs[0].comentario ?? "").toBe(comentario ?? "");
  });
});
