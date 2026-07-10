const express = require('express');
const { body } = require('express-validator');
const ideaController = require('../controllers/ideaController');
const evaluationController = require('../controllers/evaluationController');
const decisionController = require('../controllers/decisionController');
const executionController = require('../controllers/executionController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');
const { ROLES, ALL_IDEA_DOMAINS, DECISION_OUTCOME } = require('../utils/constants');

const router = express.Router();

router.use(authenticate);

router.get('/', ideaController.listIdeas);

router.post(
  '/',
  authorize(ROLES.EMPLOYEE),
  validate([
    body('title').trim().isLength({ min: 5, max: 150 }).withMessage('Title must be 5-150 characters'),
    body('domain').isIn(ALL_IDEA_DOMAINS).withMessage('Invalid idea domain'),
    body('department').notEmpty().withMessage('Department is required'),
    body('initialCost').optional().isFloat({ min: 0 }).withMessage('Initial cost must be a non-negative number'),
  ]),
  ideaController.createDraft
);

router.get('/:id', ideaController.getIdea);
router.get('/:id/duplicates', ideaController.checkDuplicates);

router.put(
  '/:id',
  authorize(ROLES.EMPLOYEE),
  validate([
    body('title').optional().trim().isLength({ min: 5, max: 150 }).withMessage('Title must be 5-150 characters'),
    body('domain').optional().isIn(ALL_IDEA_DOMAINS).withMessage('Invalid idea domain'),
    body('initialCost').optional().isFloat({ min: 0 }).withMessage('Initial cost must be a non-negative number'),
  ]),
  ideaController.updateIdea
);

router.post('/:id/submit', authorize(ROLES.EMPLOYEE), ideaController.submitForReview);

router.post('/:id/attachments', authorize(ROLES.EMPLOYEE), upload.array('files', 5), ideaController.addAttachments);
router.get('/:id/attachments/:storedName', ideaController.downloadAttachment);

router.post('/:id/screen/forward', authorize(ROLES.COORDINATOR), ideaController.forwardToEvaluation);

router.post(
  '/:id/screen/request-completion',
  authorize(ROLES.COORDINATOR),
  validate([body('note').trim().isLength({ min: 10 }).withMessage('A note of at least 10 characters is required')]),
  ideaController.requestCompletion
);

router.get('/:id/evaluation', evaluationController.getEvaluation);
router.post(
  '/:id/evaluation',
  authorize(ROLES.EVALUATOR),
  validate([
    body('scores.businessImpact').isFloat({ min: 0, max: 100 }),
    body('scores.feasibility').isFloat({ min: 0, max: 100 }),
    body('scores.initialCost').isFloat({ min: 0, max: 100 }),
    body('scores.innovation').isFloat({ min: 0, max: 100 }),
    body('scores.implementationRisk').isFloat({ min: 0, max: 100 }),
    body('scores.scalability').isFloat({ min: 0, max: 100 }),
  ]),
  evaluationController.submitEvaluation
);

router.get('/:id/decision', decisionController.getDecision);
router.post(
  '/:id/decision',
  authorize(ROLES.COMMITTEE),
  validate([
    body('outcome').isIn(Object.values(DECISION_OUTCOME)).withMessage('Invalid decision outcome'),
    body('reason').optional().trim(),
  ]),
  decisionController.makeDecision
);

router.get('/:id/execution', executionController.getExecution);
router.post(
  '/:id/execution',
  authorize(ROLES.COMMITTEE),
  validate([
    body('ownerId').notEmpty().withMessage('An execution owner is required'),
    body('dueDate').isISO8601().withMessage('A valid due date is required'),
  ]),
  executionController.assignExecution
);
router.post(
  '/:id/execution/progress',
  validate([body('note').trim().notEmpty().withMessage('A progress note is required')]),
  executionController.addProgressUpdate
);
router.post(
  '/:id/execution/complete',
  validate([body('finalReport').trim().notEmpty().withMessage('A final report is required')]),
  executionController.completeExecution
);

router.post('/:id/close', authorize(ROLES.COMMITTEE, ROLES.ADMIN), ideaController.closeIdea);

module.exports = router;
