const xss = require('xss');

/**
 * Recursively strips HTML/script tags out of every string in req.body.
 * Combined with express-mongo-sanitize (Mongo operator injection) in app.js,
 * this is the input-side defense; React's default escaping is the output-side
 * defense for anything rendered back in the client.
 */
function cleanValue(value) {
  if (typeof value === 'string') {
    return xss(value, { whiteList: {}, stripIgnoreTag: true, stripIgnoreTagBody: ['script'] });
  }
  if (Array.isArray(value)) {
    return value.map(cleanValue);
  }
  if (value && typeof value === 'object') {
    return sanitizeObject(value);
  }
  return value;
}

function sanitizeObject(obj) {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = cleanValue(value);
  }
  return result;
}

function sanitizeXss(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
}

module.exports = sanitizeXss;
