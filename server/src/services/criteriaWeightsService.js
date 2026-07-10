const CriteriaWeights = require('../models/CriteriaWeights');
const AppError = require('../utils/AppError');
const { logAction } = require('./auditService');
const { CRITERIA_KEYS } = require('../utils/constants');

/**
 * Returns the single active CriteriaWeights document, creating it with
 * the defaults from constants.js on first use (lazy singleton).
 */
async function getWeights() {
  let weights = await CriteriaWeights.findOne();
  if (!weights) {
    weights = await CriteriaWeights.create({});
  }
  return weights;
}

/** Admin-only: replaces the weights, rejecting anything that doesn't total exactly 100. */
async function updateWeights(actor, newWeights) {
  const total = CRITERIA_KEYS.reduce((sum, key) => sum + Number(newWeights[key] || 0), 0);
  if (total !== 100) {
    throw new AppError(`Criteria weights must total exactly 100 (received ${total})`, 400);
  }

  const weights = await getWeights();
  CRITERIA_KEYS.forEach((key) => {
    weights[key] = newWeights[key];
  });
  weights.updatedBy = actor._id;
  await weights.save();

  await logAction({
    userId: actor._id,
    action: 'criteriaWeights.update',
    targetType: 'CriteriaWeights',
    targetId: weights._id,
    note: JSON.stringify(newWeights),
  });

  return weights;
}

module.exports = { getWeights, updateWeights };
