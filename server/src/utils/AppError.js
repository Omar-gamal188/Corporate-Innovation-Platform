/**
 * Operational error with an HTTP status code attached.
 * The central error handler trusts `isOperational` errors to have a
 * safe, user-facing message; anything else is logged and masked.
 */
class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
