/**
 * Single source of truth for roles, idea statuses, and default criteria weights.
 * Both services and validators import from here so nothing can drift out of sync.
 */

const ROLES = Object.freeze({
  EMPLOYEE: 'employee',
  COORDINATOR: 'coordinator',
  EVALUATOR: 'evaluator',
  COMMITTEE: 'committee',
  ADMIN: 'admin',
});

const ALL_ROLES = Object.values(ROLES);

const IDEA_STATUS = Object.freeze({
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  NEEDS_COMPLETION: 'Needs Completion',
  APPROVED_FOR_PILOT: 'Approved for Pilot',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CLOSED: 'Closed',
});

const ALL_IDEA_STATUSES = Object.values(IDEA_STATUS);

const IDEA_DOMAIN = Object.freeze({
  SERVICE: 'Service',
  PROCESS: 'Process',
  TECHNOLOGY: 'Technology',
});

const ALL_IDEA_DOMAINS = Object.values(IDEA_DOMAIN);

const DECISION_OUTCOME = Object.freeze({
  APPROVED_FOR_PILOT: 'ApprovedForPilot',
  RETURNED_FOR_DEVELOPMENT: 'ReturnedForDevelopment',
  REJECTED_AND_CLOSED: 'RejectedAndClosed',
});

const SYSTEM_SUGGESTION = Object.freeze({
  RECOMMEND_PILOT: 'RecommendPilot',
  NEEDS_DEVELOPMENT: 'NeedsDevelopment',
  ARCHIVE: 'Archive',
});

// Default weighted evaluation criteria (percent). Must always total 100.
const DEFAULT_CRITERIA_WEIGHTS = Object.freeze({
  businessImpact: 25,
  feasibility: 20,
  initialCost: 15,
  innovation: 15,
  implementationRisk: 10,
  scalability: 15,
});

const CRITERIA_KEYS = Object.keys(DEFAULT_CRITERIA_WEIGHTS);

const ALLOWED_ATTACHMENT_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

module.exports = {
  ROLES,
  ALL_ROLES,
  IDEA_STATUS,
  ALL_IDEA_STATUSES,
  IDEA_DOMAIN,
  ALL_IDEA_DOMAINS,
  DECISION_OUTCOME,
  SYSTEM_SUGGESTION,
  DEFAULT_CRITERIA_WEIGHTS,
  CRITERIA_KEYS,
  ALLOWED_ATTACHMENT_MIME_TYPES,
};
