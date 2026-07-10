const Department = require('../models/Department');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/apiResponse');
const { logAction } = require('../services/auditService');

/** GET /api/departments — any authenticated user (needed for idea/user forms) */
const listDepartments = catchAsync(async (req, res) => {
  const departments = await Department.find().sort({ name: 1 });
  sendSuccess(res, { data: departments });
});

/** POST /api/departments — Admin only */
const createDepartment = catchAsync(async (req, res) => {
  const department = await Department.create(req.body);
  await logAction({ userId: req.user._id, action: 'department.create', targetType: 'Department', targetId: department._id });
  sendSuccess(res, { statusCode: 201, data: department, message: 'Department created' });
});

module.exports = { listDepartments, createDepartment };
