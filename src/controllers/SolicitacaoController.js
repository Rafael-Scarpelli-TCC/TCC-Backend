import Solicitacao from '../models/Solicitacao.js';
import ItemCompra from '../models/ItemCompra.js';
import { criarLog } from './LogController.js';

export const criarSolicitacao = async (req, res) => {
  try {
    const {
      itemCompraId,
      descricao,
      descricaoSucinta,
      unidadeFornecimento,
      valorUnitarioEstimado,
      valorTotal,
      codigoSIPAC,
      subitem,
      codigoCATService,
      grupoVinculado,
      quantidade,
      grauPrioridade,
      dataDesejadaAquisicao,
      temVinculacao,
      justificativa,
      categoriaId,
      observacao,
      itemNovo,
      nomeInteressado,
      email,
    } = req.body;

    let dadosItem = {
      descricao,
      descricaoSucinta,
      unidadeFornecimento,
      valorUnitarioEstimado,
      codigoSIPAC,
      subitem,
      codigoCATService,
      grupoVinculado,
    };

    if (itemCompraId) {
      const itemCompra = await ItemCompra.findById(itemCompraId);
      if (!itemCompra) {
        return res.status(404).json({ message: 'Item não encontrado.' });
      }
      dadosItem = {
        itemCompra: itemCompra._id,
        ordem: itemCompra.ordem,
        codigoSIPAC: itemCompra.codigoSIPAC,
        subitem: itemCompra.subitem,
        codigoCATService: itemCompra.codigoCATService,
        descricao: itemCompra.descricao,
        descricaoSucinta: itemCompra.descricaoSucinta,
        unidadeFornecimento: itemCompra.unidadeFornecimento,
        valorUnitarioEstimado: itemCompra.valorUnitarioEstimado,
        estimativaPreliminarValor: itemCompra.estimativaPreliminarValor,
        grupoVinculado: itemCompra.grupoVinculado,
      };
    }

    const solicitacao = await Solicitacao.create({
      ...dadosItem,
      solicitante: req.usuario._id,
      setor: req.usuario.setor?._id || null,
      quantidade,
      valorTotal,
      grauPrioridade,
      dataDesejadaAquisicao,
      temVinculacao,
      justificativa,
      categoria: categoriaId || null,
      observacao,
      itemNovo: itemNovo || !itemCompraId,
      nomeInteressado,
      email,
      dataEnvio: new Date(),
    });

    await criarLog(req.usuario._id, solicitacao._id, 'CRIACAO', 'Solicitação criada.');

    res.status(201).json({ message: 'Solicitação criada com sucesso!', solicitacao });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao criar solicitação.', error: error.message });
  }

  
};

