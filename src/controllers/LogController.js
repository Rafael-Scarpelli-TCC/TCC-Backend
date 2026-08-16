import Log from '../models/Log.js';

export const criarLog = async (usuarioId, solicitacaoId, acao, comentario = '') => {
  try {
    await Log.create({
      usuario: usuarioId,
      solicitacao: solicitacaoId,
      acao,
      comentario,
    });
  } catch (error) {
    console.error('Erro ao criar log:', error);
  }
};

export const listarLogs = async (req, res) => {
  try {
    const { solicitacaoId } = req.params;

    const logs = await Log.find({ solicitacao: solicitacaoId })
      .populate('usuario', 'nome email')
      .sort({ data: -1 });

    res.json({ total: logs.length, logs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao listar logs.', error: error.message });
  }
};