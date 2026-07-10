/**
 * Seeds the database with one demo account per role and a sample idea in
 * every lifecycle status, so the app can be explored/demoed immediately
 * after `npm install`. Safe to re-run — it wipes and recreates everything.
 *
 * Usage: npm run seed
 */
require('dotenv').config();
const mongoose = require('mongoose');
const env = require('./src/config/env');
const { hashPassword } = require('./src/services/authService');

const Department = require('./src/models/Department');
const User = require('./src/models/User');
const Idea = require('./src/models/Idea');
const Evaluation = require('./src/models/Evaluation');
const Decision = require('./src/models/Decision');
const Execution = require('./src/models/Execution');
const CriteriaWeights = require('./src/models/CriteriaWeights');
const Notification = require('./src/models/Notification');
const AuditLog = require('./src/models/AuditLog');
const Counter = require('./src/models/Counter');

const { ROLES, IDEA_STATUS, IDEA_DOMAIN, DECISION_OUTCOME, SYSTEM_SUGGESTION } = require('./src/utils/constants');

async function wipeDatabase() {
  await Promise.all([
    Department.deleteMany({}),
    User.deleteMany({}),
    Idea.deleteMany({}),
    Evaluation.deleteMany({}),
    Decision.deleteMany({}),
    Execution.deleteMany({}),
    CriteriaWeights.deleteMany({}),
    Notification.deleteMany({}),
    AuditLog.deleteMany({}),
    Counter.deleteMany({}),
  ]);
}

async function seedDepartments() {
  return Department.insertMany([
    { name: 'Information Technology', code: 'IT' },
    { name: 'Human Resources', code: 'HR' },
    { name: 'Operations', code: 'OPS' },
    { name: 'Finance', code: 'FIN' },
  ]);
}

async function seedUsers(departments) {
  const [it, hr, ops, fin] = departments;
  const password = 'Passw0rd1'; // demo password shared by every seed account, see docs/README.md

  const passwordHash = await hashPassword(password);
  const users = await User.insertMany([
    { username: 'admin', email: 'admin@demo.local', passwordHash, role: ROLES.ADMIN, department: it._id },
    { username: 'coordinator1', email: 'coordinator1@demo.local', passwordHash, role: ROLES.COORDINATOR, department: hr._id },
    { username: 'evaluator1', email: 'evaluator1@demo.local', passwordHash, role: ROLES.EVALUATOR, department: ops._id },
    { username: 'committee1', email: 'committee1@demo.local', passwordHash, role: ROLES.COMMITTEE, department: fin._id },
    { username: 'employee1', email: 'employee1@demo.local', passwordHash, role: ROLES.EMPLOYEE, department: it._id },
    { username: 'employee2', email: 'employee2@demo.local', passwordHash, role: ROLES.EMPLOYEE, department: ops._id },
  ]);
  return users;
}

async function nextCode() {
  const counter = await Counter.findOneAndUpdate({ name: 'idea' }, { $inc: { value: 1 } }, { new: true, upsert: true });
  return `IDEA-${String(counter.value).padStart(4, '0')}`;
}

/** Builds a statusHistory array walking through the given (status, actor) pairs in order. */
function buildHistory(steps) {
  return steps.map(({ to, by, note = '' }, i) => ({
    from: i === 0 ? undefined : steps[i - 1].to,
    to,
    by: by._id,
    note,
    at: new Date(Date.now() - (steps.length - i) * 3600 * 1000),
  }));
}

