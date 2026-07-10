# Demo Script — Full Idea Lifecycle + Security Walkthrough

Follow this top-to-bottom while recording. It walks **one idea** from Draft to
Closed, switching accounts as the workflow requires a different role, and
calls out each security feature as it comes up. Total run time: ~10-12 minutes.

**Before recording:** `npm run seed` in `server/` for a clean slate, then have
both `npm run dev` (server) and `npm run dev` (client) running. All demo
accounts use password `Passw0rd1`.

## Part 1 — Security warm-up (lockout + RBAC)

1. Go to `/login`. Type username `employee2` with a **wrong** password 5 times
   in a row. On the 5th attempt (or the next one), the API returns "Account
   locked" — show this message. This is the account-lockout protection
   (5 failed attempts → 15-minute lock).
2. Log in as `admin` / `Passw0rd1`. Go to **Users**, find `employee2`, click
   **Unlock**. This clears the lock instantly (admin override).
3. While logged in as `admin`, briefly open dev tools → Network tab and show
   that every request carries an `Authorization: Bearer <token>` header.
4. Log out. Log in as `employee1` and try to navigate directly to
   `/audit-log` or `/users` by typing the URL. The app redirects away — and
   if you call the API directly (e.g. via curl), it returns `403 Forbidden`.
   This proves RBAC is enforced by the **server**, not just hidden menus.

## Part 2 — Employee: create and submit an idea

5. Stay logged in as `employee1`. Click **New Idea**.
6. Fill in: title ("Digital visitor sign-in kiosk"), domain (Technology),
   department (Information Technology), problem/opportunity, proposed
   solution, expected impact, initial cost, implementation requirements,
   risks & dependencies.
7. Click **Save as Draft** — note the idea now exists but nothing has been
   submitted; show that it's still editable and invisible to other roles
   (Draft ideas are owner-only).
8. Upload an attachment: first try a `.exe` or oversized file to show the
   client-side rejection message, then upload a real PDF/image to show it
   succeeds.
9. Click **Submit for Review**. If similar existing ideas are found, the
   duplicate-check modal appears — click "Submit anyway" (or note it if none
   are found). The idea moves to **Submitted**.

## Part 3 — Coordinator: screening

10. Log out, log in as `coordinator1`. Open **Screening Queue**, find the new
    idea, open it.
11. Click **Request Completion**, try to submit with a note under 10
    characters — show the validation error (a reason is mandatory). Then
    cancel and instead click **Forward to Evaluation** to keep the demo idea
    moving. The idea moves to **Under Review**.

*(Optional aside: switch back to `employee1` briefly to show a second,
throwaway idea sitting in "Needs Completion" with the coordinator's note
visible, then return to `coordinator1`.)*

## Part 4 — Evaluator: weighted scoring

12. Log out, log in as `evaluator1`. Open **Evaluation Queue**, open the idea,
    click **Evaluate this idea**.
13. Enter scores for all 6 weighted criteria (Business Impact, Feasibility,
    Initial Cost, Innovation, Implementation Risk, Scalability) and a short
    recommendation. Watch the live weighted total update as you type.
14. Submit. Show the resulting suggestion band (Recommend Pilot / Needs
    Development / Archive) on the idea details page.

## Part 5 — Committee: decision + execution

15. Log out, log in as `committee1`. Open the idea from **Decision &
    Execution**.
16. Try **Reject & Close** first — show that the confirm button stays
    disabled until a reason of at least 10 characters is typed (mandatory
    documented reason). Cancel that dialog.
17. Click **Approve for Pilot** instead. The idea moves to **Approved for
    Pilot**.
18. In the **Assign Execution** panel, enter an execution owner (paste
    `employee1`'s user id from the Users page, or leave blank to default to
    the idea owner) and a due date. Click **Assign** — the idea moves to
    **In Progress**.

## Part 6 — Execution and completion

19. Log out, log in as `employee1` (the execution owner). Open the idea, add
    a **progress update** note.
20. Fill in the **final report** field and click **Mark Completed**. The idea
    moves to **Completed**.

## Part 7 — Close the loop + governance

21. Log out, log in as `committee1` (or `admin`). Open the idea, click
    **Close Idea**. It moves to the final **Closed** state.
22. Log in as `admin`. Open **Audit Log** and filter/scroll to show an entry
    for every action just performed in this walkthrough (create, submit,
    forward, evaluate, decide, assign, progress, complete, close) — each
    with who/when/what.
23. Open **Dashboard** and point out the KPI cards, conversion funnel, and
    department/domain breakdowns updating to reflect the new idea.
24. Open **Settings** as admin and show the criteria weights editor — change
    a value so the total isn't 100% and show the Save button disables itself,
    then restore the values to demonstrate the "must total 100%" rule.

## Wrap-up

- Recap: one idea traveled Draft → Submitted → Under Review → Approved for
  Pilot → In Progress → Completed → Closed, touching every role.
- Recap security: bcrypt-hashed passwords, JWT auth, account lockout,
  server-side RBAC, mandatory documented reasons for reject/return, ownership
  checks on drafts, and a complete audit trail — all enforced by the API, not
  just the UI.
