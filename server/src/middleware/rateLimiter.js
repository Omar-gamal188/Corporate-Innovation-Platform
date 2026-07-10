const rateLimit = require('express-rate-limit');

/**
 * Tighter limiter for authentication routes (login/register) to slow down
 * credential-stuffing / brute-force attempts at the network layer, on top
 * of the per-account lockout enforced in authService.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, data: null, message: 'Too many requests, please try again later' },
});

/**
 * Generous general-purpose limiter for the rest of the API, mainly to
 * blunt scripted abuse rather than restrict normal usage.
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, data: null, message: 'Too many requests, please try again later' },
});

module.exports = { authLimiter, generalLimiter };
