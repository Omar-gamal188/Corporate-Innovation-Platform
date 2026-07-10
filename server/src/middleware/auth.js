const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

/**
 * Verifies the JWT from the Authorization header and attaches the
 * authenticated user (without passwordHash) to req.user.
 * Runs on every protected route — there is no "trust the frontend" path.
 */
const authenticate = catchAsync(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    throw new AppError('Authentication required', 401);
  }

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch (err) {
    throw new AppError('Invalid or expired token', 401);
  }

  const user = await User.findById(payload.sub).populate('department', 'name code');
  if (!user || !user.isActive) {
    throw new AppError('Account not found or deactivated', 401);
  }

  req.user = user;
  next();
});

module.exports = authenticate;
