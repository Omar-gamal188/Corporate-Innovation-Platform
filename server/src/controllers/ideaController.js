const path = require('path');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/apiResponse');
const ideaService = require('../services/ideaService');
const evaluationService = require('../services/evaluationService');
const decisionService = require('../services/decisionService');
const executionService = require('../services/executionService');
const AppError = require('../utils/AppError');
const env = require('../config/env');

/** GET /api/ideas */
const listIdeas = catchAsync(async (req, res) => {
  const { status, domain, department, search } = req.query;
  const ideas = await ideaService.listIdeas(req.user, { status, domain, department, search });
  sendSuccess(res, { data: ideas });
});

/** GET /api/ideas/:id — includes evaluation/decision/execution sub-resources for the details page */
const getIdea = catchAsync(async (req, res) => {
  const idea = await ideaService.getIdeaDetail(req.params.id, req.user);
  const [evaluation, decision, execution] = await Promise.all([
    evaluationService.getEvaluationForIdea(idea._id),
    decisionService.getLatestDecisionForIdea(idea._id),
    executionService.getExecutionForIdea(idea._id),
  ]);
  sendSuccess(res, { data: { idea, evaluation, decision, execution } });
});

/** POST /api/ideas — Save as Draft */
const createDraft = catchAsync(async (req, res) => {
  const idea = await ideaService.createDraft(req.user, req.body);
  sendSuccess(res, { statusCode: 201, data: idea, message: 'Draft saved' });
});

/** PUT /api/ideas/:id — edit a Draft or Needs-Completion idea */
const updateIdea = catchAsync(async (req, res) => {
  const idea = await ideaService.updateIdea(req.params.id, req.user, req.body);
  sendSuccess(res, { data: idea, message: 'Idea updated' });
});

/** POST /api/ideas/:id/submit — Submit for Review */
const submitForReview = catchAsync(async (req, res) => {
  const idea = await ideaService.submitForReview(req.params.id, req.user);
  sendSuccess(res, { data: idea, message: 'Idea submitted for review' });
});

/** GET /api/ideas/:id/duplicates — similar existing ideas */
const checkDuplicates = catchAsync(async (req, res) => {
  const similar = await ideaService.checkDuplicates(req.params.id);
  sendSuccess(res, { data: similar });
});

/** POST /api/ideas/:id/attachments */
const addAttachments = catchAsync(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw new AppError('No files were uploaded', 400);
  }
  const idea = await ideaService.addAttachments(req.params.id, req.user, req.files);
  sendSuccess(res, { data: idea, message: 'Attachments uploaded' });
});

/**
 * GET /api/ideas/:id/attachments/:storedName — streams a single attachment.
 * Re-uses the same visibility rule as getIdea (owner-only for Drafts, etc.)
 * so attachments can never be fetched by guessing a URL.
 */
const downloadAttachment = catchAsync(async (req, res) => {
  const idea = await ideaService.getIdeaDetail(req.params.id, req.user);
  const attachment = idea.attachments.find((a) => a.storedName === req.params.storedName);
  if (!attachment) {
    throw new AppError('Attachment not found', 404);
  }

  const filePath = path.join(__dirname, '..', '..', env.uploadDir, attachment.storedName);
  res.download(filePath, attachment.originalName);
});

/** POST /api/ideas/:id/screen/forward — Coordinator forwards to evaluation */
const forwardToEvaluation = catchAsync(async (req, res) => {
  const idea = await ideaService.forwardToEvaluation(req.params.id, req.user);
  sendSuccess(res, { data: idea, message: 'Idea forwarded to evaluation' });
});

/** POST /api/ideas/:id/screen/request-completion — Coordinator sends back for completion */
const requestCompletion = catchAsync(async (req, res) => {
  const idea = await ideaService.requestCompletion(req.params.id, req.user, req.body.note);
  sendSuccess(res, { data: idea, message: 'Completion requested from owner' });
});

/** POST /api/ideas/:id/close — Committee or Admin archives a Completed idea */
const closeIdea = catchAsync(async (req, res) => {
  const idea = await ideaService.closeIdea(req.params.id, req.user);
  sendSuccess(res, { data: idea, message: 'Idea closed' });
});

module.exports = {
  listIdeas,
  getIdea,
  createDraft,
  updateIdea,
  submitForReview,
  checkDuplicates,
  addAttachments,
  downloadAttachment,
  forwardToEvaluation,
  requestCompletion,
  closeIdea,
};
