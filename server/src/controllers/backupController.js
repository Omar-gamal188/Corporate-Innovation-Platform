const catchAsync = require('../utils/catchAsync');
const backupService = require('../services/backupService');

/** GET /api/admin/backup — Admin only, downloads a JSON snapshot of core collections */
const downloadBackup = catchAsync(async (req, res) => {
  const backup = await backupService.buildBackup(req.user);
  res.setHeader('Content-Disposition', `attachment; filename="backup-${Date.now()}.json"`);
  res.setHeader('Content-Type', 'application/json');
  res.status(200).send(JSON.stringify(backup, null, 2));
});

module.exports = { downloadBackup };
