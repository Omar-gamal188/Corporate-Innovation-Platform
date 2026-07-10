const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const AppError = require('../utils/AppError');

const SALT_ROUNDS = 12;

/** Hashes a plain-text password with bcrypt. Never store/compare plain text. */
async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

/** Issues a signed JWT carrying the user id and role. */
function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

/**
 * Authenticates a username/password pair, enforcing account lockout after
 * repeated failures. Always returns the same generic error message for bad
 * username vs. bad password, so the API never reveals which one was wrong.
 */
async function login(username, password) {
  const user = await User.findOne({ username }).select('+passwordHash');
  if (!user) {
    throw new AppError('Invalid username or password', 401);
  }

  if (!user.isActive) {
    throw new AppError('This account has been deactivated', 403);
  }

  if (user.isLocked()) {
    const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
    throw new AppError(`Account locked. Try again in ${minutesLeft} minute(s)`, 423);
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    await registerFailedAttempt(user);
    throw new AppError('Invalid username or password', 401);
  }

  // Successful login clears any prior failed-attempt count/lock.
  user.failedLoginAttempts = 0;
  user.lockUntil = null;
  await user.save();

  const token = signToken(user);
  return { token, user };
}

/**
 * Increments the failed-attempt counter and locks the account for
 * env.lockTimeMinutes once env.maxLoginAttempts is reached.
 */
async function registerFailedAttempt(user) {
  user.failedLoginAttempts += 1;
  if (user.failedLoginAttempts >= env.maxLoginAttempts) {
    user.lockUntil = new Date(Date.now() + env.lockTimeMinutes * 60 * 1000);
  }
  await user.save();
}

/** Enforces the password policy: min 8 chars, at least one letter and one number. */
function isPasswordStrongEnough(password) {
  return typeof password === 'string' && password.length >= 8 && /[a-zA-Z]/.test(password) && /\d/.test(password);
}

module.exports = { hashPassword, signToken, login, isPasswordStrongEnough };
