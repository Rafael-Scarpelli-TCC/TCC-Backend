import xlsx from 'xlsx';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PlanilhaCompras from '../models/PlanilhaCompras.js';
import ItemCompra from '../models/ItemCompra.js';
import Cronograma from '../models/Cronograma.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export const importarPlanilha = async (req, res) => {
  try {
    const { anoReferencia, tipoDemanda, categoriaId, cronogramaId } = req.body;
    const arquivo = req.file;

    if (!arquivo) {
      return res.status(400).json({ message: 'Nenhum arquivo enviado.' });
    }

    const workbook = xlsx.read(arquivo.buffer, { type: 'buffer' });
    const sheetNames = workbook.SheetNames;
    console.log('Abas encontradas:', sheetNames);

    const sheetName = sheetNames.find(name =>
      name.toUpperCase().includes('PADR') ||
      name.toUpperCase().includes('ITENS') ||
      name.toUpperCase().includes('PÁGINA1') ||
      name.toUpperCase().includes('PAGINA1') ||
      name === 'Página1'
    ) || sheetNames[0];

    if (!sheetName) {
      return res.status(400).json({ message: `Aba não encontrada. Abas disponíveis: ${sheetNames.join(', ')}` });
    }

    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });
    const dataRows = rows.slice(4).filter(row => row[0] !== null);

    const nomeArquivoLimpo = Buffer.from(arquivo.originalname, 'latin1').toString('utf8');

    const planilha = await PlanilhaCompras.create({
      nomeArquivo: nomeArquivoLimpo,
      anoReferencia,
      categoria: categoriaId || null,
    });

    if (cronogramaId) {
      const cronograma = await Cronograma.findById(cronogramaId);
      if (cronograma) {
        cronograma.planilhas.push(planilha._id);
        await cronograma.save();
      }
    }

    const caminhoArquivo = path.join(uploadsDir, `${planilha._id}.xlsx`);
    fs.writeFileSync(caminhoArquivo, arquivo.buffer);

    const itens = dataRows.map(row => ({
      planilha: planilha._id,
      ordem: row[0]?.toString() ?? null,
      codigoSIPAC: row[1]?.toString() ?? null,
      subitem: row[2]?.toString() ?? null,
      codigoCATService: row[3]?.toString() ?? null,
      descricao: row[4]?.toString() ?? null,
      descricaoSucinta: row[5]?.toString() ?? null,
      unidadeFornecimento: row[6]?.toString() ?? null,
      valorUnitarioEstimado: parseFloat(row[8]) || 0,
      estimativaPreliminarValor: parseFloat(row[9]) || 0,
      grupoVinculado: row[20]?.toString() ?? null,
    }));

    await ItemCompra.insertMany(itens);

    res.status(201).json({
      message: 'Planilha importada com sucesso!',
      planilhaId: planilha._id,
      totalItens: itens.length,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao importar planilha.', error: error.message });
  }
};

export const listarPlanilhas = async (req, res) => {
  try {
    const planilhas = await PlanilhaCompras.find()
      .populate('categoria', 'nome')
      .sort({ dataImportacao: -1 });
    res.json({ total: planilhas.length, planilhas });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao listar planilhas.', error: error.message });
  }
};

