const Decision = require('../models/Decision');
const Evaluation = require('../models/Evaluation');
const AppError = require('../utils/AppError');
const ideaService = require('./ideaService');
const { logAction } = require('./auditService');
const { IDEA_STATUS, DECISION_OUTCOME } = require('../utils/constants');

const OUTCOME_TO_STATUS = {
  [DECISION_OUTCOME.APPROVED_FOR_PILOT]: IDEA_STATUS.APPROVED_FOR_PILOT,
  [DECISION_OUTCOME.RETURNED_FOR_DEVELOPMENT]: IDEA_STATUS.NEEDS_COMPLETION,
  [DECISION_OUTCOME.REJECTED_AND_CLOSED]: IDEA_STATUS.CLOSED,
};

/**
 * Committee decides the fate of an evaluated idea. A documented reason is
 * mandatory for Return/Reject — enforced both here (evaluation must exist)
 * and inside ideaService.transition (note length), never trusting the client.
 */
async function makeDecision(ideaId, actor, { outcome, reason }) {
  const idea = await ideaService.getIdeaOrThrow(ideaId);

  if (idea.status !== IDEA_STATUS.UNDER_REVIEW) {
    throw new AppError('Only ideas that are Under Review can receive a committee decision', 409);
  }

  const evaluation = await Evaluation.findOne({ idea: ideaId });
  if (!evaluation) {
    throw new AppError('This idea must be evaluated before a decision can be made', 409);
  }

  const targetStatus = OUTCOME_TO_STATUS[outcome];
  if (!targetStatus) {
    throw new AppError('Invalid decision outcome', 400);
  }

  await ideaService.transition(idea, targetStatus, actor, { note: reason });

  const decision = await Decision.create({ idea: ideaId, decidedBy: actor._id, outcome, reason: reason || '' });

  await logAction({
    userId: actor._id,
    action: 'decision.create',
    targetType: 'Decision',
    targetId: decision._id,
    note: `${outcome}${reason ? `: ${reason}` : ''}`,
  });

  return decision;
}

async function getLatestDecisionForIdea(ideaId) {
  return Decision.findOne({ idea: ideaId }).sort({ createdAt: -1 }).populate('decidedBy', 'username role');
}

module.exports = { makeDecision, getLatestDecisionForIdea };
