const express = require('express');
const { body } = require('express-validator');
const departmentController = require('../controllers/departmentController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { ROLES } = require('../utils/constants');

const router = express.Router();

router.use(authenticate);

router.get('/', departmentController.listDepartments);

router.post(
  '/',
  authorize(ROLES.ADMIN),
  validate([
    body('name').trim().notEmpty().withMessage('Department name is required'),
    body('code').trim().notEmpty().withMessage('Department code is required'),
  ]),
  departmentController.createDepartment
);

module.exports = router;
