import mongoose from 'mongoose';

const setorSchema = new mongoose.Schema({
  nome: { type: String, required: true, unique: true },
  descricao: { type: String },
  aprovador: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null },
  dataCriacao: { type: Date, default: Date.now },
});

export default mongoose.model('Setor', setorSchema);