const AuditLog = require('../models/AuditLog');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/apiResponse');

/** GET /api/audit-log — Admin only. Supports ?user=&action=&targetType=&page=&limit= */
const listAuditLog = catchAsync(async (req, res) => {
  const { user, action, targetType, page = 1, limit = 50 } = req.query;
  const query = {};
  if (user) query.user = user;
  if (action) query.action = action;
  if (targetType) query.targetType = targetType;

  const skip = (Number(page) - 1) * Number(limit);
  const [entries, total] = await Promise.all([
    AuditLog.find(query).populate('user', 'username role').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    AuditLog.countDocuments(query),
  ]);

  sendSuccess(res, { data: { entries, total, page: Number(page), limit: Number(limit) } });
});

module.exports = { listAuditLog };
