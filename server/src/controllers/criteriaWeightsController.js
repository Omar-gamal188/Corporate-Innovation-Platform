const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/apiResponse');
const criteriaWeightsService = require('../services/criteriaWeightsService');

/** GET /api/criteria-weights — any authenticated user (evaluators/committee need to see them) */
const getWeights = catchAsync(async (req, res) => {
  const weights = await criteriaWeightsService.getWeights();
  sendSuccess(res, { data: weights });
});

/** PUT /api/criteria-weights — Admin only, must total 100 */
const updateWeights = catchAsync(async (req, res) => {
  const weights = await criteriaWeightsService.updateWeights(req.user, req.body);
  sendSuccess(res, { data: weights, message: 'Criteria weights updated' });
});

module.exports = { getWeights, updateWeights };
