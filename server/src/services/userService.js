const User = require('../models/User');
const AppError = require('../utils/AppError');
const { hashPassword } = require('./authService');
const { logAction } = require('./auditService');

/** Admin creates a new user account with a hashed password. */
async function createUser(actor, { username, email, password, role, department }) {
  const passwordHash = await hashPassword(password);
  const user = await User.create({ username, email, passwordHash, role, department });

  await logAction({ userId: actor._id, action: 'user.create', targetType: 'User', targetId: user._id, note: `role=${role}` });
  return user;
}

/** Admin updates a user's role, department, or active flag. Password changes go through a separate flow. */
async function updateUser(actor, userId, { role, department, isActive }) {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  if (role !== undefined) user.role = role;
  if (department !== undefined) user.department = department;
  if (isActive !== undefined) user.isActive = isActive;
  await user.save();

  await logAction({ userId: actor._id, action: 'user.update', targetType: 'User', targetId: user._id });
  return user;
}

/** Admin manually unlocks an account that is locked due to failed login attempts. */
async function unlockUser(actor, userId) {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  user.failedLoginAttempts = 0;
  user.lockUntil = null;
  await user.save();

  await logAction({ userId: actor._id, action: 'user.unlock', targetType: 'User', targetId: user._id });
  return user;
}

async function listUsers() {
  return User.find().populate('department', 'name code').sort({ createdAt: -1 });
}

module.exports = { createUser, updateUser, unlockUser, listUsers };
