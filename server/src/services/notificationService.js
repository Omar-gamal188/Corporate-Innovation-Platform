const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Creates an in-app notification for a single user.
 * @param {string} userId - recipient
 * @param {string} message - short human-readable text
 * @param {string} [link] - frontend route the notification should deep-link to
 */
async function notifyUser(userId, message, link = '') {
  await Notification.create({ user: userId, message, link });
}

/**
 * Creates the same notification for every user in a given role, used when
 * an idea moves into a new queue (e.g. all coordinators when an idea is
 * submitted).
 */
async function notifyRole(role, message, link = '') {
  const users = await User.find({ role, isActive: true }).select('_id');
  await Promise.all(users.map((u) => notifyUser(u._id, message, link)));
}

module.exports = { notifyUser, notifyRole };
