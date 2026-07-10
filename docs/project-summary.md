# Project Summary — Corporate Innovation Platform

## What it is

An internal web platform that takes an employee's improvement idea from a
first draft all the way to a completed, tracked initiative. Five roles each
own one stage of the journey: **Employee** submits, **Coordinator** screens,
**Evaluator** scores, **Committee** decides and runs execution, **Admin**
manages the system itself. Every step is logged, every rejection needs a
documented reason, and the API — not the UI — is what actually enforces who
can do what.

## The lifecycle, in one line

```
Draft → Submitted → Under Review → (Needs Completion ⟲) → Approved for Pilot
      → In Progress → Completed → Closed
```

Full detail on states, transitions, and business rules: [analysis.md](./analysis.md).

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React (Vite), plain CSS, react-router-dom, axios |
| Backend | Node.js, Express, layered architecture (routes → controllers → services) |
| Database | MongoDB + Mongoose |
| Auth | JWT (access token) + bcrypt password hashing |

## How the pieces fit together

```
Browser (React SPA)
   │  JWT in Authorization header
   ▼
Express API  ──►  authenticate ──► authorize(role) ──► validate ──► controller
                                                                        │
                                                                        ▼
                                                                   service layer
                                                            (all business rules,
                                                             the idea state machine,
                                                             weighted scoring, audit log)
                                                                        │
                                                                        ▼
                                                                   MongoDB
```

Two role-specific write-ups go deeper on each half:
[frontend-summary.md](./frontend-summary.md) and
[backend-summary.md](./backend-summary.md). The data model is in
[erd.md](./erd.md).

## What was delivered

| Area | Deliverable |
|---|---|
| Business analysis | Requirements, business rules, RBAC matrix, validations, per-role workflows — [analysis.md](./analysis.md) |
| Data design | ERD + Mongoose schemas + index rationale — [erd.md](./erd.md) |
| Backend | Full REST API: 9 models, 12 services, 10 route groups, seed script — `server/` |
| Frontend | Full SPA: 9 pages, role-based navigation, shared component library — `client/` |
| Setup docs | [README.md](./README.md) (reference) and [HOW_TO_RUN.md](./HOW_TO_RUN.md) (step-by-step from zero) |
| Demo | [demo-script.md](./demo-script.md) — one idea walked through every role and every security feature |

## Security, at a glance

bcrypt password hashing + policy, JWT with expiry, server-side RBAC on every
route, account lockout after 5 failed logins, input validation on every
endpoint, NoSQL-injection and XSS sanitization, helmet/CORS whitelist/rate
limiting, secrets isolated to `.env`, ownership checks on drafts, a single
gated state machine for idea status, a full audit trail, and a centralized
error handler that never leaks internals. Full mapping of requirement →
implementation: [backend-summary.md](./backend-summary.md#security--implemented-not-just-described).

## Verified working

Not just written — run: seeded a real MongoDB, exercised the live API through
25 automated checks (every role's login, account lockout + admin unlock,
NoSQL-injection resistance, the complete Draft→Closed lifecycle, mandatory
rejection reasons, draft privacy, audit logging), and drove the actual React
app in a headless browser (login → dashboard → idea details → users → audit
log) with zero console errors.

## Demo accounts (password `Passw0rd1` for all)

| Username | Role |
|---|---|
| `admin` | Admin |
| `coordinator1` | Coordinator |
| `evaluator1` | Evaluator |
| `committee1` | Committee |
| `employee1` / `employee2` | Employee |

## Where to go next

- Just want to run it? → [HOW_TO_RUN.md](./HOW_TO_RUN.md)
- Recording a demo? → [demo-script.md](./demo-script.md)
- Reviewing requirements/business rules? → [analysis.md](./analysis.md)
- Reviewing the data model? → [erd.md](./erd.md)
- Reviewing the code architecture? → [frontend-summary.md](./frontend-summary.md) / [backend-summary.md](./backend-summary.md)
