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

describe("CT-06 - Solicitante cancela sua solicitação PENDENTE", () => {
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
    });
  });

  afterAll(async () => {
    await desconectarBancoDeTeste();
  });

  it("cancela a solicitação, muda o status para CANCELADA e registra o log", async () => {
    const resposta = await request(app)
      .patch(`/api/solicitacoes/${solicitacao._id}/cancelar`)
      .set("Authorization", `Bearer ${gerarToken(solicitante)}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body.message).toBe("Solicitação cancelada com sucesso!");

    const salva = await Solicitacao.findById(solicitacao._id);
    expect(salva.status).toBe("CANCELADA");
    expect(salva.dataAtualizacao).toBeInstanceOf(Date);

    const logs = await Log.find({ solicitacao: solicitacao._id });
    expect(logs).toHaveLength(1);
    expect(logs[0].acao).toBe("CANCELAMENTO");
    expect(String(logs[0].usuario)).toBe(String(solicitante._id));
  });
});
