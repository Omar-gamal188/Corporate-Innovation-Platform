const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/apiResponse');
const executionService = require('../services/executionService');

/** POST /api/ideas/:id/execution — Committee assigns execution owner + due date */
const assignExecution = catchAsync(async (req, res) => {
  const execution = await executionService.assignExecution(req.params.id, req.user, req.body);
  sendSuccess(res, { statusCode: 201, data: execution, message: 'Execution assigned' });
});

/** GET /api/ideas/:id/execution */
const getExecution = catchAsync(async (req, res) => {
  const execution = await executionService.getExecutionForIdea(req.params.id);
  sendSuccess(res, { data: execution });
});

/** POST /api/ideas/:id/execution/progress */
const addProgressUpdate = catchAsync(async (req, res) => {
  const execution = await executionService.addProgressUpdate(req.params.id, req.user, req.body.note);
  sendSuccess(res, { data: execution, message: 'Progress update logged' });
});

/** POST /api/ideas/:id/execution/complete */
const completeExecution = catchAsync(async (req, res) => {
  const execution = await executionService.completeExecution(req.params.id, req.user, req.body.finalReport);
  sendSuccess(res, { data: execution, message: 'Idea marked as completed' });
});

module.exports = { assignExecution, getExecution, addProgressUpdate, completeExecution };
