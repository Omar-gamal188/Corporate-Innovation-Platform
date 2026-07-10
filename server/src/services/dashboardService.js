const Idea = require('../models/Idea');
const Decision = require('../models/Decision');
const { IDEA_STATUS } = require('../utils/constants');

/** KPI cards: total ideas, under evaluation, approved for pilot, completed. */
async function getKpis() {
  const [total, underEvaluation, approvedForPilot, completed] = await Promise.all([
    Idea.countDocuments({}),
    Idea.countDocuments({ status: IDEA_STATUS.UNDER_REVIEW }),
    Idea.countDocuments({ status: IDEA_STATUS.APPROVED_FOR_PILOT }),
    Idea.countDocuments({ status: IDEA_STATUS.COMPLETED }),
  ]);
  return { total, underEvaluation, approvedForPilot, completed };
}

/** Conversion funnel across the main lifecycle milestones. */
async function getFunnel() {
  const stages = [
    IDEA_STATUS.SUBMITTED,
    IDEA_STATUS.UNDER_REVIEW,
    IDEA_STATUS.APPROVED_FOR_PILOT,
    IDEA_STATUS.COMPLETED,
  ];
  // An idea currently further along the pipeline has already passed earlier
  // stages (its statusHistory contains them), so we count "reached-or-passed".
  const reachedCounts = await Promise.all(
    stages.map((stage) => Idea.countDocuments({ 'statusHistory.to': stage }))
  );
  return stages.map((stage, i) => ({ stage, count: reachedCounts[i] }));
}

/** Idea counts grouped by department. */
async function getByDepartment() {
  return Idea.aggregate([
    { $group: { _id: '$department', count: { $sum: 1 } } },
    { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'department' } },
    { $unwind: '$department' },
    { $project: { _id: 0, department: '$department.name', count: 1 } },
    { $sort: { count: -1 } },
  ]);
}

/** Idea counts grouped by domain (Service/Process/Technology). */
async function getByDomain() {
  return Idea.aggregate([
    { $group: { _id: '$domain', count: { $sum: 1 } } },
    { $project: { _id: 0, domain: '$_id', count: 1 } },
    { $sort: { count: -1 } },
  ]);
}

/** Average time (in hours) between Submitted and the first committee decision. */
async function getAverageEvaluationTimeHours() {
  const decisions = await Decision.find().populate('idea', 'statusHistory');
  const durations = decisions
    .map((decision) => {
      const submittedEntry = decision.idea?.statusHistory?.find((h) => h.to === IDEA_STATUS.SUBMITTED);
      if (!submittedEntry) return null;
      const hours = (decision.createdAt - submittedEntry.at) / (1000 * 60 * 60);
      return hours >= 0 ? hours : null;
    })
    .filter((h) => h !== null);

  if (durations.length === 0) return 0;
  const average = durations.reduce((sum, h) => sum + h, 0) / durations.length;
  return Math.round(average * 10) / 10;
}

/** Completed ideas divided by ideas that ever reached Approved for Pilot. */
async function getImplementationRate() {
  const [approved, completed] = await Promise.all([
    Idea.countDocuments({ 'statusHistory.to': IDEA_STATUS.APPROVED_FOR_PILOT }),
    Idea.countDocuments({ status: IDEA_STATUS.COMPLETED }),
  ]);
  if (approved === 0) return 0;
  return Math.round((completed / approved) * 1000) / 10; // percentage, 1 decimal
}

async function getFullReport() {
  const [kpis, funnel, byDepartment, byDomain, avgEvaluationTimeHours, implementationRatePercent] = await Promise.all([
    getKpis(),
    getFunnel(),
    getByDepartment(),
    getByDomain(),
    getAverageEvaluationTimeHours(),
    getImplementationRate(),
  ]);
  return { kpis, funnel, byDepartment, byDomain, avgEvaluationTimeHours, implementationRatePercent };
}

module.exports = { getKpis, getFunnel, getByDepartment, getByDomain, getAverageEvaluationTimeHours, getImplementationRate, getFullReport };
