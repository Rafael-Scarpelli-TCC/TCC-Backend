import request from "supertest";

import app from "../../src/app.js";
import Solicitacao from "../../src/models/Solicitacao.js";

import {
  conectarBancoDeTeste,
  limparBancoDeTeste,
  desconectarBancoDeTeste,
} from "../helpers/db.js";

import { criarSetor, criarUsuario, gerarToken } from "../helpers/factories.js";

describe("CT-13 - Usuário comum lista somente as próprias solicitações", () => {
  let usuarioA, usuarioB;

  const novaSolicitacao = (usuario, setor, descricao) =>
    Solicitacao.create({
      solicitante: usuario._id,
      setor: setor._id,
      descricao,
      quantidade: 1,
      valorUnitarioEstimado: 10,
      valorTotal: 10,
      grauPrioridade: "MEDIA",
    });

  beforeAll(async () => {
    await conectarBancoDeTeste();
  });

  beforeEach(async () => {
    await limparBancoDeTeste();

    const setor = await criarSetor();
    usuarioA = await criarUsuario({ setor: setor._id });
    usuarioB = await criarUsuario({ setor: setor._id });

    await novaSolicitacao(usuarioA, setor, "Item A1");
    await novaSolicitacao(usuarioA, setor, "Item A2");
    await novaSolicitacao(usuarioB, setor, "Item B1");
  });

  afterAll(async () => {
    await desconectarBancoDeTeste();
  });

  it("USER A recebe somente as solicitações de A", async () => {
    const resposta = await request(app)
      .get("/api/solicitacoes")
      .set("Authorization", `Bearer ${gerarToken(usuarioA)}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body.total).toBe(2);
    for (const s of resposta.body.solicitacoes) {
      expect(String(s.solicitante._id)).toBe(String(usuarioA._id));
    }
  });

  it("USER B recebe somente as solicitações de B", async () => {
    const resposta = await request(app)
      .get("/api/solicitacoes")
      .set("Authorization", `Bearer ${gerarToken(usuarioB)}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body.total).toBe(1);
    expect(String(resposta.body.solicitacoes[0].solicitante._id)).toBe(
      String(usuarioB._id),
    );
  });
});
