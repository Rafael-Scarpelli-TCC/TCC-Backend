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

const estadosFinais = {
  APROVADA: { decisao: true },
  REJEITADA: { decisao: false },
  CANCELADA: {},
};

// Cada ação indica quem a executa, a rota e o corpo enviado.
const acoes = {
  aprovar: {
    quem: "aprovador",
    rota: "decisao",
    corpo: { decisao: true, comentario: "Tentativa" },
  },
  rejeitar: {
    quem: "aprovador",
    rota: "decisao",
    corpo: { decisao: false, comentario: "Tentativa" },
  },
  cancelar: { quem: "solicitante", rota: "cancelar", corpo: {} },
  editar: {
    quem: "solicitante",
    rota: "editar",
    corpo: {
      quantidade: 99,
      grauPrioridade: "ALTA",
      justificativa: "Tentativa de edição.",
    },
  },
};

const combinacoes = Object.keys(estadosFinais).flatMap((estado) =>
  Object.keys(acoes).map((acao) => [estado, acao]),
);

describe("CT-08 - Estados finais não aceitam nenhuma ação (12 combinações)", () => {
  let setor, aprovador, solicitante;

  beforeAll(async () => {
    await conectarBancoDeTeste();
  });

  beforeEach(async () => {
    await limparBancoDeTeste();
    ({ setor, aprovador } = await criarSetorComAprovador());
    solicitante = await criarUsuario({ setor: setor._id });
  });

  afterAll(async () => {
    await desconectarBancoDeTeste();
  });

  it.each(combinacoes)(
    'solicitação %s: ação "%s" é bloqueada',
    async (estado, nomeAcao) => {
      const solicitacao = await Solicitacao.create({
        solicitante: solicitante._id,
        setor: setor._id,
        descricao: "Caneta esferográfica azul",
        quantidade: 5,
        valorUnitarioEstimado: 10,
        valorTotal: 50,
        grauPrioridade: "MEDIA",
        justificativa: "Justificativa original.",
        status: estado,
        ...estadosFinais[estado],
      });

      const antes = await Solicitacao.findById(solicitacao._id).lean();

      const { quem, rota, corpo } = acoes[nomeAcao];
      const usuarioDaAcao = quem === "aprovador" ? aprovador : solicitante;

      const resposta = await request(app)
        .patch(`/api/solicitacoes/${solicitacao._id}/${rota}`)
        .set("Authorization", `Bearer ${gerarToken(usuarioDaAcao)}`)
        .send(corpo);

      expect(resposta.status).toBeGreaterThanOrEqual(400);
      expect(resposta.status).toBeLessThan(500);

      const depois = await Solicitacao.findById(solicitacao._id).lean();
      expect(depois).toEqual(antes);

      expect(await Log.countDocuments({ solicitacao: solicitacao._id })).toBe(
        0,
      );
    },
  );
});