export const exportarPlanilha = async (req, res) => {
  try {
    const { planilhaId } = req.params;

    const planilha = await PlanilhaCompras.findById(planilhaId).populate('categoria');
    if (!planilha) {
      return res.status(404).json({ message: 'Planilha não encontrada.' });
    }

    const caminhoArquivo = path.join(uploadsDir, `${planilhaId}.xlsx`);
    if (!fs.existsSync(caminhoArquivo)) {
      return res.status(404).json({ message: 'Arquivo original não encontrado.' });
    }

    const Solicitacao = (await import('../models/Solicitacao.js')).default;
    const nomePlanilha = planilha.nomeArquivo.replace('.xlsx', '');

    const cabecalho = [
      'ORDEM N.º',
      'CÓD. MATERIAL SIPAC',
      'SUBITEM* CONSUMO OU PERMANENTE',
      'CÓDIGO DO ITEM MATERIAL CAT SERVICE*',
      'DESCRIÇÃO*',
      'DESCRIÇÃO SUCINTA DO OBJETO*',
      'UNIDADE DE FORNECIMENTO*',
      'QUANTIDADE A SER CONTRATADA OU ADQUIRIDA*',
      'VALOR UNITÁRIO ESTIMADO (R$)*',
      'ESTIMATIVA PRELIMINAR DO VALOR (R$)*',
      'ESTIMATIVA PRELIMINAR DO VALOR TOTAL (R$)*',
      'GRAU DE PRIORIDADE DA CONTRATAÇÃO OU AQUISIÇÃO BAIXA, MÉDIA, ALTA*',
      'DATA DESEJADA PARA A AQUISIÇÃO DO ITEM*',
      'ITEM VINCULAÇÃO OU DEPENDÊNCIA COM OUTRO ITEM/SERVIÇO SIM OU NÃO*',
      'JUSTIFICATIVA PARA AQUISIÇÃO OU CONTRATAÇÃO* (DESCREVA)',
      'SETOR*',
      'NOME DO INTERESSADO*',
      'EMAIL*',
      'SITUAÇÃO DO ITEM (Exclusivo SECCON)',
      'Nº do ITEM NO PGC 2025 (Exclusivo SECCON)',
      'VINCULAR AO GRUPO (GRUPO CRIADO ANTES DO LANÇAMENTO)',
    ];

    const workbookNovo = new ExcelJS.Workbook();

    const criarSheet = async (workbook, nomeSheet, solicitacoes, ordemAutoIncrement = false) => {
      const sheet = workbook.addWorksheet(nomeSheet);

      const larguras = [8, 18, 20, 20, 40, 50, 15, 12, 18, 18, 18, 30, 18, 20, 50, 20, 25, 25, 20, 20, 40];
      larguras.forEach((w, i) => { sheet.getColumn(i + 1).width = w; });

      const linhaCabecalho = sheet.getRow(1);
      cabecalho.forEach((titulo, i) => {
        const cell = linhaCabecalho.getCell(i + 1);
        cell.value = titulo;
        cell.font = { bold: true, size: 10 };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };
        cell.border = {
          top: { style: 'thin' }, bottom: { style: 'thin' },
          left: { style: 'thin' }, right: { style: 'thin' },
        };
        cell.alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' };
      });
      linhaCabecalho.height = 40;
      linhaCabecalho.commit();

      let ordemContador = 1;
      let linhaAtual = 1;
      for (const sol of solicitacoes) {
        const novaLinha = sheet.getRow(linhaAtual + 1);
        novaLinha.getCell(1).value = ordemAutoIncrement ? ordemContador++ : (sol.ordem ?? null);
        novaLinha.getCell(2).value = sol.codigoSIPAC ?? null;
        novaLinha.getCell(3).value = sol.subitem ?? null;
        novaLinha.getCell(4).value = sol.codigoCATService ?? null;
        novaLinha.getCell(5).value = sol.descricao ?? null;
        novaLinha.getCell(6).value = sol.descricaoSucinta ?? null;
        novaLinha.getCell(7).value = sol.unidadeFornecimento ?? null;
        novaLinha.getCell(8).value = sol.quantidade ?? null;
        novaLinha.getCell(9).value = sol.valorUnitarioEstimado ?? null;
        novaLinha.getCell(10).value = sol.estimativaPreliminarValor ?? null;
        novaLinha.getCell(11).value = sol.valorTotal ?? null;
        novaLinha.getCell(12).value = sol.grauPrioridade ?? null;
        novaLinha.getCell(13).value = sol.dataDesejadaAquisicao ? new Date(sol.dataDesejadaAquisicao) : null;
        novaLinha.getCell(14).value = sol.temVinculacao ? 'SIM' : 'NÃO';
        novaLinha.getCell(15).value = sol.justificativa ?? null;
        novaLinha.getCell(16).value = sol.setor?.nome ?? null;
        novaLinha.getCell(17).value = sol.nomeInteressado ?? null;
        novaLinha.getCell(18).value = sol.email ?? null;
        novaLinha.getCell(19).value = sol.situacaoItem ?? null;
        novaLinha.getCell(20).value = sol.numeroPGC2025 ?? null;
        novaLinha.getCell(21).value = nomePlanilha;

        novaLinha.commit();

        for (let c = 1; c <= 21; c++) {
          const cell = sheet.getRow(linhaAtual + 1).getCell(c);
          cell.border = {
            top: { style: 'thin' }, bottom: { style: 'thin' },
            left: { style: 'thin' }, right: { style: 'thin' },
          };
          cell.alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' };
          cell.font = { size: 10 };
        }

        linhaAtual++;
      }
    };

    const itensDestaPlanilha = await ItemCompra.find({ planilha: planilhaId }).select('_id');
    const idsItens = itensDestaPlanilha.map(i => i._id);

    const solicitacoesItens = await Solicitacao.find({
      status: 'APROVADA',
      decisao: true,
      itemCompra: { $in: idsItens },
    }).populate('setor', 'nome');

    await criarSheet(workbookNovo, 'ITENS PADRÃO', solicitacoesItens, false);

    let solicitacoesNovas = [];
    if (planilha.categoria) {
      solicitacoesNovas = await Solicitacao.find({
        status: 'APROVADA',
        decisao: true,
        itemNovo: true,
        categoria: planilha.categoria._id,
      }).populate('setor', 'nome');
    }

    await criarSheet(workbookNovo, 'OUTRAS DEMANDAS', solicitacoesNovas, true);

    const buffer = await workbookNovo.xlsx.writeBuffer();

    res.setHeader('Content-Disposition', `attachment; filename=planilha_exportada.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao exportar planilha.', error: error.message });
  }
};