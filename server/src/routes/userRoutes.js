const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { ALL_ROLES, ROLES } = require('../utils/constants');

const router = express.Router();

router.use(authenticate);

router.put(
  '/me/password',
  validate([
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').notEmpty().withMessage('New password is required'),
  ]),
  userController.changeOwnPassword
);

router.get('/', authorize(ROLES.ADMIN), userController.listUsers);

router.post(
  '/',
  authorize(ROLES.ADMIN),
  validate([
    body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
    body('email').isEmail().withMessage('A valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    body('role').isIn(ALL_ROLES).withMessage('Invalid role'),
    body('department').notEmpty().withMessage('Department is required'),
  ]),
  userController.createUser
);

router.put(
  '/:id',
  authorize(ROLES.ADMIN),
  validate([body('role').optional().isIn(ALL_ROLES).withMessage('Invalid role')]),
  userController.updateUser
);

router.post('/:id/unlock', authorize(ROLES.ADMIN), userController.unlockUser);

module.exports = router;
