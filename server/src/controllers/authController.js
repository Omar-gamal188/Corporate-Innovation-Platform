const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/apiResponse');
const toSafeUser = require('../utils/toSafeUser');
const authService = require('../services/authService');

/** POST /api/auth/login */
const login = catchAsync(async (req, res) => {
  const { username, password } = req.body;
  const { token, user } = await authService.login(username, password);
  sendSuccess(res, { data: { token, user: toSafeUser(user) }, message: 'Login successful' });
});

/** GET /api/auth/me — returns the currently authenticated user (from the JWT). */
const me = catchAsync(async (req, res) => {
  sendSuccess(res, { data: { user: toSafeUser(req.user) } });
});

module.exports = { login, me };
