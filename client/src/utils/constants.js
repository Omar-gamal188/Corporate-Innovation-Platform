// Mirrors server/src/utils/constants.js so the UI and API never disagree
// about role names, statuses, or domains.

export const ROLES = {
  EMPLOYEE: 'employee',
  COORDINATOR: 'coordinator',
  EVALUATOR: 'evaluator',
  COMMITTEE: 'committee',
  ADMIN: 'admin',
};

export const ROLE_LABELS = {
  [ROLES.EMPLOYEE]: 'Employee',
  [ROLES.COORDINATOR]: 'Coordinator',
  [ROLES.EVALUATOR]: 'Evaluator',
  [ROLES.COMMITTEE]: 'Committee',
  [ROLES.ADMIN]: 'Admin',
};

export const IDEA_STATUS = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  NEEDS_COMPLETION: 'Needs Completion',
  APPROVED_FOR_PILOT: 'Approved for Pilot',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CLOSED: 'Closed',
};

// Color used by the StatusBadge component for each status.
export const STATUS_COLORS = {
  [IDEA_STATUS.DRAFT]: '#6b7280',
  [IDEA_STATUS.SUBMITTED]: '#2563eb',
  [IDEA_STATUS.UNDER_REVIEW]: '#7c3aed',
  [IDEA_STATUS.NEEDS_COMPLETION]: '#d97706',
  [IDEA_STATUS.APPROVED_FOR_PILOT]: '#0891b2',
  [IDEA_STATUS.IN_PROGRESS]: '#0d9488',
  [IDEA_STATUS.COMPLETED]: '#16a34a',
  [IDEA_STATUS.CLOSED]: '#374151',
};

export const IDEA_DOMAINS = ['Service', 'Process', 'Technology'];

export const DECISION_OUTCOMES = {
  APPROVED_FOR_PILOT: 'ApprovedForPilot',
  RETURNED_FOR_DEVELOPMENT: 'ReturnedForDevelopment',
  REJECTED_AND_CLOSED: 'RejectedAndClosed',
};

export const CRITERIA_LABELS = {
  businessImpact: 'Business Impact',
  feasibility: 'Feasibility',
  initialCost: 'Initial Cost',
  innovation: 'Innovation',
  implementationRisk: 'Implementation Risk',
  scalability: 'Scalability',
};
