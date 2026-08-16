import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js';
import Setor from '../models/Setor.js';

export const autenticar = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token não fornecido.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await Usuario.findById(decoded.id).select('-senha').populate('setor', '_id nome');
    if (!usuario) {
      return res.status(401).json({ message: 'Usuário não encontrado.' });
    }

    // Verifica se o usuário é aprovador de algum setor
    const setorComoAprovador = await Setor.findOne({ aprovador: usuario._id });
    req.usuario = usuario;
    req.setorAprovador = setorComoAprovador || null;
    req.isAprovador = !!setorComoAprovador;

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido.' });
  }
};

export const autorizar = (...perfis) => {
  return (req, res, next) => {
    if (!perfis.includes(req.usuario.perfil)) {
      return res.status(403).json({ message: 'Acesso negado.' });
    }
    next();
  };
};