async function seedIdeas(departments, users) {
  const [it, hr, ops] = departments;
  const [admin, coordinator, evaluator, committee, employee1, employee2] = users;

  // 1. Draft — created, never submitted.
  await Idea.create({
    code: await nextCode(),
    owner: employee1._id,
    department: it._id,
    title: 'Self-service password reset portal',
    domain: IDEA_DOMAIN.TECHNOLOGY,
    problemStatement: 'IT helpdesk spends hours per week resetting forgotten passwords.',
    proposedSolution: '',
    expectedImpact: '',
    initialCost: 0,
    implementationRequirements: '',
    risksAndDependencies: '',
    status: IDEA_STATUS.DRAFT,
    statusHistory: buildHistory([{ to: IDEA_STATUS.DRAFT, by: employee1, note: 'Draft created' }]),
  });

  // 2. Submitted — awaiting coordinator screening.
  await Idea.create({
    code: await nextCode(),
    owner: employee1._id,
    department: it._id,
    title: 'Automated onboarding checklist for new hires',
    domain: IDEA_DOMAIN.PROCESS,
    problemStatement: 'New hires currently rely on a manual, error-prone paper checklist.',
    proposedSolution: 'Build a digital checklist with automatic task assignment and reminders.',
    expectedImpact: 'Reduces onboarding errors and saves HR ~5 hours per new hire.',
    initialCost: 2000,
    implementationRequirements: 'Small internal web app, HR system integration.',
    risksAndDependencies: 'Depends on HRIS API access.',
    status: IDEA_STATUS.SUBMITTED,
    statusHistory: buildHistory([
      { to: IDEA_STATUS.DRAFT, by: employee1, note: 'Draft created' },
      { to: IDEA_STATUS.SUBMITTED, by: employee1, note: 'Submitted for review' },
    ]),
  });

  // 3. Under Review — forwarded by coordinator, not yet evaluated.
  await Idea.create({
    code: await nextCode(),
    owner: employee2._id,
    department: ops._id,
    title: 'Predictive maintenance for warehouse equipment',
    domain: IDEA_DOMAIN.TECHNOLOGY,
    problemStatement: 'Unplanned equipment downtime disrupts warehouse operations.',
    proposedSolution: 'Use IoT sensors and a simple ML model to predict failures before they happen.',
    expectedImpact: 'Reduce unplanned downtime by an estimated 30%.',
    initialCost: 15000,
    implementationRequirements: 'IoT sensors, data pipeline, small ML model.',
    risksAndDependencies: 'Requires capital budget approval; sensor vendor lead time.',
    status: IDEA_STATUS.UNDER_REVIEW,
    statusHistory: buildHistory([
      { to: IDEA_STATUS.DRAFT, by: employee2, note: 'Draft created' },
      { to: IDEA_STATUS.SUBMITTED, by: employee2, note: 'Submitted for review' },
      { to: IDEA_STATUS.UNDER_REVIEW, by: coordinator, note: 'Screening passed, forwarded to evaluation' },
    ]),
  });

  // 4. Needs Completion — coordinator sent it back with a note.
  await Idea.create({
    code: await nextCode(),
    owner: employee1._id,
    department: hr._id,
    title: 'Employee wellness rewards program',
    domain: IDEA_DOMAIN.SERVICE,
    problemStatement: 'Low participation in existing wellness initiatives.',
    proposedSolution: 'Introduce a points-based rewards program for healthy habits.',
    expectedImpact: 'Improve participation and reduce sick-leave rate.',
    initialCost: 5000,
    implementationRequirements: 'Rewards platform, budget for prizes.',
    risksAndDependencies: 'Needs legal review for prize eligibility rules.',
    status: IDEA_STATUS.NEEDS_COMPLETION,
    statusHistory: buildHistory([
      { to: IDEA_STATUS.DRAFT, by: employee1, note: 'Draft created' },
      { to: IDEA_STATUS.SUBMITTED, by: employee1, note: 'Submitted for review' },
      {
        to: IDEA_STATUS.NEEDS_COMPLETION,
        by: coordinator,
        note: 'Please clarify the expected budget and add a rollout timeline before we can screen this further.',
      },
    ]),
  });

  // 5. Approved for Pilot — evaluated and approved by committee, execution not yet assigned.
  const approvedIdea = await Idea.create({
    code: await nextCode(),
    owner: employee2._id,
    department: it._id,
    title: 'Internal knowledge-base chatbot',
    domain: IDEA_DOMAIN.TECHNOLOGY,
    problemStatement: 'Employees waste time searching scattered internal documentation.',
    proposedSolution: 'Deploy a chatbot that answers questions from the internal knowledge base.',
    expectedImpact: 'Cut average time-to-answer for internal questions significantly.',
    initialCost: 8000,
    implementationRequirements: 'Chatbot platform, knowledge base indexing.',
    risksAndDependencies: 'Requires ongoing content maintenance.',
    status: IDEA_STATUS.APPROVED_FOR_PILOT,
    statusHistory: buildHistory([
      { to: IDEA_STATUS.DRAFT, by: employee2, note: 'Draft created' },
      { to: IDEA_STATUS.SUBMITTED, by: employee2, note: 'Submitted for review' },
      { to: IDEA_STATUS.UNDER_REVIEW, by: coordinator, note: 'Screening passed, forwarded to evaluation' },
      { to: IDEA_STATUS.APPROVED_FOR_PILOT, by: committee, note: 'Strong business case, approved for pilot' },
    ]),
  });
  await Evaluation.create({
    idea: approvedIdea._id,
    evaluator: evaluator._id,
    scores: { businessImpact: 85, feasibility: 80, initialCost: 70, innovation: 90, implementationRisk: 75, scalability: 85 },
    weightedTotal: 82.25,
    recommendation: 'High-impact, feasible, recommend pilot.',
    systemSuggestion: SYSTEM_SUGGESTION.RECOMMEND_PILOT,
  });
  await Decision.create({
    idea: approvedIdea._id,
    decidedBy: committee._id,
    outcome: DECISION_OUTCOME.APPROVED_FOR_PILOT,
    reason: 'Strong business case, approved for pilot',
  });

  // 6. In Progress — execution assigned, progress logged.
  const inProgressIdea = await Idea.create({
    code: await nextCode(),
    owner: employee1._id,
    department: ops._id,
    title: 'Paperless invoice approval workflow',
    domain: IDEA_DOMAIN.PROCESS,
    problemStatement: 'Paper-based invoice approvals cause delays and lost documents.',
    proposedSolution: 'Digital approval workflow with e-signatures and audit trail.',
    expectedImpact: 'Cut invoice approval time from days to hours.',
    initialCost: 6000,
    implementationRequirements: 'Workflow tool, finance system integration.',
    risksAndDependencies: 'Depends on finance team availability for testing.',
    status: IDEA_STATUS.IN_PROGRESS,
    statusHistory: buildHistory([
      { to: IDEA_STATUS.DRAFT, by: employee1, note: 'Draft created' },
      { to: IDEA_STATUS.SUBMITTED, by: employee1, note: 'Submitted for review' },
      { to: IDEA_STATUS.UNDER_REVIEW, by: coordinator, note: 'Screening passed, forwarded to evaluation' },
      { to: IDEA_STATUS.APPROVED_FOR_PILOT, by: committee, note: 'Approved for pilot' },
      { to: IDEA_STATUS.IN_PROGRESS, by: committee, note: 'Execution started' },
    ]),
  });
  await Evaluation.create({
    idea: inProgressIdea._id,
    evaluator: evaluator._id,
    scores: { businessImpact: 80, feasibility: 85, initialCost: 75, innovation: 65, implementationRisk: 80, scalability: 70 },
    weightedTotal: 77.25,
    recommendation: 'Solid process improvement, manageable risk.',
    systemSuggestion: SYSTEM_SUGGESTION.NEEDS_DEVELOPMENT,
  });
  await Decision.create({
    idea: inProgressIdea._id,
    decidedBy: committee._id,
    outcome: DECISION_OUTCOME.APPROVED_FOR_PILOT,
    reason: 'Approved for pilot after minor clarifications',
  });
  await Execution.create({
    idea: inProgressIdea._id,
    owner: employee1._id,
    dueDate: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    progressUpdates: [{ note: 'Workflow tool selected, integration design in progress.', by: employee1._id, at: new Date() }],
  });

  // 7. Completed — execution finished with a final report.
  const completedIdea = await Idea.create({
    code: await nextCode(),
    owner: employee2._id,
    department: hr._id,
    title: 'Digital exit-interview survey',
    domain: IDEA_DOMAIN.SERVICE,
    problemStatement: 'Exit interviews were inconsistent and rarely analyzed.',
    proposedSolution: 'Standardized digital survey with automatic trend reporting.',
    expectedImpact: 'Actionable retention insights every quarter.',
    initialCost: 1000,
    implementationRequirements: 'Survey tool subscription.',
    risksAndDependencies: 'None significant.',
    status: IDEA_STATUS.COMPLETED,
    statusHistory: buildHistory([
      { to: IDEA_STATUS.DRAFT, by: employee2, note: 'Draft created' },
      { to: IDEA_STATUS.SUBMITTED, by: employee2, note: 'Submitted for review' },
      { to: IDEA_STATUS.UNDER_REVIEW, by: coordinator, note: 'Screening passed, forwarded to evaluation' },
      { to: IDEA_STATUS.APPROVED_FOR_PILOT, by: committee, note: 'Approved for pilot' },
      { to: IDEA_STATUS.IN_PROGRESS, by: committee, note: 'Execution started' },
      { to: IDEA_STATUS.COMPLETED, by: employee2, note: 'Final report submitted' },
    ]),
  });
  await Evaluation.create({
    idea: completedIdea._id,
    evaluator: evaluator._id,
    scores: { businessImpact: 75, feasibility: 90, initialCost: 90, innovation: 60, implementationRisk: 90, scalability: 70 },
    weightedTotal: 80.25,
    recommendation: 'Low cost, low risk, good candidate for a quick pilot.',
    systemSuggestion: SYSTEM_SUGGESTION.RECOMMEND_PILOT,
  });
  await Decision.create({
    idea: completedIdea._id,
    decidedBy: committee._id,
    outcome: DECISION_OUTCOME.APPROVED_FOR_PILOT,
    reason: 'Low cost, quick to pilot, approved',
  });
  await Execution.create({
    idea: completedIdea._id,
    owner: employee2._id,
    dueDate: new Date(Date.now() - 5 * 24 * 3600 * 1000),
    progressUpdates: [{ note: 'Survey tool configured and piloted with one department.', by: employee2._id, at: new Date(Date.now() - 10 * 24 * 3600 * 1000) }],
    finalReport: 'Rolled out company-wide; response rate at 68%, first trend report delivered to HR leadership.',
    completedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
  });

  // 8. Closed — rejected by committee with a mandatory reason.
  const closedIdea = await Idea.create({
    code: await nextCode(),
    owner: employee1._id,
    department: ops._id,
    title: 'Company-wide 4-day work week trial',
    domain: IDEA_DOMAIN.PROCESS,
    problemStatement: 'Employee survey shows interest in more flexible schedules.',
    proposedSolution: 'Trial a 4-day work week in one department for a quarter.',
    expectedImpact: 'Improved morale, uncertain productivity impact.',
    initialCost: 0,
    implementationRequirements: 'Policy changes, client communication plan.',
    risksAndDependencies: 'High risk to client SLAs during trial.',
    status: IDEA_STATUS.CLOSED,
    statusHistory: buildHistory([
      { to: IDEA_STATUS.DRAFT, by: employee1, note: 'Draft created' },
      { to: IDEA_STATUS.SUBMITTED, by: employee1, note: 'Submitted for review' },
      { to: IDEA_STATUS.UNDER_REVIEW, by: coordinator, note: 'Screening passed, forwarded to evaluation' },
      {
        to: IDEA_STATUS.CLOSED,
        by: committee,
        note: 'Rejected: conflicts with current client SLA commitments; revisit in a future planning cycle.',
      },
    ]),
  });
  await Evaluation.create({
    idea: closedIdea._id,
    evaluator: evaluator._id,
    scores: { businessImpact: 40, feasibility: 30, initialCost: 60, innovation: 50, implementationRisk: 20, scalability: 40 },
    weightedTotal: 37.5,
    recommendation: 'High operational risk given current client commitments.',
    systemSuggestion: SYSTEM_SUGGESTION.ARCHIVE,
  });
  await Decision.create({
    idea: closedIdea._id,
    decidedBy: committee._id,
    outcome: DECISION_OUTCOME.REJECTED_AND_CLOSED,
    reason: 'Rejected: conflicts with current client SLA commitments; revisit in a future planning cycle.',
  });

  return { admin, coordinator, evaluator, committee, employee1, employee2 };
}

async function run() {
  await mongoose.connect(env.mongoUri);
  console.log(`[seed] connected to ${env.mongoUri}`);

  await wipeDatabase();
  console.log('[seed] wiped existing collections');

  const departments = await seedDepartments();
  console.log(`[seed] created ${departments.length} departments`);

  const users = await seedUsers(departments);
  console.log(`[seed] created ${users.length} users`);

  await CriteriaWeights.create({});
  console.log('[seed] created default criteria weights');

  await seedIdeas(departments, users);
  console.log('[seed] created sample ideas covering all 8 statuses');

  console.log('\nDemo accounts (all use password: Passw0rd1):');
  console.log('  admin / coordinator1 / evaluator1 / committee1 / employee1 / employee2');

  await mongoose.disconnect();
  console.log('[seed] done');
}

run().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
