import Setor from '../models/Setor.js';

export const criarSetor = async (req, res) => {
  try {
    const { nome, descricao, aprovadorId } = req.body;

    const existe = await Setor.findOne({ nome });
    if (existe) {
      return res.status(400).json({ message: 'Setor já cadastrado.' });
    }

    const setor = await Setor.create({
      nome,
      descricao,
      aprovador: aprovadorId || null,
    });

    res.status(201).json({ message: 'Setor criado com sucesso!', setor });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao criar setor.', error: error.message });
  }
};

export const listarSetores = async (req, res) => {
  try {
    const setores = await Setor.find()
      .populate('aprovador', 'nome email')
      .sort({ nome: 1 });
    res.json({ total: setores.length, setores });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao listar setores.', error: error.message });
  }
};

export const atualizarSetor = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, descricao, aprovadorId } = req.body;

    const setor = await Setor.findByIdAndUpdate(
      id,
      { nome, descricao, aprovador: aprovadorId || null },
      { new: true }
    ).populate('aprovador', 'nome email');

    if (!setor) {
      return res.status(404).json({ message: 'Setor não encontrado.' });
    }

    res.json({ message: 'Setor atualizado com sucesso!', setor });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao atualizar setor.', error: error.message });
  }
};

export const deletarSetor = async (req, res) => {
  try {
    const { id } = req.params;
    await Setor.findByIdAndDelete(id);
    res.json({ message: 'Setor deletado com sucesso!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao deletar setor.', error: error.message });
  }
};