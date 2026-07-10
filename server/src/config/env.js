require('dotenv').config();

/**
 * Centralized, validated access to environment variables.
 * Fails fast at boot if a required secret is missing, instead of
 * silently running with an insecure default in production.
 */
const required = (name, fallback) => {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongoUri: required('MONGO_URI', 'mongodb://127.0.0.1:27017/innovation_platform'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim()),
  maxLoginAttempts: Number(process.env.MAX_LOGIN_ATTEMPTS) || 5,
  lockTimeMinutes: Number(process.env.LOCK_TIME_MINUTES) || 15,
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB) || 5,
};

module.exports = env;
