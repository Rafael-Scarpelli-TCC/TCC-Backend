import Categoria from '../models/Categoria.js';

export const criarCategoria = async (req, res) => {
  try {
    const { nome, descricao } = req.body;

    const existe = await Categoria.findOne({ nome });
    if (existe) {
      return res.status(400).json({ message: 'Categoria já cadastrada.' });
    }

    const categoria = await Categoria.create({ nome, descricao });
    res.status(201).json({ message: 'Categoria criada com sucesso!', categoria });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao criar categoria.', error: error.message });
  }
};

export const listarCategorias = async (req, res) => {
  try {
    const categorias = await Categoria.find().sort({ nome: 1 });
    res.json({ total: categorias.length, categorias });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao listar categorias.', error: error.message });
  }
};

export const deletarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    await Categoria.findByIdAndDelete(id);
    res.json({ message: 'Categoria deletada com sucesso!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao deletar categoria.', error: error.message });
  }
};