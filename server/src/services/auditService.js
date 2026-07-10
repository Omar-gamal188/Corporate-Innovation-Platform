const AuditLog = require('../models/AuditLog');

/**
 * Writes one audit trail entry. Deliberately swallows its own errors —
 * a logging failure must never abort the business action that triggered it,
 * it just gets reported to the server console for ops to notice.
 * @param {Object} params
 * @param {string} params.userId - id of the acting user
 * @param {string} params.action - short verb phrase, e.g. "idea.submit"
 * @param {string} params.targetType - e.g. "Idea", "User", "CriteriaWeights"
 * @param {string} [params.targetId] - id of the affected document
 * @param {string} [params.note] - human-readable detail (e.g. rejection reason)
 * @param {Object} [params.meta] - any extra structured context
 */
async function logAction({ userId, action, targetType, targetId = null, note = '', meta = {} }) {
  try {
    await AuditLog.create({ user: userId, action, targetType, targetId, note, meta });
  } catch (err) {
    console.error('[audit] failed to write audit log entry:', err.message);
  }
}

module.exports = { logAction };
