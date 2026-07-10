# Backend Summary — Corporate Innovation Platform

*Written from the Backend Developer's perspective.*

## What was built

A Node.js + Express REST API backed by MongoDB (Mongoose), structured in
layers so each concern lives in exactly one place: routes wire URLs to
controllers, controllers only translate HTTP ↔ data, and every business rule
lives in a service. This is the layer that actually enforces the workflow —
the frontend is a client of this API, not a source of truth for anything.

## Folder structure and why

```
src/
  config/      env.js (validated env vars), db.js (Mongo connection)
  models/      one Mongoose schema per collection
  middleware/  auth, rbac, validate, sanitize, audit, rateLimiter, errorHandler, upload
  controllers/ thin — parse request, call a service, send a response
  services/    ALL business logic — the only place state actually changes
  routes/      one file per resource, wires middleware + validation + controller
  utils/       constants (roles/statuses/weights), AppError, apiResponse, etc.
```

Controllers are deliberately kept "dumb": if a controller has an `if`
statement about business rules, that logic is in the wrong place. This makes
the rules testable independent of HTTP, and means there is exactly one
implementation of "can this idea move to this status" (see below), not one
per endpoint.

## The state machine — the core design decision

Every idea status change in the whole app passes through a single function,
`ideaService.transition()`. It looks up the `(fromStatus -> toStatus)` pair in
a table that says which role may do it and whether a note is mandatory, then:

1. Rejects the request outright if that transition isn't in the table (a
   `409`, not a silent no-op).
2. Rejects it if the caller's role isn't allowed (`403`).
3. Rejects it if a note is required and missing/too short (`400`).
4. Only then updates `status`, appends to `statusHistory`, notifies the idea
   owner, and writes an audit log entry.

Every higher-level action (submit, screen, decide, complete, close) is a thin
wrapper around this one function plus its own side effects (e.g.
`decisionService` also writes a `Decision` document). The benefit: there is
no code path anywhere that can move an idea into an invalid state, because
there's only one door and it's always locked the same way.

## Security — implemented, not just described

| Requirement | Where |
|---|---|
| Password hashing | `authService.hashPassword` — bcrypt, 12 salt rounds, never stored/returned in plain text |
| Password policy | Checked both in `userController`/`authService` (server, authoritative) and client-side (UX hint) |
| JWT auth | `middleware/auth.js` verifies the token and loads the user on every protected route |
| RBAC | `middleware/rbac.js`'s `authorize(...roles)` on every route that needs it — enforced at the API, independent of what the UI shows |
| Account lockout | `authService.registerFailedAttempt` — 5 failures locks the account for 15 minutes; `userService.unlockUser` lets Admin clear it |
| Input validation | `express-validator` chains in every route file, run through `middleware/validate.js` |
| NoSQL injection | `express-mongo-sanitize`, applied globally in `app.js` before any route runs |
| XSS | `middleware/sanitize.js` strips HTML/script tags from every string in `req.body` |
| Secure headers / CORS / rate limits | `helmet`, `cors` with an origin whitelist, `express-rate-limit` (tighter on `/auth`, looser globally) |
| Secrets | Only ever read from `.env` via `config/env.js`, which fails fast at boot if `JWT_SECRET` is missing |
| Ownership checks | `ideaService.assertOwner` — an Employee can only edit their own Draft/Needs-Completion idea; Draft ideas are invisible to every other role, including Admin |
| Centralized errors | `middleware/errorHandler.js` — only `AppError` (operational, safe) messages reach the client; anything else becomes a generic "Internal server error" and is logged server-side only |

## Audit logging

Two layers, so nothing is missed but important actions still read clearly:

- **Generic safety net** (`middleware/audit.js`): every successful mutating
  request (`POST`/`PUT`/`PATCH`/`DELETE`) is logged automatically.
- **Rich business entries** (`auditService.logAction`, called directly from
  services): idea transitions, decisions, weight changes, user management,
  etc. get a note that actually explains what happened (e.g. the rejection
  reason), and set a flag so the generic logger doesn't also write a
  duplicate, less-useful entry for the same request.

## Evaluation scoring

`evaluationService.computeWeightedTotal` multiplies each of the 6 raw 0–100
scores by the current `CriteriaWeights` percentages (fetched from the
database, not hard-coded, so Admin can change them) and sums the result. The
weights are stored as a lazily-created singleton document and validated to
always sum to exactly 100 before being saved (`criteriaWeightsService`). The
resulting total is bucketed into a system suggestion (≥80 pilot, 60–79
development, <60 archive) that the Committee sees as a recommendation — the
decision itself is always a human action.

## Notable implementation details

- **Idea codes** (`IDEA-0001`, ...) are generated by an atomic
  `findOneAndUpdate` on a dedicated `Counter` collection, so two employees
  submitting at the same instant can never collide on the same code.
- **Duplicate detection** uses a MongoDB text index on `{ title,
  problemStatement }`, scored and sorted by relevance, excluding Draft/Closed
  ideas and the idea being edited.
- **Attachments** go through `multer` with a strict MIME whitelist and a
  5MB/file limit enforced server-side (the client-side check is UX only);
  files are renamed to a random string on disk so the original filename is
  never trusted as a path.
- **Consistent response shape**: every endpoint returns `{ success, data,
  message }`, so the frontend never has to special-case how to read a
  response.

## What the backend deliberately does *not* do

- It does not trust anything the frontend sends about permissions — every
  route re-derives what's allowed from the authenticated user and the
  current database state.
- It does not leak internal errors (stack traces, driver messages) to
  clients — only messages explicitly created as `AppError` are user-facing.
