const mongoose = require('mongoose');
const { DEFAULT_CRITERIA_WEIGHTS } = require('../utils/constants');

const criteriaWeightsSchema = new mongoose.Schema(
  {
    businessImpact: { type: Number, required: true, min: 0, default: DEFAULT_CRITERIA_WEIGHTS.businessImpact },
    feasibility: { type: Number, required: true, min: 0, default: DEFAULT_CRITERIA_WEIGHTS.feasibility },
    initialCost: { type: Number, required: true, min: 0, default: DEFAULT_CRITERIA_WEIGHTS.initialCost },
    innovation: { type: Number, required: true, min: 0, default: DEFAULT_CRITERIA_WEIGHTS.innovation },
    implementationRisk: { type: Number, required: true, min: 0, default: DEFAULT_CRITERIA_WEIGHTS.implementationRisk },
    scalability: { type: Number, required: true, min: 0, default: DEFAULT_CRITERIA_WEIGHTS.scalability },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

// Application treats this collection as a singleton: there is only ever one
// active document, fetched/created lazily by criteriaWeightsService.
module.exports = mongoose.model('CriteriaWeights', criteriaWeightsSchema);
