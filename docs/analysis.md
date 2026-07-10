# Corporate Innovation Platform — Business Analysis

## 1. Purpose

An internal platform that lets employees submit improvement ideas and routes each idea through
screening, evaluation, committee decision, and execution until it is completed or closed —
with a full audit trail at every step.

## 2. Actors (Roles)

| Role | Description |
|---|---|
| Employee | Submits ideas, edits own drafts, responds to completion requests, tracks status |
| Coordinator | Performs initial screening, checks completeness/duplicates, forwards or bounces back |
| Evaluator | Scores ideas against weighted criteria, writes a recommendation |
| Committee | Makes the pilot/return/reject decision, manages execution assignment |
| Admin | Manages users & roles, edits criteria weights, views audit log, triggers backup |

Every user has exactly one role in this version (single-role RBAC — simplest model that satisfies
all stated requirements; multi-role-per-user is a possible future extension, not built here).

## 3. Idea Lifecycle (State Machine)

```
Draft → Submitted → Under Review → Needs Completion → Submitted (resubmit loop)
                          │
                          ├──────────────→ Under Review (forwarded to evaluation, unchanged label,
                          │                 evaluation happens while status = "Under Review")
                          ▼
                    (Evaluator scores while status = Under Review)
                          ▼
                 Committee Decision
                 ├─ Approve for Pilot → Approved for Pilot → In Progress → Completed → Closed
                 ├─ Return for Development → Needs Completion → (owner edits) → Submitted → Under Review
                 └─ Reject & Close → Closed (reason mandatory, visible to owner)
```

The 8 canonical statuses (exactly as specified):

1. **Draft** — owner-only, incomplete fields allowed, not visible to anyone else
2. **Submitted** — owner submitted for screening, visible to Coordinator
3. **Under Review** — passed screening, being evaluated by Evaluator(s) and decided by Committee
4. **Needs Completion** — sent back (by Coordinator during screening OR Committee after decision)
   with a mandatory note; owner can edit and resubmit
5. **Approved for Pilot** — Committee approved; awaiting execution assignment
6. **In Progress** — execution owner + due date assigned, progress updates being logged
7. **Completed** — execution owner submitted the final report
8. **Closed** — terminal: either rejected by Committee (reason mandatory) or manually closed after
   completion (archival)

### 3.1 Allowed transitions (server-enforced — see `docs/erd.md` / `ideaService`)

| From | To | Who | Note required? |
|---|---|---|---|
| Draft | Submitted | Employee (owner) | No |
| Draft | Draft (edit) | Employee (owner) | No |
| Submitted | Under Review | Coordinator | No |
| Submitted | Needs Completion | Coordinator | Yes |
| Needs Completion | Submitted | Employee (owner) | No |
| Under Review | Approved for Pilot | Committee | No (recommended, not mandatory) |
| Under Review | Needs Completion | Committee | Yes |
| Under Review | Closed | Committee | Yes |
| Approved for Pilot | In Progress | Committee | No |
| In Progress | Completed | Execution owner or Committee | No (final report required) |
| Completed | Closed | Committee or Admin | No |

Any transition not in this table is rejected by the API with `403/409`, regardless of what the
UI shows.

## 4. Functional Requirements

### FR-1 — Idea Submission (Employee)
1.1 Employee can create an idea with fields: title, domain (Service/Process/Technology),
    department, problem/opportunity, proposed solution, expected impact, initial cost,
    implementation requirements, risks & dependencies, attachments.
1.2 Employee can **Save as Draft** at any time — required-field validation is relaxed.
1.3 Employee can **Submit for Review** — all required fields are enforced at this point.
1.4 Before submitting, the system runs duplicate detection (title + problem statement similarity)
    and shows similar existing ideas to the employee.
1.5 Employee can edit their own Draft or an idea in "Needs Completion" status; cannot edit any
    other status or another employee's idea.
1.6 Employee can view the full status history / timeline of their own ideas.

