const express = require('express');
const { body } = require('express-validator');
const criteriaWeightsController = require('../controllers/criteriaWeightsController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { ROLES, CRITERIA_KEYS } = require('../utils/constants');

const router = express.Router();

router.use(authenticate);

router.get('/', criteriaWeightsController.getWeights);

router.put(
  '/',
  authorize(ROLES.ADMIN),
  validate(CRITERIA_KEYS.map((key) => body(key).isFloat({ min: 0 }).withMessage(`${key} must be a non-negative number`))),
  criteriaWeightsController.updateWeights
);

module.exports = router;
