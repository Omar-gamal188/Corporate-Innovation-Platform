const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/apiResponse');
const evaluationService = require('../services/evaluationService');

/** POST /api/ideas/:id/evaluation — Evaluator scores the idea */
const submitEvaluation = catchAsync(async (req, res) => {
  const evaluation = await evaluationService.submitEvaluation(req.params.id, req.user, req.body);
  sendSuccess(res, { statusCode: 201, data: evaluation, message: 'Evaluation submitted' });
});

/** GET /api/ideas/:id/evaluation */
const getEvaluation = catchAsync(async (req, res) => {
  const evaluation = await evaluationService.getEvaluationForIdea(req.params.id);
  sendSuccess(res, { data: evaluation });
});

module.exports = { submitEvaluation, getEvaluation };
