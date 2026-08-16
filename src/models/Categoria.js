import mongoose from 'mongoose';

const categoriaSchema = new mongoose.Schema({
  nome: { type: String, required: true, unique: true },
  descricao: { type: String },
  dataCriacao: { type: Date, default: Date.now },
});

export default mongoose.model('Categoria', categoriaSchema);