export const listarSolicitacoes = async (req, res) => {
  try {
    const { status } = req.query;
    const filtro = {};

    if (status) filtro.status = status;

    if (req.usuario.perfil !== 'ADMINISTRADOR') {
      filtro.solicitante = req.usuario._id;
    }

    const solicitacoes = await Solicitacao.find(filtro)
      .populate('solicitante', 'nome email')
      .populate('setor', 'nome')
      .populate('categoria', 'nome')
      .populate('itemCompra')
      .sort({ dataCriacao: -1 });

    res.json({ total: solicitacoes.length, solicitacoes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao listar solicitações.', error: error.message });
  }
};

export const listarSolicitacoesAprovador = async (req, res) => {
  try {
    const { status } = req.query;

    if (!req.isAprovador && req.usuario.perfil !== 'ADMINISTRADOR') {
      return res.json({ total: 0, solicitacoes: [] });
    }

    const filtro = {};
    if (status) filtro.status = status;

    if (req.isAprovador) {
      filtro.setor = req.setorAprovador._id;
    }

    const solicitacoes = await Solicitacao.find(filtro)
      .populate('solicitante', 'nome email')
      .populate('setor', 'nome')
      .populate('categoria', 'nome')
      .populate('itemCompra')
      .sort({ dataCriacao: -1 });

    res.json({ total: solicitacoes.length, solicitacoes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao listar solicitações.', error: error.message });
  }
};

export const aprovarRejeitarSolicitacao = async (req, res) => {
  try {
    const { id } = req.params;
    const { decisao, comentario } = req.body;

    if (!req.isAprovador && req.usuario.perfil !== 'ADMINISTRADOR') {
      return res.status(403).json({ message: 'Acesso negado.' });
    }

    const status = decisao ? 'APROVADA' : 'REJEITADA';

    const solicitacao = await Solicitacao.findByIdAndUpdate(
      id,
      {
        decisao,
        comentario,
        dataAprovacao: new Date(),
        status,
        dataAtualizacao: new Date(),
      },
      { new: true }
    );

    if (!solicitacao) {
      return res.status(404).json({ message: 'Solicitação não encontrada.' });
    }

    await criarLog(req.usuario._id, solicitacao._id, decisao ? 'APROVACAO' : 'REJEICAO', comentario || '');

    res.json({ message: 'Solicitação atualizada com sucesso!', solicitacao });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao atualizar solicitação.', error: error.message });
  }
  
};

export const cancelarSolicitacao = async (req, res) => {
  try {
    const { id } = req.params;

    const solicitacao = await Solicitacao.findById(id);

    if (!solicitacao) {
      return res.status(404).json({ message: 'Solicitação não encontrada.' });
    }

    if (solicitacao.status !== 'PENDENTE') {
      return res.status(400).json({ message: 'Apenas solicitações pendentes podem ser canceladas.' });
    }

    if (solicitacao.solicitante.toString() !== req.usuario._id.toString()) {
      return res.status(403).json({ message: 'Você não pode cancelar esta solicitação.' });
    }

    solicitacao.status = 'CANCELADA';
    solicitacao.dataAtualizacao = new Date();
    await solicitacao.save();

    await criarLog(req.usuario._id, solicitacao._id, 'CANCELAMENTO', 'Solicitação cancelada pelo solicitante.');

    res.json({ message: 'Solicitação cancelada com sucesso!', solicitacao });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao cancelar solicitação.', error: error.message });
  }
  
};

export const editarSolicitacao = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantidade, grauPrioridade, dataDesejadaAquisicao, justificativa, observacao } = req.body;

    const solicitacao = await Solicitacao.findById(id);

    if (!solicitacao) {
      return res.status(404).json({ message: 'Solicitação não encontrada.' });
    }

    if (solicitacao.status !== 'PENDENTE') {
      return res.status(400).json({ message: 'Apenas solicitações pendentes podem ser editadas.' });
    }

    const isSolicitante = solicitacao.solicitante.toString() === req.usuario._id.toString();
    const isAprovadorDoSetor = req.isAprovador && req.setorAprovador?._id.toString() === solicitacao.setor?.toString();
    const isAdmin = req.usuario.perfil === 'ADMINISTRADOR';

    if (!isSolicitante && !isAprovadorDoSetor && !isAdmin) {
      return res.status(403).json({ message: 'Você não tem permissão para editar esta solicitação.' });
    }

    if (quantidade) solicitacao.quantidade = quantidade;
    if (grauPrioridade) solicitacao.grauPrioridade = grauPrioridade;
    if (dataDesejadaAquisicao) solicitacao.dataDesejadaAquisicao = dataDesejadaAquisicao;
    if (observacao) solicitacao.observacao = observacao;
    if (quantidade && solicitacao.valorUnitarioEstimado) {
      solicitacao.valorTotal = quantidade * solicitacao.valorUnitarioEstimado;
    }

    if (justificativa && (isSolicitante || isAdmin)) {
      solicitacao.justificativa = justificativa;
    }

    solicitacao.dataAtualizacao = new Date();
    await solicitacao.save();

    await criarLog(req.usuario._id, solicitacao._id, 'EDICAO', 'Solicitação editada.');

    res.json({ message: 'Solicitação atualizada com sucesso!', solicitacao });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao editar solicitação.', error: error.message });
  }
  
};