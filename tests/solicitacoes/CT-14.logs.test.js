import request from "supertest";

import app from "../../src/app.js";
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

describe("CT-14 - Um log por ação, com tipo, usuário e solicitação corretos", () => {
  let aprovador, solicitante;
  let idS1, idS2, idS3;

  const auth = (usuario) => `Bearer ${gerarToken(usuario)}`;

  // Executa uma ação e confere que gerou exatamente um log novo, correto.
  // Para criação, o id da solicitação vem da resposta (idSolicitacao = undefined).
  async function executar(
    requisicao,
    statusEsperado,
    acao,
    usuario,
    idSolicitacao,
  ) {
    const antes = await Log.countDocuments();

    const resposta = await requisicao();
    expect(resposta.status).toBe(statusEsperado);

    expect(await Log.countDocuments()).toBe(antes + 1);

    const ultimo = await Log.findOne().sort({ _id: -1 });
    const id = idSolicitacao ?? resposta.body.solicitacao._id;

    expect(ultimo.acao).toBe(acao);
    expect(String(ultimo.usuario)).toBe(String(usuario._id));
    expect(String(ultimo.solicitacao)).toBe(String(id));

    return id;
  }

  const criar = () =>
    request(app)
      .post("/api/solicitacoes")
      .set("Authorization", auth(solicitante))
      .send({
        descricao: "Caneta esferográfica azul",
        quantidade: 2,
        valorUnitarioEstimado: 10,
        grauPrioridade: "MEDIA",
        justificativa: "Teste de logs.",
      });

  beforeAll(async () => {
    await conectarBancoDeTeste();
    await limparBancoDeTeste();

    const { setor, aprovador: ap } = await criarSetorComAprovador();
    aprovador = ap;
    solicitante = await criarUsuario({ setor: setor._id });
  });

  afterAll(async () => {
    await desconectarBancoDeTeste();
  });

  it("criação gera um log CRIACAO do solicitante", async () => {
    idS1 = await executar(criar, 201, "CRIACAO", solicitante);
  });

  it("edição gera um log EDICAO do solicitante", async () => {
    await executar(
      () =>
        request(app)
          .patch(`/api/solicitacoes/${idS1}/editar`)
          .set("Authorization", auth(solicitante))
          .send({ quantidade: 4, grauPrioridade: "ALTA" }),
      200,
      "EDICAO",
      solicitante,
      idS1,
    );
  });

  it("aprovação gera um log APROVACAO do aprovador", async () => {
    await executar(
      () =>
        request(app)
          .patch(`/api/solicitacoes/${idS1}/decisao`)
          .set("Authorization", auth(aprovador))
          .send({ decisao: true, comentario: "Aprovado." }),
      200,
      "APROVACAO",
      aprovador,
      idS1,
    );
  });

  it("rejeição gera um log REJEICAO do aprovador", async () => {
    idS2 = await executar(criar, 201, "CRIACAO", solicitante);

    await executar(
      () =>
        request(app)
          .patch(`/api/solicitacoes/${idS2}/decisao`)
          .set("Authorization", auth(aprovador))
          .send({ decisao: false, comentario: "Rejeitado." }),
      200,
      "REJEICAO",
      aprovador,
      idS2,
    );
  });

  it("cancelamento gera um log CANCELAMENTO do solicitante", async () => {
    idS3 = await executar(criar, 201, "CRIACAO", solicitante);

    await executar(
      () =>
        request(app)
          .patch(`/api/solicitacoes/${idS3}/cancelar`)
          .set("Authorization", auth(solicitante)),
      200,
      "CANCELAMENTO",
      solicitante,
      idS3,
    );
  });

  it("o histórico final tem 7 logs, na sequência correta por solicitação", async () => {
    expect(await Log.countDocuments()).toBe(7);

    const acoesDe = async (id) =>
      (await Log.find({ solicitacao: id }).sort({ _id: 1 })).map((l) => l.acao);

    expect(await acoesDe(idS1)).toEqual(["CRIACAO", "EDICAO", "APROVACAO"]);
    expect(await acoesDe(idS2)).toEqual(["CRIACAO", "REJEICAO"]);
    expect(await acoesDe(idS3)).toEqual(["CRIACAO", "CANCELAMENTO"]);
  });
});
