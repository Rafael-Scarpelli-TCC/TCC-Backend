import request from "supertest";

import app from "../../src/app.js";
import Solicitacao from "../../src/models/Solicitacao.js";

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

describe("CT-12 - Aprovador lista somente as pendentes do seu setor", () => {
  let setorX, aprovadorX;

  const novaSolicitacao = (solicitante, setor, descricao, extra = {}) =>
    Solicitacao.create({
      solicitante: solicitante._id,
      setor: setor._id,
      descricao,
      quantidade: 1,
      valorUnitarioEstimado: 10,
      valorTotal: 10,
      grauPrioridade: "MEDIA",
      ...extra,
    });

  beforeAll(async () => {
    await conectarBancoDeTeste();
  });

  beforeEach(async () => {
    await limparBancoDeTeste();

    ({ setor: setorX, aprovador: aprovadorX } = await criarSetorComAprovador());
    const { setor: setorY } = await criarSetorComAprovador();

    const solicitanteX = await criarUsuario({ setor: setorX._id });
    const solicitanteY = await criarUsuario({ setor: setorY._id });

    await novaSolicitacao(solicitanteX, setorX, "Item X1");
    await novaSolicitacao(solicitanteX, setorX, "Item X2");
    await novaSolicitacao(solicitanteX, setorX, "Item X aprovado", {
      status: "APROVADA",
    });
    await novaSolicitacao(solicitanteY, setorY, "Item Y1");
  });

  afterAll(async () => {
    await desconectarBancoDeTeste();
  });

  it("retorna somente as solicitações PENDENTES do setor X", async () => {
    const resposta = await request(app)
      .get("/api/solicitacoes/aprovador?status=PENDENTE")
      .set("Authorization", `Bearer ${gerarToken(aprovadorX)}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body.total).toBe(2);

    const descricoes = resposta.body.solicitacoes
      .map((s) => s.descricao)
      .sort();
    expect(descricoes).toEqual(["Item X1", "Item X2"]);

    for (const s of resposta.body.solicitacoes) {
      expect(String(s.setor._id)).toBe(String(setorX._id));
      expect(s.status).toBe("PENDENTE");
    }
  });
});
