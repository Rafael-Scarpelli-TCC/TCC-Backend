import "dotenv/config";
import mongoose from "mongoose";

import Solicitacao from "../models/Solicitacao.js";
import ItemCompra from "../models/ItemCompra.js";
import PlanilhaCompras from "../models/PlanilhaCompras.js";
import Usuario from "../models/Usuario.js";

const TOTAL_PADRAO = 10;
const TOTAL_OUTRAS_DEMANDAS = 10;

async function executarSeeder() {
  try {
    console.log("Iniciando seeder de solicitações...");

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("Conectado ao MongoDB!");
    console.log("Banco:", mongoose.connection.name);

    // Busca usuários para serem os solicitantes.
    const usuarios = await Usuario.find({});

    if (usuarios.length === 0) {
      throw new Error(
        "Nenhum usuário encontrado. Execute primeiro o seeder de usuários.",
      );
    }

    // Procura a planilha mais recente que tenha categoria e itens.
    const planilhas = await PlanilhaCompras.find({
      categoria: { $ne: null },
    }).sort({ dataImportacao: -1 });

    let planilhaSelecionada = null;
    let itensDisponiveis = [];

    for (const planilha of planilhas) {
      const itens = await ItemCompra.find({
        planilha: planilha._id,
      });

      if (itens.length > 0) {
        planilhaSelecionada = planilha;
        itensDisponiveis = itens;
        break;
      }
    }

    if (!planilhaSelecionada) {
      throw new Error(
        "Não foi encontrada uma planilha com categoria e itens importados. Importe uma planilha com categoria antes de executar o seeder.",
      );
    }

    console.log("Planilha selecionada:", planilhaSelecionada.nomeArquivo);
    console.log("Categoria:", planilhaSelecionada.categoria);
    console.log("Itens disponíveis:", itensDisponiveis.length);

    let criadasPadrao = 0;
    let criadasNovas = 0;

    // ==========================================
    // 1. SOLICITAÇÕES DE ITENS PADRÃO
    // ==========================================

    console.log("\nCriando solicitações de itens padrão...");

    for (let i = 0; i < TOTAL_PADRAO; i++) {
      const item = itensDisponiveis[i % itensDisponiveis.length];
      const usuario = usuarios[i % usuarios.length];

      const marcador = `SEEDER_PADRAO_${String(i + 1).padStart(3, "0")}`;

      const existe = await Solicitacao.findOne({
        observacao: marcador,
      });

      if (existe) {
        console.log(`Solicitação ${marcador} já existe.`);
        continue;
      }

      const quantidade = i + 1;
      const valorUnitario = Number(item.valorUnitarioEstimado) || 0;

      await Solicitacao.create({
        solicitante: usuario._id,
        setor: usuario.setor || null,

        itemCompra: item._id,
        categoria: planilhaSelecionada.categoria,

        ordem: item.ordem,
        codigoSIPAC: item.codigoSIPAC,
        subitem: item.subitem,
        codigoCATService: item.codigoCATService,
        descricao: item.descricao,
        descricaoSucinta: item.descricaoSucinta,
        unidadeFornecimento: item.unidadeFornecimento,
        valorUnitarioEstimado: valorUnitario,
        estimativaPreliminarValor: item.estimativaPreliminarValor || 0,
        grupoVinculado: item.grupoVinculado,

        quantidade,
        valorTotal: Math.round(quantidade * valorUnitario * 100) / 100,

        grauPrioridade: ["BAIXA", "MEDIA", "ALTA"][i % 3],
        dataDesejadaAquisicao: new Date("2027-06-30"),

        temVinculacao: false,
        justificativa: `Solicitação de teste para o item padrão ${item.descricao}.`,

        itemNovo: false,

        nomeInteressado: usuario.nome,
        email: usuario.email,

        status: "APROVADA",
        decisao: true,
        comentario: "Aprovada para testes do sistema.",
        dataAprovacao: new Date(),
        dataCriacao: new Date(),
        dataAtualizacao: new Date(),
        dataEnvio: new Date(),

        observacao: marcador,
      });

      criadasPadrao++;

      console.log(`Item padrão ${i + 1} criado.`);
    }

    // ==========================================
    // 2. SOLICITAÇÕES DE OUTRAS DEMANDAS
    // ==========================================

    console.log("\nCriando solicitações de outras demandas...");

    const outrasDemandas = [
      "Aquisição de materiais de escritório",
      "Contratação de serviço de manutenção",
      "Aquisição de equipamentos de informática",
      "Contratação de serviço de limpeza",
      "Aquisição de mobiliário",
      "Aquisição de materiais de consumo",
      "Contratação de serviço de instalação",
      "Aquisição de equipamentos de segurança",
      "Contratação de serviço de suporte técnico",
      "Aquisição de acessórios para computadores",
    ];

    for (let i = 0; i < TOTAL_OUTRAS_DEMANDAS; i++) {
      const usuario = usuarios[i % usuarios.length];

      const marcador = `SEED_OUTRAS_DEMANDAS_${String(i + 1).padStart(3, "0")}`;

      const existe = await Solicitacao.findOne({
        observacao: marcador,
      });

      if (existe) {
        console.log(`Solicitação ${marcador} já existe.`);
        continue;
      }

      const quantidade = i + 1;
      const valorUnitario = 100 + i * 75;

      await Solicitacao.create({
        solicitante: usuario._id,
        setor: usuario.setor || null,

        itemCompra: null,
        categoria: planilhaSelecionada.categoria,

        ordem: `NOVA-${String(i + 1).padStart(3, "0")}`,

        codigoSIPAC: null,
        subitem: null,
        codigoCATService: null,

        descricao: outrasDemandas[i],
        descricaoSucinta: outrasDemandas[i],
        unidadeFornecimento: "UNIDADE",

        valorUnitarioEstimado: valorUnitario,
        estimativaPreliminarValor: valorUnitario,

        grupoVinculado: null,

        quantidade,
        valorTotal: quantidade * valorUnitario,

        grauPrioridade: ["BAIXA", "MEDIA", "ALTA"][i % 3],
        dataDesejadaAquisicao: new Date("2027-06-30"),

        temVinculacao: false,

        justificativa: `Justificativa de teste para ${outrasDemandas[i]}.`,

        itemNovo: true,

        nomeInteressado: usuario.nome,
        email: usuario.email,

        status: "APROVADA",
        decisao: true,
        comentario: "Aprovada para testes do sistema.",
        dataAprovacao: new Date(),
        dataCriacao: new Date(),
        dataAtualizacao: new Date(),
        dataEnvio: new Date(),

        observacao: marcador,
      });

      criadasNovas++;

      console.log(`Outra demanda ${i + 1} criada.`);
    }

    // ==========================================
    // 3. RESULTADO
    // ==========================================

    const totalPadrao = await Solicitacao.countDocuments({
      status: "APROVADA",
      decisao: true,
      itemCompra: { $in: itensDisponiveis.map((item) => item._id) },
    });

    const totalNovas = await Solicitacao.countDocuments({
      status: "APROVADA",
      decisao: true,
      itemNovo: true,
      categoria: planilhaSelecionada.categoria,
    });

    console.log("\n========== RESULTADO ==========");
    console.log("Solicitações padrão criadas:", criadasPadrao);
    console.log("Outras demandas criadas:", criadasNovas);
    console.log("Total de itens padrão aprovados:", totalPadrao);
    console.log("Total de outras demandas aprovadas:", totalNovas);
    console.log("Planilha utilizada:", planilhaSelecionada.nomeArquivo);
    console.log("Seeder executado com sucesso!");
  } catch (error) {
    console.error("Erro ao executar seeder:", error);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

executarSeeder();
