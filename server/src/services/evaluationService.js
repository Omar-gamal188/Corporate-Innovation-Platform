const Evaluation = require('../models/Evaluation');
const AppError = require('../utils/AppError');
const ideaService = require('./ideaService');
const { getWeights } = require('./criteriaWeightsService');
const { notifyRole } = require('./notificationService');
const { logAction } = require('./auditService');
const { IDEA_STATUS, SYSTEM_SUGGESTION, CRITERIA_KEYS, ROLES } = require('../utils/constants');

/** Applies the current weights to raw 0-100 scores and returns the weighted total (0-100). */
function computeWeightedTotal(scores, weights) {
  const total = CRITERIA_KEYS.reduce((sum, key) => sum + (scores[key] * weights[key]) / 100, 0);
  return Math.round(total * 100) / 100;
}

/** Maps a weighted total to the auto-suggestion band described in the spec. */
function suggestOutcome(weightedTotal) {
  if (weightedTotal >= 80) return SYSTEM_SUGGESTION.RECOMMEND_PILOT;
  if (weightedTotal >= 60) return SYSTEM_SUGGESTION.NEEDS_DEVELOPMENT;
  return SYSTEM_SUGGESTION.ARCHIVE;
}

/**
 * Evaluator scores an idea that is currently Under Review. One evaluation
 * per idea (enforced by the unique index on Evaluation.idea).
 */
async function submitEvaluation(ideaId, evaluator, { scores, recommendation }) {
  const idea = await ideaService.getIdeaOrThrow(ideaId);
  if (idea.status !== IDEA_STATUS.UNDER_REVIEW) {
    throw new AppError('Only ideas that are Under Review can be evaluated', 409);
  }

  const existing = await Evaluation.findOne({ idea: ideaId });
  if (existing) {
    throw new AppError('This idea has already been evaluated', 409);
  }

  const weights = await getWeights();
  const weightedTotal = computeWeightedTotal(scores, weights);
  const systemSuggestion = suggestOutcome(weightedTotal);

  const evaluation = await Evaluation.create({
    idea: ideaId,
    evaluator: evaluator._id,
    scores,
    weightedTotal,
    recommendation: recommendation || '',
    systemSuggestion,
  });

  await notifyRole(ROLES.COMMITTEE, `Idea "${idea.title}" (${idea.code}) has been evaluated (score ${weightedTotal})`, `/ideas/${idea._id}`);
  await logAction({
    userId: evaluator._id,
    action: 'evaluation.submit',
    targetType: 'Evaluation',
    targetId: evaluation._id,
    note: `weightedTotal=${weightedTotal}, suggestion=${systemSuggestion}`,
  });

  return evaluation;
}

async function getEvaluationForIdea(ideaId) {
  return Evaluation.findOne({ idea: ideaId }).populate('evaluator', 'username role');
}

module.exports = { submitEvaluation, getEvaluationForIdea, computeWeightedTotal, suggestOutcome };
