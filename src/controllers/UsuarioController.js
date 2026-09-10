import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js';
import Setor from '../models/Setor.js';

export const login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    const usuario = await Usuario.findOne({ email })
      .populate('setor', 'nome');

    if (!usuario) {
      return res.status(401).json({
        message: 'Email ou senha inválidos.'
      });
    }

    const senhaCorreta = await usuario.compararSenha(senha);

    if (!senhaCorreta) {
      return res.status(401).json({
        message: 'Email ou senha inválidos.'
      });
    }

    const setorComoAprovador = await Setor.findOne({
      aprovador: usuario._id
    });

    const token = jwt.sign(
      {
        id: usuario._id,
        perfil: usuario.perfil
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '8h'
      }
    );

    res.json({
      token,
      usuario: {
        id: usuario._id,
        nome: usuario.nome,
        email: usuario.email,
        identificacao: usuario.identificacao,
        tipoUsuario: usuario.tipoUsuario,
        setor: usuario.setor,
        perfil: usuario.perfil,
        isAprovador: !!setorComoAprovador,
        setorAprovador: setorComoAprovador || null
      }
    });

  } catch (error) {
    console.error('Erro ao fazer login:', error);

    res.status(500).json({
      message: 'Erro ao fazer login.',
      error: error.message
    });
  }
};

export const listarUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.find()
      .select('-senha')
      .populate({
        path: 'setor',
        select: '_id nome'
      });

    res.json({
      total: usuarios.length,
      usuarios
    });

  } catch (error) {
    console.error('Erro ao listar usuários:', error);

    res.status(500).json({
      message: 'Erro ao listar usuários.',
      error: error.message
    });
  }
};

export const atualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { perfil, setorId } = req.body;

    const dados = {};

    if (perfil) {
      dados.perfil = perfil;
    }

    if (setorId !== undefined) {
      dados.setor = setorId || null;
    }

    const usuario = await Usuario.findByIdAndUpdate(
      id,
      dados,
      {
        new: true,
        runValidators: true
      }
    )
      .select('-senha')
      .populate('setor', 'nome');

    if (!usuario) {
      return res.status(404).json({
        message: 'Usuário não encontrado.'
      });
    }

    res.json({
      message: 'Usuário atualizado com sucesso!',
      usuario
    });

  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);

    res.status(500).json({
      message: 'Erro ao atualizar usuário.',
      error: error.message
    });
  }
};

export const criarUsuario = async (req, res) => {
  try {
    const {
      nome,
      email,
      senha,
      identificacao,
      tipoUsuario,
      perfil
    } = req.body;

    const existe = await Usuario.findOne({
      $or: [
        { email },
        { identificacao }
      ]
    });

    if (existe) {
      return res.status(400).json({
        message: 'Email ou identificação já cadastrados.'
      });
    }

    const usuario = await Usuario.create({
      nome,
      email,
      senha,
      identificacao,
      tipoUsuario,
      perfil
    });

    res.status(201).json({
      message: 'Usuário criado com sucesso!',
      usuario: {
        id: usuario._id,
        nome: usuario.nome,
        email: usuario.email,
        identificacao: usuario.identificacao,
        tipoUsuario: usuario.tipoUsuario,
        perfil: usuario.perfil
      }
    });

  } catch (error) {
    console.error('Erro ao criar usuário:', error);

    res.status(500).json({
      message: 'Erro ao criar usuário.',
      error: error.message
    });
  }
};

export const cadastrarViaSuap = async (req, res) => {
  try {
    const {
      nome,
      email,
      identificacao,
      tipoUsuario,
      senha
    } = req.body;

    if (
      !nome ||
      !email ||
      !identificacao ||
      !tipoUsuario ||
      !senha
    ) {
      return res.status(400).json({
        message: 'Todos os campos obrigatórios devem ser preenchidos.'
      });
    }

    if (senha.length < 6) {
      return res.status(400).json({
        message: 'A senha deve possuir pelo menos 6 caracteres.'
      });
    }

    const existe = await Usuario.findOne({
      $or: [
        { email },
        { identificacao }
      ]
    });

    if (existe) {
      return res.status(409).json({
        message: 'Este usuário já possui cadastro no sistema.'
      });
    }

    const usuario = await Usuario.create({
      nome,
      email,
      identificacao,
      tipoUsuario,
      senha,
      perfil: 'USER',
      setor: null
    });

    return res.status(201).json({
      message: 'Cadastro realizado com sucesso!',
      usuario: {
        id: usuario._id,
        nome: usuario.nome,
        email: usuario.email,
        identificacao: usuario.identificacao,
        tipoUsuario: usuario.tipoUsuario,
        perfil: usuario.perfil,
        setor: usuario.setor
      }
    });

  } catch (error) {
    console.error('Erro no cadastro via SUAP:', error);

    return res.status(500).json({
      message: 'Erro ao realizar cadastro.',
      error: error.message
    });
  }
};