### FR-2 — Coordinator Screening
2.1 Coordinator sees all ideas in "Submitted" status.
2.2 Coordinator runs/reviews a completeness + duplicate check.
2.3 Coordinator forwards the idea to evaluation (→ Under Review) or requests completion
    (→ Needs Completion) with a **mandatory** note. The owner is notified either way.

### FR-3 — Evaluation
3.1 Evaluator sees ideas in "Under Review" status without a finalized evaluation.
3.2 Evaluator scores each of the 6 weighted criteria (0–100 each) and writes a recommendation.
3.3 The weighted total is auto-calculated using the current `CriteriaWeights` (admin-editable,
    must total 100%).
3.4 Total ≥ 80 → system recommendation "Recommend Pilot"; 60–79 → "Needs Development";
    < 60 → "Archive" (recommendation is advisory; Committee makes the actual decision).

### FR-4 — Committee Decision
4.1 Committee sees evaluated ideas ("Under Review" with a completed evaluation).
4.2 Committee decides: Approve for Pilot / Return for Development / Reject & Close.
4.3 A documented reason is **mandatory** for Return and Reject, and is shown to the idea owner.
4.4 Approve for Pilot moves the idea to "Approved for Pilot"; Committee then assigns an
    execution owner + due date to start "In Progress".

### FR-5 — Execution
5.1 Execution owner (or Committee) logs progress updates while "In Progress".
5.2 Execution owner submits a final report to move the idea to "Completed".
5.3 Committee/Admin can Close a Completed idea (archival).

