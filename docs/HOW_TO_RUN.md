# How to Run — Step by Step (from zero)

Follow these steps in order on a machine that has nothing set up yet. Commands
are shown for **PowerShell** (Windows). Two terminals are needed: one for the
server, one for the client.

## Step 0 — Prerequisites

You need Node.js 18+ and a running MongoDB instance.

```powershell
node --version
npm --version
```

Check MongoDB. If it's installed as a Windows service, this should say `Running`:

```powershell
Get-Service -Name "MongoDB" -ErrorAction SilentlyContinue
```

- If the service exists but is **Stopped**: `Start-Service MongoDB`
- If MongoDB isn't installed at all: install "MongoDB Community Server" from
  mongodb.com, or point `MONGO_URI` (Step 1) at any MongoDB instance you
  already have access to (Atlas, Docker, another machine, etc.)

## Step 1 — Backend: install, configure, seed, run

Open **Terminal 1**:

```powershell
cd d:\intern\server
npm install
copy .env.example .env
```

Open the new `.env` and check `MONGO_URI` matches your MongoDB (the default
`mongodb://127.0.0.1:27017/innovation_platform` works for a local install).

```powershell
npm run seed
```

You should see `[seed] done` and a list of demo account usernames. This wipes
and recreates: 4 departments, 6 users (one per role), default criteria
weights, and one sample idea in every lifecycle status.

```powershell
npm run dev
```

Leave this running. You should see:

```
[db] connected to mongodb://127.0.0.1:27017/innovation_platform
[server] listening on port 5000 (development)
```

Verify it's alive (in a separate quick check, or a browser tab):
`http://localhost:5000/api/health` → `{"success":true,...}`

## Step 2 — Frontend: install, configure, run

Open **Terminal 2** (keep Terminal 1 running):

```powershell
cd d:\intern\client
npm install
copy .env.example .env
npm run dev
```

You should see:

```
VITE ... ready in ...ms
➜  Local:   http://localhost:5173/
```

## Step 3 — Open it

Go to **http://localhost:5173** in a browser. You'll land on `/login`.

Log in with any of the seeded accounts (all share the same password):

| Username | Password | Role |
|---|---|---|
| `admin` | `Passw0rd1` | Admin |
| `coordinator1` | `Passw0rd1` | Coordinator |
| `evaluator1` | `Passw0rd1` | Evaluator |
| `committee1` | `Passw0rd1` | Committee |
| `employee1` | `Passw0rd1` | Employee |
| `employee2` | `Passw0rd1` | Employee |

To walk through the full idea lifecycle end to end, follow
[demo-script.md](./demo-script.md).

## Stopping everything

`Ctrl+C` in each terminal. To reset all demo data back to a clean state at any
time, stop the server and re-run `npm run seed` in `server/`.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Server exits immediately with a Mongo connection error | MongoDB isn't running, or `MONGO_URI` in `server/.env` is wrong |
| Client loads but every page shows a network error | Server isn't running, or `VITE_API_URL` in `client/.env` doesn't match the server port |
| Login always says "Invalid username or password" | Re-run `npm run seed` — you may be using stale credentials from a previous seed |
| Login says "Account locked" | 5 failed attempts trigger a 15-minute lock; log in as `admin` → Users → Unlock, or wait |
| Port 5000 or 5173 already in use | Something else is already running there — stop it, or change `PORT` (server) / pass `--port` to `vite` (client) |
