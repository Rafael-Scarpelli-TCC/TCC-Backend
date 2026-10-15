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

describe("EXTRA - ADMIN vê e decide solicitações de qualquer setor", () => {
  let setorX, setorY, admin, solicitacaoX;

  const novaSolicitacao = (solicitante, setor, descricao) =>
    Solicitacao.create({
      solicitante: solicitante._id,
      setor: setor._id,
      descricao,
      quantidade: 1,
      valorUnitarioEstimado: 10,
      valorTotal: 10,
      grauPrioridade: "MEDIA",
    });

  const tornarAprovador = async (setor, usuario) => {
    setor.aprovador = usuario._id;
    await setor.save();
  };

  const decidir = (usuario, decisao) =>
    request(app)
      .patch(`/api/solicitacoes/${solicitacaoX._id}/decisao`)
      .set("Authorization", `Bearer ${gerarToken(usuario)}`)
      .send({ decisao, comentario: "Decisão do ADMIN." });

  const listarAprovador = (usuario) =>
    request(app)
      .get("/api/solicitacoes/aprovador?status=PENDENTE")
      .set("Authorization", `Bearer ${gerarToken(usuario)}`);

  beforeAll(async () => {
    await conectarBancoDeTeste();
  });

  beforeEach(async () => {
    await limparBancoDeTeste();

    setorX = await criarSetor();
    setorY = await criarSetor();

    const solicitanteX = await criarUsuario({ setor: setorX._id });
    const solicitanteY = await criarUsuario({ setor: setorY._id });
    admin = await criarUsuario({ perfil: "ADMIN" });

    solicitacaoX = await novaSolicitacao(solicitanteX, setorX, "Item X1");
    await novaSolicitacao(solicitanteY, setorY, "Item Y1");
  });

  afterAll(async () => {
    await desconectarBancoDeTeste();
  });

  describe("decisão", () => {
    it.each([
      ["aprova", true, "APROVADA", "APROVACAO"],
      ["rejeita", false, "REJEITADA", "REJEICAO"],
    ])(
      "ADMIN sem setor aprovador %s solicitação de qualquer setor",
      async (_nome, decisao, statusFinal, acaoLog) => {
        const resposta = await decidir(admin, decisao);

        expect(resposta.status).toBe(200);
        expect((await Solicitacao.findById(solicitacaoX._id)).status).toBe(
          statusFinal,
        );

        const logs = await Log.find({ solicitacao: solicitacaoX._id });
        expect(logs).toHaveLength(1);
        expect(logs[0].acao).toBe(acaoLog);
        expect(String(logs[0].usuario)).toBe(String(admin._id));
      },
    );

    it("ADMIN que é aprovador do setor Y também decide solicitação do setor X", async () => {
      await tornarAprovador(setorY, admin);

      const resposta = await decidir(admin, true);

      expect(resposta.status).toBe(200);
      expect((await Solicitacao.findById(solicitacaoX._id)).status).toBe(
        "APROVADA",
      );
    });
  });

  describe("listagem", () => {
    it("ADMIN sem setor aprovador vê as pendentes de todos os setores na tela de Aprovações", async () => {
      const resposta = await listarAprovador(admin);

      expect(resposta.status).toBe(200);
      expect(resposta.body.total).toBe(2);

      const descricoes = resposta.body.solicitacoes
        .map((s) => s.descricao)
        .sort();
      expect(descricoes).toEqual(["Item X1", "Item Y1"]);
    });

    it("ADMIN que é aprovador do setor Y continua vendo as pendentes de todos os setores", async () => {
      await tornarAprovador(setorY, admin);

      const resposta = await listarAprovador(admin);

      expect(resposta.status).toBe(200);
      expect(resposta.body.total).toBe(2);

      const descricoes = resposta.body.solicitacoes
        .map((s) => s.descricao)
        .sort();
      expect(descricoes).toEqual(["Item X1", "Item Y1"]);
    });

    it("ADMIN vê todas as solicitações em Minhas Solicitações", async () => {
      const resposta = await request(app)
        .get("/api/solicitacoes")
        .set("Authorization", `Bearer ${gerarToken(admin)}`);

      expect(resposta.status).toBe(200);
      expect(resposta.body.total).toBe(2);
    });
  });
});