### FR-6 — Notifications
6.1 Every status change creates an in-app notification for the relevant user(s) (idea owner,
    and, where applicable, the newly-responsible role's queue).
6.2 Users can mark notifications as read and see an unread count.

### FR-7 — Audit Log
7.1 Every mutating action (create, update, transition, decision, weight change, user management)
    writes an audit log entry: who, when, what action, what note/target.
7.2 Only Admin can view the audit log.

### FR-8 — Admin
8.1 Admin manages users (create, change role, activate/deactivate, unlock).
8.2 Admin edits criteria weights (must total exactly 100%).
8.3 Admin views audit log and dashboard-wide reports.
8.4 Admin can trigger a JSON backup export of core collections.

### FR-9 — Dashboard & Reports
9.1 KPI cards: total ideas, under evaluation, approved for pilot, completed.
9.2 Conversion funnel: Submitted → Under Review → Approved for Pilot → Completed.
9.3 Breakdown by department and by domain.
9.4 Average evaluation time (Submitted → decision timestamp).
9.5 Implementation rate (Completed / Approved for Pilot).

## 5. Business Rules

- BR-1: An idea cannot be evaluated until it has left Draft (i.e., is "Under Review").
- BR-2: Draft ideas may have empty optional/required fields; Submitted ideas must pass full
  validation before the transition is accepted by the server.
- BR-3: No idea may reach "Closed" via rejection or "Needs Completion" without a non-empty
  documented reason/note (min 10 characters).
- BR-4: Criteria weights must always sum to exactly 100; the update is rejected otherwise.
- BR-5: Only the idea owner may edit a Draft or a "Needs Completion" idea; all other
  roles/idea-status combinations are read-only for edits (ownership check server-side).
- BR-6: Attachments: allowed MIME types are images (png/jpg/jpeg/gif/webp), PDF, and Office docs
  (doc/docx/xls/xlsx/ppt/pptx); max size 5MB per file; enforced client-side (UX) and
  server-side (multer fileFilter + limits — authoritative).
- BR-7: A user locked out after 5 consecutive failed logins cannot authenticate for 15 minutes,
  even with the correct password.
- BR-8: State transitions are only ever executed inside `ideaService`, which checks
  (current status, requested transition, caller role, ownership) before writing anything.

## 6. Roles & Permissions Matrix

| Action | Employee | Coordinator | Evaluator | Committee | Admin |
|---|:---:|:---:|:---:|:---:|:---:|
| Create idea / save draft | ✔ (own) | – | – | – | – |
| Submit idea | ✔ (own) | – | – | – | – |
| Edit draft / needs-completion idea | ✔ (own) | – | – | – | – |
| View own ideas | ✔ | ✔ | ✔ | ✔ | ✔ |
| View all ideas | – | ✔ | ✔ | ✔ | ✔ |
| Screen (forward / request completion) | – | ✔ | – | – | – |
| Score / evaluate | – | – | ✔ | – | – |
| Approve / Return / Reject | – | – | – | ✔ | – |
| Assign execution owner + due date | – | – | – | ✔ | – |
| Log progress update | ✔ (if exec owner) | – | – | ✔ | – |
| Submit final report | ✔ (if exec owner) | – | – | ✔ | – |
| Close idea | – | – | – | ✔ | ✔ |
| Manage users/roles | – | – | – | – | ✔ |
| Edit criteria weights | – | – | – | – | ✔ |
| View audit log | – | – | – | – | ✔ |
| View dashboard/reports | ✔ (own scope) | ✔ | ✔ | ✔ | ✔ |

## 7. Validations (summary — full detail in code via express-validator + Mongoose)

- Username: 3–30 chars, alphanumeric + `._-`, unique.
- Password: min 8 chars, at least one letter and one number (policy enforced at registration
  and admin-created accounts; hashed with bcrypt, never stored/returned in plain text).
- Idea title: 5–150 chars, required at submit time.
- Idea domain: enum `Service | Process | Technology`.
- Department: must reference an existing `Department` document.
- Initial cost: number ≥ 0.
- Problem/solution/impact/requirements/risks: required at submit time, 10–5000 chars each.
- Evaluation scores: number 0–100 for each of the 6 criteria.
- Decision reason: required, min 10 chars, when decision is Return or Reject.
- Attachment: MIME whitelist + 5MB limit (client AND server).
- Criteria weights: 6 numeric fields, each ≥ 0, sum === 100.

## 8. Step-by-Step Workflow per Role

**Employee:** Login → New Idea → fill form → Save Draft (optional, repeatable) → Submit
→ system runs duplicate check and shows similar ideas → confirm submit → track status on
"My Ideas" → if "Needs Completion", edit and resubmit → view final decision/reason and,
once Completed, view final report.

**Coordinator:** Login → "Screening Queue" (Submitted ideas) → open idea → review completeness
+ duplicate list → Forward to Evaluation **or** Request Completion (note required) → owner
notified.

**Evaluator:** Login → "Evaluation Queue" (Under Review, unscored) → open idea → enter 6 scores
+ recommendation text → submit → weighted total + suggested outcome auto-computed → idea now
visible to Committee.

**Committee:** Login → "Decision Queue" (Under Review, scored) → review evaluation → Approve for
Pilot / Return for Development (note) / Reject & Close (note) → for approvals, later assign
execution owner + due date from "Execution" tab → monitor progress updates → mark Completed →
optionally Close.

**Admin:** Login → Users page (create/edit/lock/unlock/role change) → Settings page (edit
criteria weights, must total 100%) → Audit Log page (filter by user/action/date) → Dashboard
(platform-wide reports) → Backup (download JSON export).

## 9. Suggested Extra Features (not mandatory, marked clearly, implemented as stretch value)

- **Suggested:** Search/filter on Ideas List (by status, domain, department, keyword).
- **Suggested:** Idea timeline component showing full status history with timestamps + actors.
- **Suggested:** Human-readable reference codes, e.g. `IDEA-0001`, auto-generated and unique.
- **Suggested:** Password strength meter on the registration/change-password form (client-side
  UX hint only — the real policy is still enforced server-side).
- **Suggested:** Unread notification badge in the top nav.
- **Suggested:** CSV-style JSON backup export button for Admin.
