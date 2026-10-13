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
  criarSetor,
  criarUsuario,
  criarPlanilha,
  criarItem,
  gerarToken,
} from "../helpers/factories.js";

describe("CT-01 - Criar solicitação de item existente na planilha", () => {
  let setor, usuario, item;
  let resposta, solicitacaoSalva, logs;

  const quantidade = 10;

  beforeAll(async () => {
    await conectarBancoDeTeste();
    await limparBancoDeTeste();

    setor = await criarSetor();
    usuario = await criarUsuario({ setor: setor._id });
    const planilha = await criarPlanilha();
    item = await criarItem(planilha);

    resposta = await request(app)
      .post("/api/solicitacoes")
      .set("Authorization", `Bearer ${gerarToken(usuario)}`)
      .send({
        itemCompraId: item._id.toString(),
        quantidade,
        valorTotal: 1, // valor errado de propósito: o servidor deve ignorá-lo
        grauPrioridade: "ALTA",
        dataDesejadaAquisicao: "2026-12-01",
        temVinculacao: false,
        justificativa: "Reposição do estoque do setor.",
        nomeInteressado: usuario.nome,
        email: usuario.email,
      });

    solicitacaoSalva = await Solicitacao.findById(
      resposta.body.solicitacao?._id,
    );
    logs = await Log.find({ solicitacao: solicitacaoSalva?._id });
  });

  afterAll(async () => {
    await desconectarBancoDeTeste();
  });

  it("responde 201 com mensagem de sucesso", () => {
    expect(resposta.status).toBe(201);
    expect(resposta.body.message).toBe("Solicitação criada com sucesso!");
  });

  it("persiste exatamente uma solicitação com status inicial PENDENTE", async () => {
    expect(await Solicitacao.countDocuments()).toBe(1);
    expect(solicitacaoSalva).not.toBeNull();
    expect(solicitacaoSalva.status).toBe("PENDENTE");
    expect(solicitacaoSalva.itemNovo).toBe(false);
  });

  it("vincula solicitante, setor do solicitante e item da planilha", () => {
    expect(String(solicitacaoSalva.solicitante)).toBe(String(usuario._id));
    expect(String(solicitacaoSalva.setor)).toBe(String(setor._id));
    expect(String(solicitacaoSalva.itemCompra)).toBe(String(item._id));
  });

  it("copia os dados do item da planilha para a solicitação", () => {
    expect(solicitacaoSalva.descricao).toBe(item.descricao);
    expect(solicitacaoSalva.descricaoSucinta).toBe(item.descricaoSucinta);
    expect(solicitacaoSalva.codigoSIPAC).toBe(item.codigoSIPAC);
    expect(solicitacaoSalva.unidadeFornecimento).toBe(item.unidadeFornecimento);
    expect(solicitacaoSalva.valorUnitarioEstimado).toBe(
      item.valorUnitarioEstimado,
    );
  });

  it("calcula o valor total no servidor, ignorando o valor enviado pelo cliente", () => {
    expect(solicitacaoSalva.quantidade).toBe(quantidade);
    expect(solicitacaoSalva.valorTotal).toBe(
      quantidade * item.valorUnitarioEstimado,
    );
  });

  it("registra um log de CRIACAO associado ao solicitante", () => {
    expect(logs).toHaveLength(1);
    expect(logs[0].acao).toBe("CRIACAO");
    expect(String(logs[0].usuario)).toBe(String(usuario._id));
    expect(logs[0].comentario).toBe("Solicitação criada.");
  });
});
