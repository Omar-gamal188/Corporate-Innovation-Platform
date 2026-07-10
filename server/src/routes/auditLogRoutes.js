const express = require('express');
const auditLogController = require('../controllers/auditLogController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const { ROLES } = require('../utils/constants');

const router = express.Router();

router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/', auditLogController.listAuditLog);

module.exports = router;
