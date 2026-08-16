import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  solicitacao: { type: mongoose.Schema.Types.ObjectId, ref: 'Solicitacao', default: null },
  acao: { type: String, required: true },
  comentario: { type: String },
  data: { type: Date, default: Date.now },
});

export default mongoose.model('Log', logSchema);