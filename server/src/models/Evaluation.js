const mongoose = require('mongoose');
const { SYSTEM_SUGGESTION } = require('../utils/constants');

const scoreField = { type: Number, required: true, min: 0, max: 100 };

const evaluationSchema = new mongoose.Schema(
  {
    idea: { type: mongoose.Schema.Types.ObjectId, ref: 'Idea', required: true, unique: true },
    evaluator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    scores: {
      businessImpact: scoreField,
      feasibility: scoreField,
      initialCost: scoreField,
      innovation: scoreField,
      implementationRisk: scoreField,
      scalability: scoreField,
    },
    weightedTotal: { type: Number, required: true },
    recommendation: { type: String, maxlength: 2000, default: '' },
    systemSuggestion: {
      type: String,
      enum: Object.values(SYSTEM_SUGGESTION),
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Evaluation', evaluationSchema);
