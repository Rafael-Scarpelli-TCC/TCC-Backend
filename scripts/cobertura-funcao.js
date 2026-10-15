import fs from "node:fs";

const nomeFuncao = process.argv[2] || "editarSolicitacao";

const cobertura = JSON.parse(
  fs.readFileSync("coverage/coverage-final.json", "utf8"),
);
const caminho = Object.keys(cobertura).find((k) =>
  k.endsWith("SolicitacaoController.js"),
);

if (!caminho) {
  console.log(
    "SolicitacaoController.js não encontrado no relatório de cobertura.",
  );
  process.exit(1);
}

const dados = cobertura[caminho];
const fonte = fs.readFileSync(caminho, "utf8").split("\n");

const fn = Object.values(dados.fnMap).find((f) => f.name === nomeFuncao);

if (!fn) {
  console.log(`Função "${nomeFuncao}" não encontrada. Funções no relatório:`);
  console.log(Object.values(dados.fnMap).map((f) => f.name));
  process.exit(1);
}

const inicio = fn.loc.start.line;
const fim = fn.loc.end.line;

let total = 0;
let cobertos = 0;
const faltando = [];

for (const [id, ramo] of Object.entries(dados.branchMap)) {
  ramo.locations.forEach((local, i) => {
    const linha = local.start.line;
    if (linha < inicio || linha > fim) return;

    total++;
    if (dados.b[id][i] > 0) {
      cobertos++;
    } else {
      faltando.push({
        linha,
        tipo: ramo.type,
        trecho: fonte[linha - 1].trim(),
      });
    }
  });
}

const pct = total ? ((cobertos / total) * 100).toFixed(2) : "n/a";

console.log(`Função: ${nomeFuncao} (linhas ${inicio}-${fim})`);
console.log(`Ramos cobertos: ${cobertos}/${total} (${pct}%)`);
console.log("Ramos NÃO cobertos:");
if (faltando.length === 0) console.log("  nenhum");
faltando.forEach((f) =>
  console.log(`  linha ${f.linha} [${f.tipo}]: ${f.trecho}`),
);
