/**
 * Every API response follows the same shape so the frontend can handle
 * success/error generically instead of special-casing each endpoint.
 */

function sendSuccess(res, { statusCode = 200, data = null, message = 'OK' } = {}) {
  return res.status(statusCode).json({ success: true, data, message });
}

function sendError(res, { statusCode = 500, message = 'Something went wrong' } = {}) {
  return res.status(statusCode).json({ success: false, data: null, message });
}

module.exports = { sendSuccess, sendError };
