# Corporate Innovation Platform

An internal platform for submitting, screening, evaluating, deciding, and executing
employee improvement ideas — with full role-based access control and an audit trail
on every action. See [analysis.md](./analysis.md) for requirements/business rules and
[erd.md](./erd.md) for the data model.

## 1. Prerequisites

- Node.js 18+ and npm
- MongoDB running locally (default: `mongodb://127.0.0.1:27017`), or a connection string
  to any reachable MongoDB instance

## 2. Project layout

```
server/   Express + MongoDB REST API
client/   React (Vite) frontend
docs/     analysis.md, erd.md, README.md (this file), demo-script.md
```

## 3. Backend setup

```bash
cd server
npm install
cp .env.example .env      # then edit .env if your Mongo URI/secrets differ
npm run seed               # wipes and recreates demo data (departments, users, sample ideas)
npm run dev                 # starts the API on http://localhost:5000 (nodemon, auto-reload)
```

`npm start` runs the same server without nodemon (production-style).

Health check: `GET http://localhost:5000/api/health`

### Required `.env` values

See `server/.env.example` for the full list (Mongo URI, JWT secret/expiry, CORS origin,
lockout thresholds, upload limits). **Never commit a real `.env` file.**

## 4. Frontend setup

```bash
cd client
npm install
cp .env.example .env       # VITE_API_URL defaults to http://localhost:5000/api
npm run dev                  # starts the app on http://localhost:5173
```

Open http://localhost:5173 — you'll be redirected to `/login`.

## 5. Demo accounts

All seeded accounts share the password below (meets the password policy: 8+ chars,
letters + numbers). Re-run `npm run seed` any time to reset to this clean state.

| Username | Password | Role | Purpose |
|---|---|---|---|
| `admin` | `Passw0rd1` | Admin | Manage users/roles, edit criteria weights, view audit log |
| `coordinator1` | `Passw0rd1` | Coordinator | Screen submitted ideas, forward or request completion |
| `evaluator1` | `Passw0rd1` | Evaluator | Score ideas against weighted criteria |
| `committee1` | `Passw0rd1` | Committee | Approve/return/reject, assign & manage execution |
| `employee1` | `Passw0rd1` | Employee | Submit ideas, edit own drafts, track status |
| `employee2` | `Passw0rd1` | Employee | A second employee, used for ownership-check scenarios |

The seed script also creates 4 departments and one sample idea in **every** one of the
8 lifecycle statuses (Draft, Submitted, Under Review, Needs Completion, Approved for
Pilot, In Progress, Completed, Closed), plus a default set of criteria weights that
already total 100%.

## 6. API endpoints

All routes are prefixed with `/api`. Every route except `/auth/login` and
`/health` requires `Authorization: Bearer <token>`. Roles listed are enforced
server-side by the `authorize()` middleware, not just hidden in the UI.

| Method | Path | Roles | Purpose |
|---|---|---|---|
| POST | `/auth/login` | public | Log in, returns JWT + user |
| GET | `/auth/me` | any | Current authenticated user |
| GET | `/users` | Admin | List all users |
| POST | `/users` | Admin | Create a user |
| PUT | `/users/:id` | Admin | Update role/department/active flag |
| POST | `/users/:id/unlock` | Admin | Clear a lockout |
| PUT | `/users/me/password` | any | Change own password |
| GET | `/departments` | any | List departments |
| POST | `/departments` | Admin | Create a department |
| GET | `/ideas` | any | List ideas visible to the caller (role + filters) |
| POST | `/ideas` | Employee | Create/save a draft idea |
| GET | `/ideas/:id` | any (visibility enforced) | Idea detail incl. evaluation/decision/execution |
| PUT | `/ideas/:id` | Employee (owner) | Edit a Draft or Needs-Completion idea |
| POST | `/ideas/:id/submit` | Employee (owner) | Submit for review |
| GET | `/ideas/:id/duplicates` | any | Similar existing ideas |
| POST | `/ideas/:id/attachments` | Employee (owner) | Upload attachments (multipart) |
| GET | `/ideas/:id/attachments/:storedName` | any (visibility enforced) | Download an attachment |
| POST | `/ideas/:id/screen/forward` | Coordinator | Forward Submitted idea to evaluation |
| POST | `/ideas/:id/screen/request-completion` | Coordinator | Send back with a mandatory note |
| GET | `/ideas/:id/evaluation` | any | Read the evaluation |
| POST | `/ideas/:id/evaluation` | Evaluator | Score the 6 weighted criteria |
| GET | `/ideas/:id/decision` | any | Read the latest committee decision |
| POST | `/ideas/:id/decision` | Committee | Approve / Return / Reject (reason mandatory for the latter two) |
| GET | `/ideas/:id/execution` | any | Read execution status |
| POST | `/ideas/:id/execution` | Committee | Assign execution owner + due date |
| POST | `/ideas/:id/execution/progress` | execution owner or Committee | Log a progress update |
| POST | `/ideas/:id/execution/complete` | execution owner or Committee | Submit final report, mark Completed |
| POST | `/ideas/:id/close` | Committee, Admin | Archive a Completed idea |
| GET | `/criteria-weights` | any | Read current weights |
| PUT | `/criteria-weights` | Admin | Update weights (must total 100) |
| GET | `/notifications` | any | My notifications + unread count |
| PUT | `/notifications/:id/read` | any | Mark one as read |
| PUT | `/notifications/read-all` | any | Mark all as read |
| GET | `/audit-log` | Admin | Filterable, paginated audit trail |
| GET | `/dashboard` | any | KPIs, funnel, department/domain breakdown, timing, implementation rate |
| GET | `/admin/backup` | Admin | Download a JSON snapshot of core collections |

## 7. Security features implemented

- bcrypt password hashing (12 salt rounds); password policy enforced both client- and
  server-side (min 8 chars, letters + numbers)
- JWT auth with expiry; `authenticate` middleware on every protected route
- `authorize(...roles)` RBAC middleware on every endpoint — the API rejects
  disallowed roles even if the UI never shows the button
- Account lockout after 5 failed logins (15-minute cool-down), admin-unlockable
- express-validator on every mutating endpoint + Mongoose schema validation
- `express-mongo-sanitize` (NoSQL injection) and a custom XSS-stripping middleware
  on every request body
- `helmet` security headers, `cors` origin whitelist, `express-rate-limit` on
  `/auth` (tighter) and globally (looser)
- Secrets only in `.env` (see `.env.example`); never hard-coded
- Ownership checks in `ideaService` — employees can only edit their own
  Draft/Needs-Completion ideas; Draft ideas are invisible to every other role
- A single state-machine gate (`ideaService.transition`) is the only place that
  ever changes an idea's status — it checks current status + role + note
  requirements before writing anything
- Every mutating request is captured in the audit log (business actions get a
  rich note; anything else falls back to a generic HTTP-level entry)
- Centralized error handler — unexpected errors return a generic message and
  are logged server-side only, never leaking stack traces to the client

## 8. Suggested extras included

Search/filter on the Ideas List, a visual idea status timeline, human-readable
idea codes (`IDEA-0001`), a password strength meter, an unread-notification
badge, and an admin JSON backup export. See `docs/analysis.md` §9 for the full list.
