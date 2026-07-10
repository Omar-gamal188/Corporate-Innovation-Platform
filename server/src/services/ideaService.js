const Idea = require('../models/Idea');
const AppError = require('../utils/AppError');
const generateIdeaCode = require('../utils/generateIdeaCode');
const { notifyUser, notifyRole } = require('./notificationService');
const { logAction } = require('./auditService');
const { findSimilarIdeas } = require('./duplicateService');
const { IDEA_STATUS, ROLES } = require('../utils/constants');

const {
  DRAFT,
  SUBMITTED,
  UNDER_REVIEW,
  NEEDS_COMPLETION,
  APPROVED_FOR_PILOT,
  IN_PROGRESS,
  COMPLETED,
  CLOSED,
} = IDEA_STATUS;

/**
 * The single source of truth for which status transitions are legal, which
 * role may perform them, and whether a note is mandatory. Every status
 * change in the whole application must go through `transition()` below —
 * no controller/service ever sets `idea.status` directly.
 */
const TRANSITIONS = {
  [`${DRAFT}->${SUBMITTED}`]: { roles: [ROLES.EMPLOYEE], noteRequired: false, ownerOnly: true },
  [`${NEEDS_COMPLETION}->${SUBMITTED}`]: { roles: [ROLES.EMPLOYEE], noteRequired: false, ownerOnly: true },
  [`${SUBMITTED}->${UNDER_REVIEW}`]: { roles: [ROLES.COORDINATOR], noteRequired: false },
  [`${SUBMITTED}->${NEEDS_COMPLETION}`]: { roles: [ROLES.COORDINATOR], noteRequired: true },
  [`${UNDER_REVIEW}->${APPROVED_FOR_PILOT}`]: { roles: [ROLES.COMMITTEE], noteRequired: false },
  [`${UNDER_REVIEW}->${NEEDS_COMPLETION}`]: { roles: [ROLES.COMMITTEE], noteRequired: true },
  [`${UNDER_REVIEW}->${CLOSED}`]: { roles: [ROLES.COMMITTEE], noteRequired: true },
  [`${APPROVED_FOR_PILOT}->${IN_PROGRESS}`]: { roles: [ROLES.COMMITTEE], noteRequired: false },
  [`${IN_PROGRESS}->${COMPLETED}`]: { roles: [ROLES.COMMITTEE], noteRequired: false, allowExecutionOwner: true },
  [`${COMPLETED}->${CLOSED}`]: { roles: [ROLES.COMMITTEE, ROLES.ADMIN], noteRequired: false },
};

/** Fetches an idea by id or throws a 404. */
async function getIdeaOrThrow(ideaId) {
  const idea = await Idea.findById(ideaId);
  if (!idea) throw new AppError('Idea not found', 404);
  return idea;
}

/** Throws unless `user` is the idea's owner. Ownership is always server-checked. */
function assertOwner(idea, user) {
  if (idea.owner.toString() !== user._id.toString()) {
    throw new AppError('You do not have permission to access this idea', 403);
  }
}

const REQUIRED_FIELDS_FOR_SUBMIT = [
  'problemStatement',
  'proposedSolution',
  'expectedImpact',
  'implementationRequirements',
  'risksAndDependencies',
];

/** Validates that all fields required for submission (but not for a draft) are filled in. */
function assertCompleteForSubmission(idea) {
  const missing = REQUIRED_FIELDS_FOR_SUBMIT.filter((field) => !idea[field] || !idea[field].trim());
  if (missing.length > 0) {
    throw new AppError(`Cannot submit: missing required field(s): ${missing.join(', ')}`, 400);
  }
  if (idea.initialCost === undefined || idea.initialCost === null || idea.initialCost < 0) {
    throw new AppError('Cannot submit: initial cost must be provided and non-negative', 400);
  }
}

