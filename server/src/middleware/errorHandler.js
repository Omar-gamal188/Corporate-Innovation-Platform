const multer = require('multer');
const env = require('../config/env');

/**
 * Centralized error handler. Operational errors (AppError) send their
 * own safe message; anything unexpected is logged server-side and only
 * a generic message is returned — stack traces never reach the client.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Multer's file-filter/size errors aren't AppErrors but are still safe,
  // user-facing messages (e.g. "Unsupported file type", "File too large").
  const isUploadError = err instanceof multer.MulterError || err.message === 'Unsupported file type';
  const statusCode = err.isOperational ? err.statusCode : isUploadError ? 400 : 500;
  const message = err.isOperational ? err.message : isUploadError ? err.message : 'Internal server error';

  if (!err.isOperational && !isUploadError) {
    console.error('[unhandled error]', err);
  } else if (env.nodeEnv === 'development') {
    console.error(`[error] ${statusCode} ${message}`);
  }

  res.status(statusCode).json({ success: false, data: null, message });
}

module.exports = errorHandler;
