const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/apiResponse');
const dashboardService = require('../services/dashboardService');

/** GET /api/dashboard — KPI cards, funnel, and breakdown reports */
const getDashboard = catchAsync(async (req, res) => {
  const report = await dashboardService.getFullReport();
  sendSuccess(res, { data: report });
});

module.exports = { getDashboard };
