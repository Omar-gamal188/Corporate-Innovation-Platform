const Counter = require('../models/Counter');

/**
 * Atomically bumps the "idea" counter and returns the next code,
 * e.g. IDEA-0001. Uses findOneAndUpdate with $inc + upsert so
 * concurrent submissions never collide on the same number.
 */
async function generateIdeaCode() {
  const counter = await Counter.findOneAndUpdate(
    { name: 'idea' },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );
  return `IDEA-${String(counter.value).padStart(4, '0')}`;
}

module.exports = generateIdeaCode;
