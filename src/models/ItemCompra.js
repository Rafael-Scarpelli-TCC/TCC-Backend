import mongoose from 'mongoose';

const itemCompraSchema = new mongoose.Schema({
  planilha: { type: mongoose.Schema.Types.ObjectId, ref: 'PlanilhaCompras', required: true },
  ordem: { type: String },
  codigoSIPAC: { type: String },
  subitem: { type: String },
  codigoCATService: { type: String },
  descricao: { type: String },
  descricaoSucinta: { type: String },
  unidadeFornecimento: { type: String },
  valorUnitarioEstimado: { type: Number, default: 0 },
  estimativaPreliminarValor: { type: Number, default: 0 },
  grupoVinculado: { type: String },
});

export default mongoose.model('ItemCompra', itemCompraSchema);