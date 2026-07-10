const mongoose = require('mongoose');
const env = require('./env');

/**
 * Connects to MongoDB. Exits the process on failure so orchestration
 * (docker/pm2/systemd) can restart cleanly instead of running half-broken.
 */
async function connectDB() {
  try {
    await mongoose.connect(env.mongoUri);
    console.log(`[db] connected to ${env.mongoUri}`);
  } catch (err) {
    console.error('[db] connection failed:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
