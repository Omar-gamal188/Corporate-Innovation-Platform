const mongoose = require('mongoose');
const { ALL_IDEA_STATUSES, ALL_IDEA_DOMAINS, IDEA_STATUS } = require('../utils/constants');

const attachmentSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true },
    storedName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    from: { type: String },
    to: { type: String, required: true },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    note: { type: String, default: '' },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ideaSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    title: { type: String, required: true, minlength: 5, maxlength: 150 },
    domain: { type: String, required: true, enum: ALL_IDEA_DOMAINS },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    problemStatement: { type: String, maxlength: 5000, default: '' },
    proposedSolution: { type: String, maxlength: 5000, default: '' },
    expectedImpact: { type: String, maxlength: 5000, default: '' },
    initialCost: { type: Number, min: 0, default: 0 },
    implementationRequirements: { type: String, maxlength: 5000, default: '' },
    risksAndDependencies: { type: String, maxlength: 5000, default: '' },

    attachments: { type: [attachmentSchema], default: [] },

    status: {
      type: String,
      required: true,
      enum: ALL_IDEA_STATUSES,
      default: IDEA_STATUS.DRAFT,
    },
    statusHistory: { type: [statusHistorySchema], default: [] },
  },
  { timestamps: true }
);

// Screening/evaluation/decision queues filter by status; "My Ideas" filters by owner+status.
ideaSchema.index({ owner: 1, status: 1 });
ideaSchema.index({ status: 1 });
ideaSchema.index({ department: 1 });
ideaSchema.index({ domain: 1 });
// Text index powers the duplicate-detection search (title + problem statement).
ideaSchema.index({ title: 'text', problemStatement: 'text' });

module.exports = mongoose.model('Idea', ideaSchema);
