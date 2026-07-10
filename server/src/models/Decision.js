const mongoose = require('mongoose');
const { DECISION_OUTCOME } = require('../utils/constants');

const decisionSchema = new mongoose.Schema(
  {
    idea: { type: mongoose.Schema.Types.ObjectId, ref: 'Idea', required: true },
    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    outcome: { type: String, required: true, enum: Object.values(DECISION_OUTCOME) },
    // Required at the service layer (not schema level) for Returned/Rejected outcomes,
    // because Approved decisions don't need a reason.
    reason: { type: String, maxlength: 2000, default: '' },
  },
  { timestamps: true }
);

decisionSchema.index({ idea: 1, createdAt: -1 });

module.exports = mongoose.model('Decision', decisionSchema);
