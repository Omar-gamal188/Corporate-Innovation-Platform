const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/apiResponse');
const decisionService = require('../services/decisionService');

/** POST /api/ideas/:id/decision — Committee approves/returns/rejects */
const makeDecision = catchAsync(async (req, res) => {
  const decision = await decisionService.makeDecision(req.params.id, req.user, req.body);
  sendSuccess(res, { statusCode: 201, data: decision, message: 'Decision recorded' });
});

/** GET /api/ideas/:id/decision */
const getDecision = catchAsync(async (req, res) => {
  const decision = await decisionService.getLatestDecisionForIdea(req.params.id);
  sendSuccess(res, { data: decision });
});

module.exports = { makeDecision, getDecision };
