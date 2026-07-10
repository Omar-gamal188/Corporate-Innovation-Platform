# Frontend Summary — Corporate Innovation Platform

*Written from the Frontend Developer's perspective.*

## What was built

A React (Vite) single-page app that gives each of the 5 roles (Employee,
Coordinator, Evaluator, Committee, Admin) its own view of the same idea data,
with the UI adapting to what that role is allowed to do. No heavy UI library —
plain CSS, hand-built components.

## Tech choices

- **React + Vite**: fast dev server, no build-config boilerplate.
- **react-router-dom**: client-side routing, nested layout routes.
- **axios**: one shared instance with interceptors, instead of repeating
  fetch/header logic in every API call.
- **Plain CSS** (`index.css`): one design system (colors, spacing, buttons,
  cards, tables, badges) shared by every page — no per-component style files.

## Folder structure and why

```
src/
  api/         one file per backend resource (ideasApi.js, usersApi.js, ...)
  context/     AuthContext (who's logged in) and ToastContext (feedback)
  components/  small, reusable, presentation-focused pieces
  pages/       one file per route, does data-fetching + composition
  utils/       constants and client-side validators shared across pages
```

The rule followed throughout: **components don't know about the API, pages
do.** A component like `StatusBadge` or `IdeaTimeline` just renders whatever
props it's given. All `fetch`/`axios` calls live in `pages/*.jsx` or `api/*.js`.
This keeps components trivially reusable and easy to test in isolation.

## Authentication flow

- `AuthContext` holds the current user and exposes `login()` / `logout()`.
- The JWT is stored in `localStorage`; `axiosClient`'s request interceptor
  attaches it to every outgoing call automatically — no page has to remember
  to do this itself.
- A response interceptor watches for `401`s globally: if the token is missing,
  expired, or invalid, it clears storage and forces a redirect to `/login`
  from one place, instead of every page having its own "am I logged in" check.
- `ProtectedRoute` wraps routes that need a session (and optionally a specific
  role). It's a **UX convenience only** — hiding a page here is not security;
  the real enforcement is on the API side. This was a deliberate decision: the
  frontend can be as permissive or wrong as it wants, it can never grant
  access the backend doesn't already allow.

## Role-based navigation

`Layout.jsx` renders a sidebar whose menu items come from a `MENU_BY_ROLE`
lookup table keyed by the logged-in user's role. An Employee sees "My Ideas /
New Idea"; a Coordinator sees "Screening Queue"; an Admin sees "Users / Audit
Log / Settings". Same `/ideas` route under the hood — the list of ideas
returned differs because the **API** filters by role, not because the
frontend hides rows.

## Key pages and what they're responsible for

| Page | Responsibility |
|---|---|
| `Login` | Username/password form, calls `AuthContext.login()` |
| `Dashboard` | KPI cards, conversion funnel, department/domain breakdowns |
| `IdeaForm` | Create/edit a Draft, duplicate-check modal before submit, attachment upload |
| `IdeasList` | Role-aware table with search/status/domain filters |
| `IdeaDetails` | The hub page — timeline, evaluation, decision, execution, and every role-specific action button, each gated by `idea.status` + `user.role` |
| `Evaluation` | 6-criteria scoring form with a live weighted-total preview |
| `Users` | Admin: create users, change roles, unlock accounts |
| `AuditLog` | Admin: filterable table of every recorded action |
| `Settings` | Change password (everyone) + criteria weights editor (Admin only) |

`IdeaDetails` is intentionally the most complex page, because it mirrors the
real workflow: the same idea page looks different depending on whether you're
the owner, the coordinator, the evaluator, or the committee — each sees only
the actions relevant to the idea's current status and their own role.

## UX patterns applied consistently

- **Toasts** (`ToastContext`) for feedback after every action — success or
  failure — so the user is never left wondering if a click did anything.
- **ConfirmDialog** for anything hard to undo (reject, return, close), with a
  `requireNote` mode that disables the confirm button until a reason of at
  least 10 characters is typed — this mirrors a server-side rule, so the user
  finds out about the requirement before hitting a 400 error, not after.
- **Loading / empty states** (`LoadingState`, `EmptyState`) instead of blank
  screens while data is in flight or when a filter returns nothing.
- **StatusBadge** gives every idea status a consistent color across the whole
  app (list, details, timeline) so users learn to recognize a status at a
  glance instead of reading text every time.

## Suggested features implemented on the frontend

- Search/filter bar on the Ideas List.
- A visual status timeline (`IdeaTimeline`) on the idea details page.
- A password strength meter on the Settings page (client-side hint only —
  the real policy check happens on the server).
- An unread-notification badge in the top bar, polling every 30s.

## What the frontend deliberately does *not* do

- It does not re-implement business rules (e.g. "can this idea be edited?").
  It calls the API and displays whatever comes back, including error
  messages — the source of truth for what's allowed always lives in
  `ideaService` on the backend.
- It does not sanitize input for security purposes beyond basic UX validation
  (e.g. file type/size checks before upload) — that's a courtesy to the user,
  not a security boundary. The server re-validates everything authoritatively.
