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

describe("EXTRA - ADMIN decide solicitação de qualquer setor", () => {
  let solicitacao;

  beforeAll(async () => {
    await conectarBancoDeTeste();
  });

  beforeEach(async () => {
    await limparBancoDeTeste();

    const setorX = await criarSetor();
    const solicitante = await criarUsuario({ setor: setorX._id });

    solicitacao = await Solicitacao.create({
      solicitante: solicitante._id,
      setor: setorX._id,
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

  const decidir = (admin) =>
    request(app)
      .patch(`/api/solicitacoes/${solicitacao._id}/decisao`)
      .set("Authorization", `Bearer ${gerarToken(admin)}`)
      .send({ decisao: true, comentario: "Aprovado pelo ADMIN." });

  it("ADMIN sem setor aprovador aprova solicitação de qualquer setor", async () => {
    const admin = await criarUsuario({ perfil: "ADMIN" });

    const resposta = await decidir(admin);

    expect(resposta.status).toBe(200);
    expect((await Solicitacao.findById(solicitacao._id)).status).toBe(
      "APROVADA",
    );

    const logs = await Log.find({ solicitacao: solicitacao._id });
    expect(logs).toHaveLength(1);
    expect(logs[0].acao).toBe("APROVACAO");
    expect(String(logs[0].usuario)).toBe(String(admin._id));
  });

  it("ADMIN que é aprovador de outro setor também aprova solicitação do setor X", async () => {
    const admin = await criarUsuario({ perfil: "ADMIN" });
    await criarSetor({ aprovador: admin._id }); // admin aprova o setor Y

    const resposta = await decidir(admin);

    expect(resposta.status).toBe(200);
    expect((await Solicitacao.findById(solicitacao._id)).status).toBe(
      "APROVADA",
    );
  });
});
