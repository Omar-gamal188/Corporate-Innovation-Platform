const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

/**
 * Runs an array of express-validator chains, then rejects the request
 * with a 400 and the first validation message if any chain failed.
 * Usage: router.post('/x', validate([body('title').isLength({ min: 5 })]), controller)
 */
function validate(validationChains) {
  return async (req, res, next) => {
    await Promise.all(validationChains.map((chain) => chain.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const firstError = errors.array()[0];
    next(new AppError(firstError.msg, 400));
  };
}

module.exports = validate;
