const mongoose = require('mongoose');

/**
 * Generic atomic counter used to generate sequential, human-readable
 * idea codes (IDEA-0001, IDEA-0002, ...) without race conditions,
 * even if two employees submit at the exact same millisecond.
 */
const counterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  value: { type: Number, required: true, default: 0 },
});

module.exports = mongoose.model('Counter', counterSchema);
