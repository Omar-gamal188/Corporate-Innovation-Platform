const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');

const env = require('./config/env');
const routes = require('./routes');
const sanitizeXss = require('./middleware/sanitize');
const auditMutations = require('./middleware/audit');
const { generalLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');

const app = express();

// Vercel (and most hosts) sit in front of this app as a reverse proxy and set
// X-Forwarded-For. Without this, express-rate-limit can't safely trust that
// header to identify the real client IP — it throws instead of silently
// getting rate limiting/lockout wrong. Trusting only the first hop is safe
// both behind Vercel's proxy and locally (no proxy, header simply absent).
app.set('trust proxy', 1);

// Secure HTTP headers.
app.use(helmet());

// Only the configured origins may call this API from a browser.
app.use(
  cors({
    origin: env.corsOrigins,
    credentials: true,
  })
);

if (env.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Strips any keys starting with "$" or containing "." from req.body/query/params
// to prevent NoSQL (MongoDB operator) injection.
app.use(mongoSanitize());

// Strips HTML/script tags out of every string field to prevent stored XSS.
app.use(sanitizeXss);

// Blunts scripted abuse across the whole API (auth routes have their own tighter limiter).
app.use(generalLimiter);

// Safety-net audit trail for every mutating request.
app.use(auditMutations);

app.get('/api/health', (req, res) => res.json({ success: true, data: { status: 'ok' }, message: 'Healthy' }));

app.use('/api', routes);

app.use((req, res, next) => next(new AppError(`Route not found: ${req.originalUrl}`, 404)));

app.use(errorHandler);

module.exports = app;
