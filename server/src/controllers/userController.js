const bcrypt = require('bcryptjs');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/apiResponse');
const toSafeUser = require('../utils/toSafeUser');
const userService = require('../services/userService');
const authService = require('../services/authService');
const AppError = require('../utils/AppError');
const User = require('../models/User');
const { logAction } = require('../services/auditService');

/** GET /api/users — Admin only */
const listUsers = catchAsync(async (req, res) => {
  const users = await userService.listUsers();
  sendSuccess(res, { data: users.map(toSafeUser) });
});

/** POST /api/users — Admin only */
const createUser = catchAsync(async (req, res) => {
  if (!authService.isPasswordStrongEnough(req.body.password)) {
    throw new AppError('Password must be at least 8 characters and include letters and numbers', 400);
  }
  const user = await userService.createUser(req.user, req.body);
  sendSuccess(res, { statusCode: 201, data: toSafeUser(user), message: 'User created' });
});

/** PUT /api/users/:id — Admin only */
const updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUser(req.user, req.params.id, req.body);
  sendSuccess(res, { data: toSafeUser(user), message: 'User updated' });
});

/** POST /api/users/:id/unlock — Admin only */
const unlockUser = catchAsync(async (req, res) => {
  const user = await userService.unlockUser(req.user, req.params.id);
  sendSuccess(res, { data: toSafeUser(user), message: 'User unlocked' });
});

/** PUT /api/users/me/password — any authenticated user changes their own password */
const changeOwnPassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!authService.isPasswordStrongEnough(newPassword)) {
    throw new AppError('Password must be at least 8 characters and include letters and numbers', 400);
  }

  const user = await User.findById(req.user._id).select('+passwordHash');
  const matches = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!matches) throw new AppError('Current password is incorrect', 401);

  user.passwordHash = await authService.hashPassword(newPassword);
  await user.save();
  await logAction({ userId: user._id, action: 'user.changePassword', targetType: 'User', targetId: user._id });

  sendSuccess(res, { message: 'Password changed' });
});

module.exports = { listUsers, createUser, updateUser, unlockUser, changeOwnPassword };
