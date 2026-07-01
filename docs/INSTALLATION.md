# Installation Guide

This guide covers everything needed to run **Ministry of Interior** locally — from the zero-config frontend demo to the optional Express + PostgreSQL backend.

> **TL;DR** — `cd frontend && npm install && npm run dev` → http://localhost:3000. No database. No API keys. Done.

---

## 1. Prerequisites

| Requirement | Version | Required for | Notes |
|-------------|---------|--------------|-------|
| **Node.js** | **18.x or newer** (LTS recommended) | Frontend **and** backend | Next.js 14 requires Node 18.17+. Node 20/22 also fine. |
| **npm** | 9+ (ships with Node) | Frontend & backend | `yarn`/`pnpm` work too, but commands below use npm. |
| **PostgreSQL** | **14+** | Backend *with* a database (optional) | **Not needed** for the demo. The backend also runs fully in-memory. |
| **A modern browser** | Chrome / Edge / Firefox / Safari | Viewing the app | WebGL is required for the 3D Digital Twin. |

Check your versions:

```bash
node -v    # should print v18.x or higher
npm -v
```

---

## 2. Frontend setup (the demo)

The frontend in `frontend/` is **self-contained**: it ships with a deterministic mock dataset and a mock AI engine, so it needs **no backend and no database**.

```bash
# from the repository root
cd frontend

# install dependencies
npm install

# start the dev server
npm run dev
```

Then open **http://localhost:3000**. You land on the **Command Center** (Module 01). Use the sidebar to reach the other six modules.

### Available npm scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `next dev` | Start the development server (hot reload) on port 3000. |
| `build` | `next build` | Produce an optimized production build. |
| `start` | `next start` | Serve the production build (run `build` first). |
| `lint` | `next lint` | Run ESLint. |
| `typecheck` | `tsc --noEmit` | Type-check the whole project without emitting files. |

---

## 3. Production build (frontend)

```bash
cd frontend
npm run build      # compiles & optimizes — also surfaces any type errors
npm start          # serves the optimized build on http://localhost:3000
```

To verify the codebase type-checks cleanly without building:

```bash
npm run typecheck
```

---

## 4. Optional backend setup (Express + PostgreSQL)

The backend in `backend/` is a **reference REST API** that mirrors the frontend's data contracts. It is **entirely optional** — the demo never calls it. Run it when you want to demonstrate the production data path.

It supports two modes:

| Mode | `USE_DB` | What happens |
|------|----------|--------------|
| **In-memory** | `false` (default for demo) | Serves the same seed dataset from memory. **No PostgreSQL required.** |
| **Database** | `true` | Connects to PostgreSQL, serves data from tables, persists writes. |

### 4a. In-memory mode (no database)

```bash
cd backend
npm install

# run without a database
USE_DB=false npm run dev
# → API on http://localhost:4000
```

Verify it's up:

```bash
curl http://localhost:4000/api/health
curl http://localhost:4000/api/risk
```

### 4b. Database mode (PostgreSQL)

1. **Create a database:**

   ```bash
   createdb police_twin
   ```

2. **Configure environment variables.** Copy the example and edit:

   ```bash
   cd backend
   cp .env.example .env
   ```

   | Variable | Example | Description |
   |----------|---------|-------------|
   | `PORT` | `4000` | Port the API listens on. |
   | `USE_DB` | `true` | Enable PostgreSQL-backed mode. |
   | `DATABASE_URL` | `postgresql://user:pass@localhost:5432/police_twin` | Full connection string. |
   | `PGHOST` / `PGPORT` / `PGUSER` / `PGPASSWORD` / `PGDATABASE` | — | Alternative to `DATABASE_URL` if you prefer discrete vars. |
   | `CORS_ORIGIN` | `http://localhost:3000` | Allowed origin for the frontend. |

3. **Create the schema and seed it:**

   ```bash
   npm run db:migrate   # applies db/schema.sql
   npm run db:seed      # loads the Central Command HQ dataset
   ```

4. **Start the API:**

   ```bash
   npm run dev          # development (auto-reload)
   # or
   npm run build && npm start   # production
   ```

### 4c. Pointing the frontend at the backend (optional)

By default the frontend uses its built-in mock data and ignores the backend. To wire it to the live API, set in `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
```

> For the executive demo we recommend leaving the frontend on its built-in data — it is faster, fully offline, and deterministic.

---

## 5. Ports summary

| Service | Default port | URL |
|---------|--------------|-----|
| Frontend (Next.js) | **3000** | http://localhost:3000 |
| Backend (Express) | **4000** | http://localhost:4000 |
| PostgreSQL | 5432 | (local, optional) |

---

## 6. Troubleshooting

### "You are using Node.js X. Next.js requires Node.js 18.17 or newer."
Upgrade Node. Use [nvm](https://github.com/nvm-sh/nvm) (macOS/Linux) or [nvm-windows](https://github.com/coreybutler/nvm-windows):

```bash
nvm install 20
nvm use 20
```

### Port 3000 (or 4000) already in use
Either stop the other process or run on a different port:

```bash
# frontend on a different port
PORT=3100 npm run dev          # macOS/Linux
# Windows PowerShell:
$env:PORT=3100; npm run dev
```

To find and free a busy port:

```bash
# macOS/Linux
lsof -i :3000
# Windows
netstat -ano | findstr :3000
```

### The 3D Digital Twin shows a blank canvas
The twin needs **WebGL**. Confirm hardware acceleration is enabled in your browser and that WebGL is available at `chrome://gpu` (or `about:support` in Firefox). The viewer is loaded client-side only (`ssr: false`), so it appears after a brief "Initializing digital twin…" loader.

### `npm install` fails or behaves oddly
Clear and reinstall:

```bash
rm -rf node_modules package-lock.json
npm install
```
(On Windows PowerShell: `Remove-Item -Recurse -Force node_modules, package-lock.json; npm install`.)

### Hydration / "Text content did not match" warnings
The platform is built to be deterministic for exactly this reason — it never calls `Math.random()` or `Date.now()` at render time. If you extend it, use the `NOW` / `NOW_ISO` / `seededRandom` helpers from `lib/utils` (see [Architecture](ARCHITECTURE.md)).

### Backend: "connection refused" / `ECONNREFUSED ::1:5432`
PostgreSQL isn't running or the connection string is wrong. Either start PostgreSQL and re-check `DATABASE_URL`, or simply run in-memory mode with `USE_DB=false`.

---

## 7. Next steps

- Walk the product with the [Demo Walkthrough](DEMO_WALKTHROUGH.md).
- Understand how it's built in the [Architecture](ARCHITECTURE.md) doc.
- Build against the [API Reference](API.md) and [Data Model](DATA_MODEL.md).
