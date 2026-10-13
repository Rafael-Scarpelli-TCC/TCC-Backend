import request from "supertest";

import app from "../../src/app.js";
import Solicitacao from "../../src/models/Solicitacao.js";
import Categoria from "../../src/models/Categoria.js";
import Log from "../../src/models/Log.js";

import {
  conectarBancoDeTeste,
  limparBancoDeTeste,
  desconectarBancoDeTeste,
} from "../helpers/db.js";

import { criarSetor, criarUsuario, gerarToken } from "../helpers/factories.js";

describe("CT-02 - Criar solicitação de item novo (dados manuais)", () => {
  let setor, usuario, categoria;
  let resposta, solicitacaoSalva, logs;

  const dadosItem = {
    descricao: "Caneta esferográfica azul, caixa com 50 unidades",
    descricaoSucinta: "Caneta azul",
    unidadeFornecimento: "CAIXA",
    valorUnitarioEstimado: 19.9,
    codigoSIPAC: "654321",
    subitem: "339030",
    codigoCATService: "4321",
  };
  const quantidade = 3;

  beforeAll(async () => {
    await conectarBancoDeTeste();
    await limparBancoDeTeste();

    setor = await criarSetor();
    usuario = await criarUsuario({ setor: setor._id });
    categoria = await Categoria.create({ nome: "Material de Expediente" });

    resposta = await request(app)
      .post("/api/solicitacoes")
      .set("Authorization", `Bearer ${gerarToken(usuario)}`)
      .send({
        ...dadosItem,
        quantidade,
        categoriaId: categoria._id.toString(),
        grauPrioridade: "MEDIA",
        dataDesejadaAquisicao: "2026-11-15",
        temVinculacao: false,
        justificativa: "Item não consta na planilha padrão.",
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

  it("persiste uma solicitação PENDENTE marcada como item novo, sem vínculo com item da planilha", async () => {
    expect(await Solicitacao.countDocuments()).toBe(1);
    expect(solicitacaoSalva.status).toBe("PENDENTE");
    expect(solicitacaoSalva.itemNovo).toBe(true);
    expect(solicitacaoSalva.itemCompra).toBeNull();
  });

  it("persiste os dados do item informados manualmente", () => {
    expect(solicitacaoSalva.descricao).toBe(dadosItem.descricao);
    expect(solicitacaoSalva.descricaoSucinta).toBe(dadosItem.descricaoSucinta);
    expect(solicitacaoSalva.unidadeFornecimento).toBe(
      dadosItem.unidadeFornecimento,
    );
    expect(solicitacaoSalva.valorUnitarioEstimado).toBe(
      dadosItem.valorUnitarioEstimado,
    );
    expect(solicitacaoSalva.codigoSIPAC).toBe(dadosItem.codigoSIPAC);
    expect(solicitacaoSalva.subitem).toBe(dadosItem.subitem);
    expect(solicitacaoSalva.codigoCATService).toBe(dadosItem.codigoCATService);
  });

  it("vincula solicitante, setor e categoria", () => {
    expect(String(solicitacaoSalva.solicitante)).toBe(String(usuario._id));
    expect(String(solicitacaoSalva.setor)).toBe(String(setor._id));
    expect(String(solicitacaoSalva.categoria)).toBe(String(categoria._id));
  });

  it("calcula o valor total no servidor (3 x 19,90 = 59,70)", () => {
    expect(solicitacaoSalva.quantidade).toBe(quantidade);
    expect(solicitacaoSalva.valorTotal).toBe(59.7);
  });

  it("registra um log de CRIACAO associado ao solicitante", () => {
    expect(logs).toHaveLength(1);
    expect(logs[0].acao).toBe("CRIACAO");
    expect(String(logs[0].usuario)).toBe(String(usuario._id));
  });
});
