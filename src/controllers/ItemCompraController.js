import ItemCompra from '../models/ItemCompra.js';

export const listarItens = async (req, res) => {
  try {
    const { planilhaId, busca } = req.query;

    const filtro = {};

    if (planilhaId) filtro.planilha = planilhaId;

    if (busca) {
      filtro.$or = [
        { descricao: { $regex: busca, $options: 'i' } },
        { descricaoSucinta: { $regex: busca, $options: 'i' } },
        { codigoSIPAC: { $regex: busca, $options: 'i' } },
      ];
    }

    const itens = await ItemCompra.find(filtro).sort({ ordem: 1 });

    res.json({ total: itens.length, itens });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao listar itens.', error: error.message });
  }
};