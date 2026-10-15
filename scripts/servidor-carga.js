import fs from "node:fs";
import http from "node:http";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "segredo-somente-para-testes";
delete process.env.MONGODB_URI;
delete process.env.FRONTEND_URL;

const { default: app } = await import("../src/app.js");
const { default: Solicitacao } = await import("../src/models/Solicitacao.js");
const { default: Log } = await import("../src/models/Log.js");
const { default: Categoria } = await import("../src/models/Categoria.js");
const factories = await import("../tests/helpers/factories.js");

const PORTA_API = 3100;
const PORTA_INTEGRIDADE = 3101;

const mongod = await MongoMemoryServer.create();
await mongoose.connect(mongod.getUri(), { dbName: "pca_carga" });
console.log("Banco temporário iniciado.");

const setorX = await factories.criarSetor({ nome: "Setor X" });
const setorY = await factories.criarSetor({ nome: "Setor Y" });

const userA = await factories.criarUsuario({
  nome: "USER A",
  setor: setorX._id,
});
const userB = await factories.criarUsuario({
  nome: "USER B",
  setor: setorY._id,
});
const aprovadorX = await factories.criarUsuario({
  nome: "Aprovador X",
  setor: setorX._id,
});
const aprovadorY = await factories.criarUsuario({
  nome: "Aprovador Y",
  setor: setorY._id,
});
await factories.criarUsuario({ nome: "ADMIN", perfil: "ADMIN" });

setorX.aprovador = aprovadorX._id;
await setorX.save();
setorY.aprovador = aprovadorY._id;
await setorY.save();

const categoria = await Categoria.create({ nome: "Material de Consumo" });
const planilha = await factories.criarPlanilha();

const itens = [];
for (let i = 1; i <= 10; i++) {
  const item = await factories.criarItem(planilha, {
    ordem: String(i),
    descricao: `Item de teste ${i}`,
    valorUnitarioEstimado: 10 + i,
  });
  itens.push({ id: String(item._id) });
}

const gerarToken = (usuario) =>
  jwt.sign(
    { id: usuario._id, perfil: usuario.perfil },
    process.env.JWT_SECRET,
    {
      expiresIn: "4h",
    },
  );

const solicitantes = [userA, userB].map((u) => ({
  nome: u.nome,
  email: u.email,
  token: gerarToken(u),
}));

fs.mkdirSync("carga", { recursive: true });
fs.writeFileSync(
  "carga/seed.json",
  JSON.stringify(
    {
      baseUrl: `http://localhost:${PORTA_API}`,
      categoriaId: String(categoria._id),
      solicitantes,
      itens,
    },
    null,
    2,
  ),
);
console.log("Seed criado em carga/seed.json");

app.listen(PORTA_API, () => {
  console.log(`API de teste em http://localhost:${PORTA_API}`);
});

http
  .createServer(async (req, res) => {
    if (req.url !== "/integridade") {
      res.writeHead(404);
      return res.end();
    }

    const solicitacoes = await Solicitacao.countDocuments();
    const logsCriacao = await Log.countDocuments({ acao: "CRIACAO" });
    const idsComLog = await Log.distinct("solicitacao", { acao: "CRIACAO" });
    const solicitacoesSemLog = await Solicitacao.countDocuments({
      _id: { $nin: idsComLog },
    });

    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(
      JSON.stringify(
        { solicitacoes, logsCriacao, solicitacoesSemLog },
        null,
        2,
      ),
    );
  })
  .listen(PORTA_INTEGRIDADE, () => {
    console.log(
      `Integridade em http://localhost:${PORTA_INTEGRIDADE}/integridade`,
    );
    console.log(
      "Pronto. Deixe este terminal aberto; Ctrl+C encerra e apaga o banco temporário.",
    );
  });

process.on("SIGINT", async () => {
  await mongoose.disconnect();
  await mongod.stop();
  process.exit(0);
});
