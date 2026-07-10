const express = require('express');
const backupController = require('../controllers/backupController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const { ROLES } = require('../utils/constants');

const router = express.Router();

router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/backup', backupController.downloadBackup);

module.exports = router;