/**
 * The state machine gate. Every status change in the app calls this.
 * @param {Object} idea - a loaded Idea document (not yet saved)
 * @param {string} toStatus - target status from IDEA_STATUS
 * @param {Object} actor - the acting User document
 * @param {Object} [options]
 * @param {string} [options.note] - required for some transitions (see TRANSITIONS)
 * @param {boolean} [options.skipRoleCheck] - set by callers (executionService) that
 *   already verified the actor is the assigned execution owner, since that is an
 *   ownership check rather than a role check.
 */
async function transition(idea, toStatus, actor, { note = '', skipRoleCheck = false } = {}) {
  const key = `${idea.status}->${toStatus}`;
  const rule = TRANSITIONS[key];

  if (!rule) {
    throw new AppError(`Cannot move idea from "${idea.status}" to "${toStatus}"`, 409);
  }

  const roleAllowed = rule.roles.includes(actor.role) || (rule.allowExecutionOwner && skipRoleCheck);
  if (!roleAllowed) {
    throw new AppError('You do not have permission to perform this transition', 403);
  }

  if (rule.ownerOnly) {
    assertOwner(idea, actor);
  }

  if (rule.noteRequired && (!note || note.trim().length < 10)) {
    throw new AppError('A documented reason (min 10 characters) is required for this action', 400);
  }

  const fromStatus = idea.status;
  idea.status = toStatus;
  idea.statusHistory.push({ from: fromStatus, to: toStatus, by: actor._id, note, at: new Date() });
  await idea.save();

  await notifyUser(idea.owner, `Your idea "${idea.title}" moved from ${fromStatus} to ${toStatus}`, `/ideas/${idea._id}`);
  await logAction({
    userId: actor._id,
    action: 'idea.transition',
    targetType: 'Idea',
    targetId: idea._id,
    note: `${fromStatus} -> ${toStatus}${note ? `: ${note}` : ''}`,
  });

  return idea;
}

/** Creates a new idea in Draft status, owned by `owner`. */
async function createDraft(owner, data) {
  const code = await generateIdeaCode();
  const idea = await Idea.create({
    code,
    owner: owner._id,
    department: data.department,
    title: data.title,
    domain: data.domain,
    problemStatement: data.problemStatement || '',
    proposedSolution: data.proposedSolution || '',
    expectedImpact: data.expectedImpact || '',
    initialCost: data.initialCost ?? 0,
    implementationRequirements: data.implementationRequirements || '',
    risksAndDependencies: data.risksAndDependencies || '',
    status: DRAFT,
    statusHistory: [{ to: DRAFT, by: owner._id, note: 'Draft created', at: new Date() }],
  });

  await logAction({ userId: owner._id, action: 'idea.createDraft', targetType: 'Idea', targetId: idea._id });
  return idea;
}

/** Updates an editable idea (Draft or Needs Completion), owner-only. */
async function updateIdea(ideaId, actor, data) {
  const idea = await getIdeaOrThrow(ideaId);
  assertOwner(idea, actor);

  if (![DRAFT, NEEDS_COMPLETION].includes(idea.status)) {
    throw new AppError(`Idea cannot be edited while in status "${idea.status}"`, 409);
  }

  const editableFields = [
    'title',
    'domain',
    'department',
    'problemStatement',
    'proposedSolution',
    'expectedImpact',
    'initialCost',
    'implementationRequirements',
    'risksAndDependencies',
  ];
  editableFields.forEach((field) => {
    if (data[field] !== undefined) idea[field] = data[field];
  });

  await idea.save();
  await logAction({ userId: actor._id, action: 'idea.update', targetType: 'Idea', targetId: idea._id });
  return idea;
}

/** Committee or Admin archives a Completed idea. */
async function closeIdea(ideaId, actor) {
  const idea = await getIdeaOrThrow(ideaId);
  await transition(idea, CLOSED, actor);
  return idea;
}

