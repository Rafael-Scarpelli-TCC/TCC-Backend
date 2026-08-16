import mongoose from 'mongoose';

const solicitacaoSchema = new mongoose.Schema({
  solicitante: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null },
  setor: { type: mongoose.Schema.Types.ObjectId, ref: 'Setor', default: null },
  itemCompra: { type: mongoose.Schema.Types.ObjectId, ref: 'ItemCompra', default: null },
  categoria: { type: mongoose.Schema.Types.ObjectId, ref: 'Categoria', default: null },

  ordem: { type: String },
  codigoSIPAC: { type: String },
  subitem: { type: String },
  codigoCATService: { type: String },
  descricao: { type: String, required: true },
  descricaoSucinta: { type: String },
  unidadeFornecimento: { type: String },
  valorUnitarioEstimado: { type: Number, default: 0 },
  estimativaPreliminarValor: { type: Number, default: 0 },
  grupoVinculado: { type: String },

  quantidade: { type: Number, required: true },
  valorTotal: { type: Number, default: 0 },
  grauPrioridade: { type: String, enum: ['BAIXA', 'MEDIA', 'ALTA'] },
  dataDesejadaAquisicao: { type: Date },
  temVinculacao: { type: Boolean, default: false },
  justificativa: { type: String },
  itemNovo: { type: Boolean, default: false },
  nomeInteressado: { type: String },
  email: { type: String },

  situacaoItem: { type: String },
  numeroPGC2025: { type: String },

  dataAprovacao: { type: Date },
  decisao: { type: Boolean },
  comentario: { type: String },

  status: { type: String, enum: ['PENDENTE', 'APROVADA', 'REJEITADA', 'CANCELADA'], default: 'PENDENTE' },
  dataCriacao: { type: Date, default: Date.now },
  dataAtualizacao: { type: Date },
  dataEnvio: { type: Date },
  observacao: { type: String },
});

export default mongoose.model('Solicitacao', solicitacaoSchema);