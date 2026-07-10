const Notification = require('../models/Notification');
const catchAsync = require('../utils/catchAsync');
const { sendSuccess } = require('../utils/apiResponse');
const AppError = require('../utils/AppError');

/** GET /api/notifications — the current user's own notifications, newest first */
const listMyNotifications = catchAsync(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
  const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });
  sendSuccess(res, { data: { notifications, unreadCount } });
});

/** PUT /api/notifications/:id/read */
const markAsRead = catchAsync(async (req, res) => {
  const notification = await Notification.findOne({ _id: req.params.id, user: req.user._id });
  if (!notification) throw new AppError('Notification not found', 404);
  notification.isRead = true;
  await notification.save();
  sendSuccess(res, { data: notification });
});

/** PUT /api/notifications/read-all */
const markAllAsRead = catchAsync(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  sendSuccess(res, { message: 'All notifications marked as read' });
});

module.exports = { listMyNotifications, markAsRead, markAllAsRead };
