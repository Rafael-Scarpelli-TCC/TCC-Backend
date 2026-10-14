import jwt from "jsonwebtoken";

import Setor from "../../src/models/Setor.js";
import Usuario from "../../src/models/Usuario.js";
import PlanilhaCompras from "../../src/models/PlanilhaCompras.js";
import ItemCompra from "../../src/models/ItemCompra.js";

let contador = 0;
const proximo = () => ++contador;

export async function criarSetor(dados = {}) {
  return Setor.create({
    nome: `Setor Teste ${proximo()}`,
    ...dados,
  });
}

export async function criarUsuario(dados = {}) {
  const n = proximo();
  return Usuario.create({
    nome: `Usuário Teste ${n}`,
    email: `usuario${n}@teste.local`,
    senha: "senha-de-teste-123",
    identificacao: `TESTE${n}`,
    tipoUsuario: "SERVIDOR",
    perfil: "USER",
    ...dados,
  });
}

export async function criarPlanilha(dados = {}) {
  return PlanilhaCompras.create({
    nomeArquivo: "planilha-teste.xlsx",
    anoReferencia: 2026,
    ...dados,
  });
}

export async function criarItem(planilha, dados = {}) {
  return ItemCompra.create({
    planilha: planilha._id,
    ordem: "1",
    codigoSIPAC: "123456",
    subitem: "339030",
    codigoCATService: "7890",
    descricao: "Papel A4 75g/m2, caixa com 10 resmas",
    descricaoSucinta: "Papel A4",
    unidadeFornecimento: "CAIXA",
    valorUnitarioEstimado: 25.5,
    estimativaPreliminarValor: 255,
    grupoVinculado: "GRUPO-1",
    ...dados,
  });
}

export function gerarToken(usuario) {
  return jwt.sign(
    { id: usuario._id, perfil: usuario.perfil },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );
}

export async function criarSetorComAprovador() {
  const setor = await criarSetor();
  const aprovador = await criarUsuario({ setor: setor._id });
  setor.aprovador = aprovador._id;
  await setor.save();
  return { setor, aprovador };
}
