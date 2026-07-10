const Idea = require('../models/Idea');
const Evaluation = require('../models/Evaluation');
const Decision = require('../models/Decision');
const Execution = require('../models/Execution');
const Department = require('../models/Department');
const CriteriaWeights = require('../models/CriteriaWeights');
const { logAction } = require('./auditService');

/**
 * Builds a JSON snapshot of the core business collections for Admin backup.
 * Users are intentionally excluded so a downloaded backup never contains
 * password hashes or other account security data.
 */
async function buildBackup(actor) {
  const [ideas, evaluations, decisions, executions, departments, criteriaWeights] = await Promise.all([
    Idea.find().lean(),
    Evaluation.find().lean(),
    Decision.find().lean(),
    Execution.find().lean(),
    Department.find().lean(),
    CriteriaWeights.find().lean(),
  ]);

  await logAction({ userId: actor._id, action: 'backup.export', targetType: 'System' });

  return {
    generatedAt: new Date().toISOString(),
    departments,
    ideas,
    evaluations,
    decisions,
    executions,
    criteriaWeights,
  };
}

module.exports = { buildBackup };
