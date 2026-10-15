import http from "k6/http";
import { check, sleep } from "k6";
import { Counter } from "k6/metrics";

// CT-16 - Teste de carga: POST /api/solicitacoes (seção 3.6 do plano)
//
// Parâmetros (opcionais), passados com -e NOME=valor:
//   SERVIDORES  número de servidores do campus (define até que patamar valem os critérios). Padrão: 50
//   DURACAO_S   duração de cada patamar, em segundos. Padrão: 120 (plano: 2 a 3 minutos)
//   AQUEC_S     duração do aquecimento, em segundos. Padrão: 30

const seed = JSON.parse(open("./seed.json"));

const SERVIDORES = Number(__ENV.SERVIDORES || 50);
const DURACAO_S = Number(__ENV.DURACAO_S || 120);
const AQUEC_S = Number(__ENV.AQUEC_S || 30);

const PATAMARES = [10, 50, 200];

// Conta cada resposta 201, para comparar com as solicitações gravadas no banco.
const solicitacoesCriadas = new Counter("solicitacoes_criadas");

// Só 201 é resposta esperada; qualquer outro status ou timeout conta como erro.
http.setResponseCallback(http.expectedStatuses(201));

// Cenários em sequência: aquecimento + um por patamar de usuários virtuais.
const scenarios = {
  aquecimento: {
    executor: "constant-vus",
    vus: 5,
    duration: `${AQUEC_S}s`,
    startTime: "0s",
  },
};

PATAMARES.forEach((vus, i) => {
  scenarios[`patamar_${vus}`] = {
    executor: "constant-vus",
    vus,
    duration: `${DURACAO_S}s`,
    startTime: `${AQUEC_S + i * DURACAO_S}s`,
  };
});

// Critérios do plano (p95 <= 2 s e erro < 1%) valem até o patamar equivalente
const thresholds = {};
PATAMARES.forEach((vus) => {
  const tag = `{scenario:patamar_${vus}}`;
  if (vus <= SERVIDORES) {
    thresholds[`http_req_duration${tag}`] = ["p(95)<2000"];
    thresholds[`http_req_failed${tag}`] = ["rate<0.01"];
  } else {
    thresholds[`http_req_duration${tag}`] = ["max>=0"];
    thresholds[`http_req_failed${tag}`] = ["rate>=0"];
  }
  thresholds[`http_reqs${tag}`] = ["count>=0"];
});

export const options = { scenarios, thresholds };

const PRIORIDADES = ["BAIXA", "MEDIA", "ALTA"];
const escolher = (lista) => lista[Math.floor(Math.random() * lista.length)];
const quantidadeAleatoria = () => 1 + Math.floor(Math.random() * 20);

function corpoItemExistente(solicitante) {
  return {
    itemCompraId: escolher(seed.itens).id,
    quantidade: quantidadeAleatoria(),
    grauPrioridade: escolher(PRIORIDADES),
    dataDesejadaAquisicao: "2026-12-01",
    temVinculacao: false,
    justificativa: "Solicitação gerada pelo teste de carga.",
    nomeInteressado: solicitante.nome,
    email: solicitante.email,
  };
}

function corpoItemNovo(solicitante) {
  return {
    descricao: `Item novo do teste de carga VU${__VU}-${__ITER}`,
    descricaoSucinta: "Item novo (carga)",
    unidadeFornecimento: "UN",
    valorUnitarioEstimado: 15.5,
    quantidade: quantidadeAleatoria(),
    categoriaId: seed.categoriaId,
    grauPrioridade: escolher(PRIORIDADES),
    dataDesejadaAquisicao: "2026-12-01",
    temVinculacao: false,
    justificativa: "Solicitação gerada pelo teste de carga.",
    nomeInteressado: solicitante.nome,
    email: solicitante.email,
  };
}

export default function () {
  const solicitante = seed.solicitantes[__VU % seed.solicitantes.length];
  const itemNovo = Math.random() < 0.5;
  const corpo = itemNovo
    ? corpoItemNovo(solicitante)
    : corpoItemExistente(solicitante);

  const resposta = http.post(
    `${seed.baseUrl}/api/solicitacoes`,
    JSON.stringify(corpo),
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${solicitante.token}`,
      },
      tags: { tipo: itemNovo ? "item_novo" : "item_existente" },
    },
  );

  const ok = check(resposta, {
    "status 201": (r) => r.status === 201,
    "solicitação PENDENTE": (r) =>
      r.status === 201 && r.json("solicitacao.status") === "PENDENTE",
  });

  if (resposta.status === 201) solicitacoesCriadas.add(1);

  // Intervalo de 1 s entre requisições de cada usuário virtual (premissa do teste).
  sleep(1);

  return ok;
}
