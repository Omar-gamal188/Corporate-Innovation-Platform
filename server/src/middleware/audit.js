const { logAction } = require('../services/auditService');

/**
 * Safety-net audit logger: guarantees every mutating request (POST/PUT/
 * PATCH/DELETE) that succeeds (2xx/3xx) leaves a trail, even if the
 * controller/service didn't write a more detailed entry itself.
 * Services that need a richer, business-meaningful note (e.g. a decision
 * reason) call auditService.logAction directly and set req.auditLogged
 * so this generic entry is skipped for that request.
 */
function auditMutations(req, res, next) {
  const mutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);

  if (mutating) {
    res.on('finish', () => {
      if (req.auditLogged) return; // a service already wrote a detailed entry
      if (!req.user) return; // unauthenticated requests never reach here anyway
      if (res.statusCode >= 400) return; // failed requests aren't useful audit trail

      logAction({
        userId: req.user._id,
        action: `${req.method} ${req.baseUrl}${req.path}`,
        targetType: 'HttpRequest',
        note: '',
        meta: { statusCode: res.statusCode },
      });
    });
  }

  next();
}

module.exports = auditMutations;
