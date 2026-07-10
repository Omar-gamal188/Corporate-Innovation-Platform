const mongoose = require('mongoose');

const progressUpdateSchema = new mongoose.Schema(
  {
    note: { type: String, required: true, maxlength: 2000 },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const executionSchema = new mongoose.Schema(
  {
    idea: { type: mongoose.Schema.Types.ObjectId, ref: 'Idea', required: true, unique: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    dueDate: { type: Date, required: true },
    progressUpdates: { type: [progressUpdateSchema], default: [] },
    finalReport: { type: String, maxlength: 5000, default: '' },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Execution', executionSchema);
