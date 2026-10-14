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

describe("CB-01 a CB-06 - editarSolicitacao (caixa-branca)", () => {
  let setor, aprovador, solicitante, admin, outroUsuario, solicitacao;

  const editar = (usuario, corpo, id = solicitacao._id) =>
    request(app)
      .patch(`/api/solicitacoes/${id}/editar`)
      .set("Authorization", `Bearer ${gerarToken(usuario)}`)
      .send(corpo);

  const dadosBase = () => ({
    descricao: "Caneta esferográfica azul",
    quantidade: 5,
    valorUnitarioEstimado: 10,
    valorTotal: 50,
    grauPrioridade: "MEDIA",
    justificativa: "Justificativa original.",
  });

  beforeAll(async () => {
    await conectarBancoDeTeste();
  });

  beforeEach(async () => {
    await limparBancoDeTeste();

    ({ setor, aprovador } = await criarSetorComAprovador());
    solicitante = await criarUsuario({ setor: setor._id });
    outroUsuario = await criarUsuario({ setor: setor._id }); // USER, não é aprovador
    admin = await criarUsuario({ perfil: "ADMIN" });

    solicitacao = await Solicitacao.create({
      ...dadosBase(),
      solicitante: solicitante._id,
      setor: setor._id,
    });
  });

  afterAll(async () => {
    await desconectarBancoDeTeste();
  });

  it("CB-01: solicitante altera quantidade, prioridade e justificativa; total recalculado", async () => {
    const resposta = await editar(solicitante, {
      quantidade: 8,
      grauPrioridade: "ALTA",
      justificativa: "Nova justificativa.",
    });

    expect(resposta.status).toBe(200);

    const salva = await Solicitacao.findById(solicitacao._id);
    expect(salva.quantidade).toBe(8);
    expect(salva.grauPrioridade).toBe("ALTA");
    expect(salva.justificativa).toBe("Nova justificativa.");
    expect(salva.valorTotal).toBe(80);
  });

  it("CB-02: aprovador do setor altera quantidade e prioridade, mas não a justificativa", async () => {
    const resposta = await editar(aprovador, {
      quantidade: 8,
      grauPrioridade: "ALTA",
      justificativa: "Tentativa do aprovador.",
    });

    expect(resposta.status).toBe(200);

    const salva = await Solicitacao.findById(solicitacao._id);
    expect(salva.quantidade).toBe(8);
    expect(salva.grauPrioridade).toBe("ALTA");
    expect(salva.justificativa).toBe("Justificativa original.");
  });

  it("CB-03: ADMIN altera somente a justificativa", async () => {
    const resposta = await editar(admin, {
      justificativa: "Justificativa do ADMIN.",
    });

    expect(resposta.status).toBe(200);

    const salva = await Solicitacao.findById(solicitacao._id);
    expect(salva.justificativa).toBe("Justificativa do ADMIN.");
    expect(salva.quantidade).toBe(5);
    expect(salva.grauPrioridade).toBe("MEDIA");
    expect(salva.valorTotal).toBe(50);
  });

  it("CB-04: usuário sem permissão recebe 403 e nada é alterado", async () => {
    const antes = await Solicitacao.findById(solicitacao._id).lean();

    const resposta = await editar(outroUsuario, {
      quantidade: 8,
      grauPrioridade: "ALTA",
      justificativa: "Indevida.",
    });

    expect(resposta.status).toBe(403);
    expect(await Solicitacao.findById(solicitacao._id).lean()).toEqual(antes);
    expect(await Log.countDocuments()).toBe(0);
  });

  it("CB-05: edição de solicitação APROVADA é bloqueada com 400", async () => {
    const aprovada = await Solicitacao.create({
      ...dadosBase(),
      solicitante: solicitante._id,
      setor: setor._id,
      status: "APROVADA",
      decisao: true,
    });
    const antes = await Solicitacao.findById(aprovada._id).lean();

    const resposta = await editar(
      solicitante,
      { quantidade: 8, grauPrioridade: "ALTA", justificativa: "Indevida." },
      aprovada._id,
    );

    expect(resposta.status).toBe(400);
    expect(await Solicitacao.findById(aprovada._id).lean()).toEqual(antes);
    expect(await Log.countDocuments()).toBe(0);
  });

  it("CB-06: envio sem quantidade, prioridade ou justificativa não altera esses campos", async () => {
    const resposta = await editar(solicitante, {});

    expect(resposta.status).toBe(200);

    const salva = await Solicitacao.findById(solicitacao._id);
    expect(salva.quantidade).toBe(5);
    expect(salva.grauPrioridade).toBe("MEDIA");
    expect(salva.justificativa).toBe("Justificativa original.");
    expect(salva.valorTotal).toBe(50);
  });
});