/** Employee submits a Draft or Needs-Completion idea for review. */
async function submitForReview(ideaId, actor) {
  const idea = await getIdeaOrThrow(ideaId);
  assertCompleteForSubmission(idea);
  await transition(idea, SUBMITTED, actor);
  await notifyRole(ROLES.COORDINATOR, `New idea "${idea.title}" (${idea.code}) awaits screening`, `/ideas/${idea._id}`);
  return idea;
}

/** Coordinator forwards a Submitted idea to evaluation. */
async function forwardToEvaluation(ideaId, actor) {
  const idea = await getIdeaOrThrow(ideaId);
  await transition(idea, UNDER_REVIEW, actor);
  await notifyRole(ROLES.EVALUATOR, `Idea "${idea.title}" (${idea.code}) is ready for evaluation`, `/ideas/${idea._id}`);
  return idea;
}

/** Coordinator (or Committee, from Under Review) sends the idea back for completion. */
async function requestCompletion(ideaId, actor, note) {
  const idea = await getIdeaOrThrow(ideaId);
  await transition(idea, NEEDS_COMPLETION, actor, { note });
  return idea;
}

/** Returns similar existing ideas for the given draft, to warn about duplicates before submit. */
async function checkDuplicates(ideaId) {
  const idea = await getIdeaOrThrow(ideaId);
  return findSimilarIdeas({ title: idea.title, problemStatement: idea.problemStatement, excludeId: idea._id });
}

/**
 * Lists ideas visible to `actor`, applying role-based visibility and
 * optional filters. Draft ideas are only ever visible to their owner —
 * not even Admin bypasses this, per the "owner-only" business rule.
 */
async function listIdeas(actor, { status, domain, department, search } = {}) {
  const query = {};

  if (actor.role === ROLES.EMPLOYEE) {
    query.owner = actor._id;
  } else {
    query.status = { $ne: DRAFT };
  }

  if (status) query.status = status;
  if (domain) query.domain = domain;
  if (department) query.department = department;
  if (search) query.$text = { $search: search };

  return Idea.find(query)
    .populate('owner', 'username role')
    .populate('department', 'name code')
    .sort({ createdAt: -1 });
}

/** Fetches a single idea, enforcing the same visibility rule as listIdeas. */
async function getIdeaDetail(ideaId, actor) {
  const idea = await Idea.findById(ideaId)
    .populate('owner', 'username role')
    .populate('department', 'name code')
    .populate('statusHistory.by', 'username role');
  if (!idea) throw new AppError('Idea not found', 404);

  const isOwner = idea.owner._id.toString() === actor._id.toString();
  if (idea.status === DRAFT && !isOwner) {
    throw new AppError('Idea not found', 404);
  }
  if (actor.role === ROLES.EMPLOYEE && !isOwner) {
    throw new AppError('You do not have permission to view this idea', 403);
  }

  return idea;
}

/** Owner attaches uploaded files (already validated by multer) to an editable idea. */
async function addAttachments(ideaId, actor, files) {
  const idea = await getIdeaOrThrow(ideaId);
  assertOwner(idea, actor);

  if (![DRAFT, NEEDS_COMPLETION].includes(idea.status)) {
    throw new AppError(`Attachments cannot be added while in status "${idea.status}"`, 409);
  }

  const metadata = files.map((file) => ({
    originalName: file.originalname,
    storedName: file.filename,
    mimeType: file.mimetype,
    size: file.size,
  }));
  idea.attachments.push(...metadata);
  await idea.save();

  await logAction({ userId: actor._id, action: 'idea.addAttachments', targetType: 'Idea', targetId: idea._id, note: `${files.length} file(s)` });
  return idea;
}

module.exports = {
  TRANSITIONS,
  getIdeaOrThrow,
  assertOwner,
  transition,
  createDraft,
  updateIdea,
  submitForReview,
  forwardToEvaluation,
  requestCompletion,
  checkDuplicates,
  addAttachments,
  listIdeas,
  getIdeaDetail,
  closeIdea,
};
