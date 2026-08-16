import Cronograma from '../models/Cronograma.js';

export const criarCronograma = async (req, res) => {
  try {
    const { anoReferencia, dataAbertura, dataFechamento } = req.body;

    const mesmoAno = await Cronograma.findOne({ anoReferencia });
    if (mesmoAno) {
      return res.status(400).json({ message: `Já existe um cronograma para o ano ${anoReferencia}.` });
    }

    const cronograma = await Cronograma.create({
      anoReferencia,
      dataAbertura,
      dataFechamento,
    });

    res.status(201).json({ message: 'Cronograma criado com sucesso!', cronograma });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao criar cronograma.', error: error.message });
  }
};

export const listarCronogramas = async (req, res) => {
  try {
    const cronogramas = await Cronograma.find().populate('planilhas').sort({ anoReferencia: -1 });
    res.json({ total: cronogramas.length, cronogramas });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao listar cronogramas.', error: error.message });
  }
};

export const encerrarCronograma = async (req, res) => {
  try {
    const { id } = req.params;

    const cronograma = await Cronograma.findByIdAndUpdate(
      id,
      { status: 'ENCERRADO' },
      { new: true }
    );

    if (!cronograma) {
      return res.status(404).json({ message: 'Cronograma não encontrado.' });
    }

    res.json({ message: 'Cronograma encerrado com sucesso!', cronograma });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao encerrar cronograma.', error: error.message });
  }
};

export const isAberto = async (req, res) => {
  try {
    const cronograma = await Cronograma.findOne({ status: 'ABERTO' }).populate('planilhas');
    res.json({ aberto: !!cronograma, cronograma: cronograma || null });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao verificar cronograma.', error: error.message });
  }
};