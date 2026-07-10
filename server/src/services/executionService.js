const Execution = require('../models/Execution');
const AppError = require('../utils/AppError');
const ideaService = require('./ideaService');
const { notifyUser } = require('./notificationService');
const { logAction } = require('./auditService');
const { IDEA_STATUS, ROLES } = require('../utils/constants');

/** Throws unless the actor is the assigned execution owner or on the Committee. */
function assertCanManageExecution(execution, actor) {
  const isOwner = execution.owner.toString() === actor._id.toString();
  const isCommittee = actor.role === ROLES.COMMITTEE;
  if (!isOwner && !isCommittee) {
    throw new AppError('Only the execution owner or the committee can update this execution', 403);
  }
  return isOwner;
}

/** Committee assigns an execution owner + due date, moving the idea into In Progress. */
async function assignExecution(ideaId, actor, { ownerId, dueDate }) {
  const idea = await ideaService.getIdeaOrThrow(ideaId);
  if (idea.status !== IDEA_STATUS.APPROVED_FOR_PILOT) {
    throw new AppError('Only ideas Approved for Pilot can start execution', 409);
  }

  const existing = await Execution.findOne({ idea: ideaId });
  if (existing) {
    throw new AppError('Execution has already been assigned for this idea', 409);
  }

  const execution = await Execution.create({ idea: ideaId, owner: ownerId, dueDate });
  await ideaService.transition(idea, IDEA_STATUS.IN_PROGRESS, actor);

  await notifyUser(ownerId, `You have been assigned to execute idea "${idea.title}" (${idea.code})`, `/ideas/${idea._id}`);
  await logAction({
    userId: actor._id,
    action: 'execution.assign',
    targetType: 'Execution',
    targetId: execution._id,
    note: `owner=${ownerId}, dueDate=${dueDate}`,
  });

  return execution;
}

/** Logs a progress note against an in-flight execution. */
async function addProgressUpdate(ideaId, actor, note) {
  const idea = await ideaService.getIdeaOrThrow(ideaId);
  if (idea.status !== IDEA_STATUS.IN_PROGRESS) {
    throw new AppError('Progress can only be logged while the idea is In Progress', 409);
  }

  const execution = await Execution.findOne({ idea: ideaId });
  if (!execution) throw new AppError('Execution record not found', 404);
  assertCanManageExecution(execution, actor);

  if (!note || !note.trim()) {
    throw new AppError('A progress note is required', 400);
  }

  execution.progressUpdates.push({ note, by: actor._id, at: new Date() });
  await execution.save();

  await logAction({ userId: actor._id, action: 'execution.progressUpdate', targetType: 'Execution', targetId: execution._id, note });
  return execution;
}

/** Submits the final report and moves the idea to Completed. */
async function completeExecution(ideaId, actor, finalReport) {
  const idea = await ideaService.getIdeaOrThrow(ideaId);
  if (idea.status !== IDEA_STATUS.IN_PROGRESS) {
    throw new AppError('Only an idea that is In Progress can be completed', 409);
  }

  const execution = await Execution.findOne({ idea: ideaId });
  if (!execution) throw new AppError('Execution record not found', 404);
  const isOwner = assertCanManageExecution(execution, actor);

  if (!finalReport || !finalReport.trim()) {
    throw new AppError('A final report is required to complete an idea', 400);
  }

  execution.finalReport = finalReport;
  execution.completedAt = new Date();
  await execution.save();

  // The execution owner isn't necessarily a Committee member, so the role
  // check inside transition() is bypassed here — ownership was just verified above.
  await ideaService.transition(idea, IDEA_STATUS.COMPLETED, actor, { skipRoleCheck: isOwner });

  await logAction({ userId: actor._id, action: 'execution.complete', targetType: 'Execution', targetId: execution._id });
  return execution;
}

async function getExecutionForIdea(ideaId) {
  return Execution.findOne({ idea: ideaId }).populate('owner', 'username role');
}

module.exports = { assignExecution, addProgressUpdate, completeExecution, getExecutionForIdea };
