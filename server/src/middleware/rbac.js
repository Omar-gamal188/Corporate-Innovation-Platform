const AppError = require('../utils/AppError');

/**
 * Restricts a route to a whitelist of roles. Must run after `authenticate`.
 * This is the server-side enforcement of RBAC — the frontend only hides
 * menu items for convenience, it never decides what is actually allowed.
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
}

module.exports = authorize;
