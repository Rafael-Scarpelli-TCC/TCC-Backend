import mongoose from 'mongoose';

const cronogramaSchema = new mongoose.Schema({
  anoReferencia: { type: Number, required: true },
  dataAbertura: { type: Date, required: true },
  dataFechamento: { type: Date, required: true },
  status: { type: String, enum: ['ABERTO', 'ENCERRADO'], default: 'ABERTO' },
  planilhas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PlanilhaCompras' }],
});

export default mongoose.model('Cronograma', cronogramaSchema);