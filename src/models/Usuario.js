import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const usuarioSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  senha: { type: String, required: true },
  setor: { type: mongoose.Schema.Types.ObjectId, ref: 'Setor', default: null },
  perfil: { type: String, enum: ['SERVIDOR', 'APROVADOR', 'ADMINISTRADOR'], default: 'SERVIDOR' },
});

usuarioSchema.pre('save', async function () {
  if (!this.isModified('senha')) return;
  const salt = await bcrypt.genSalt(10);
  this.senha = await bcrypt.hash(this.senha, salt);
});

usuarioSchema.methods.compararSenha = async function (senha) {
  return bcrypt.compare(senha, this.senha);
};

export default mongoose.model('Usuario', usuarioSchema);