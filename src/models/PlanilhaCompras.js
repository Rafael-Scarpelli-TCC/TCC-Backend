import mongoose from 'mongoose';

const planilhaComprasSchema = new mongoose.Schema({
  nomeArquivo: { type: String, required: true },
  anoReferencia: { type: Number, required: true },
  dataImportacao: { type: Date, default: Date.now },
  categoria: { type: mongoose.Schema.Types.ObjectId, ref: 'Categoria', default: null },
});

export default mongoose.model('PlanilhaCompras', planilhaComprasSchema);