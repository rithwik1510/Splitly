# Splitly — Modern Expense Sharing (Monorepo)

![CI](https://github.com/USER/REPO/actions/workflows/ci.yml/badge.svg)
![CodeQL](https://github.com/USER/REPO/actions/workflows/codeql.yml/badge.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Node](https://img.shields.io/badge/Node-20+-339933?logo=node.js&logoColor=white)

Professional-grade Splitwise alternative with:
- Groups, friends, expenses, multiple split modes (equal/unequal/percent/shares)
- Multi‑currency with base currency per group and settlements
- Dark/light themes, responsive UI, and accessible interactions
- Analytics hooks, exports, reminders (roadmap), OCR-ready architecture
- Monorepo for frontend (Next.js) and backend (Express + Prisma)

Key tech:
- Frontend: Next.js (App Router, React + TypeScript), Tailwind CSS, React Query
- Backend: Node.js + Express + TypeScript + Prisma (PostgreSQL)
- CI/CD: GitHub Actions, Docker (backend), npm workspaces

## Workspace Layout
```
.
+-- apps
    +-- backend        # Express API + Prisma
    +-- frontend       # Next.js app router UI
+-- packages
    +-- shared         # Shared constants/types (currencies, enums, cookies)
+-- prisma             # (generated migrations copied into apps/backend/prisma)
+-- scripts            # Workspace automation (setup script)
+-- docs               # Testing and process docs
    +-- assets         # Screenshots / GIFs referenced in README
```

### Package Manager
- npm workspaces manage all apps and shared packages.

## Architecture

```mermaid
flowchart LR
  subgraph Web[Frontend — Next.js]
    UI[App Router Pages]
    Hooks[Data Hooks (React Query)]
  end

  subgraph API[Backend — Express]
    Routes[REST Routes]
    Services[Domain Services]
    Prisma[(Prisma ORM)]
  end

  DB[(PostgreSQL)]

  UI --> Hooks --> API
  API --> Prisma --> DB
```

See ARCHITECTURE.md for more detail on flows, auth, and data.

## Quickstart

### Prerequisites
- **Node.js** 20+
- **npm** 8+
- **Docker** (for local PostgreSQL) or an accessible Postgres instance

### 1. Bootstrap the workspace
```bash
npm run setup
```
`setup` installs workspace dependencies, copies env templates, and (when the database is reachable) runs Prisma migrate deploy + generate for you.

### 2. Configure environment variables
`apps/backend/.env` and `apps/frontend/.env.local` are created automatically by the setup script. Update secrets (JWT values must be =32 chars) and configure OAuth as needed.

Important backend env keys:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/splitwise_plus
CORS_ORIGIN="http://localhost:3000,http://localhost:3001"
JWT_SECRET=your-32+char-secret
REFRESH_JWT_SECRET=your-32+char-refresh-secret
```

### 3. Start Postgres locally (optional if using a remote DB)
```bash
npm run db:up
```
This uses Docker Compose to launch a `postgres:16` container named `splitwise_plus_db` with a `splitwise_plus` database. The container is re-used across runs. Stop it anytime with `npm run db:down`.

If you rely on a remote database (or want to manage Docker yourself) skip this step and run `SKIP_DB_BOOT=1 npm run dev` so the dev script does not touch Docker.

### 4. Start development servers
```bash
npm run dev
```
`npm run dev` now frees ports 3000/4000, ensures the Docker database is running (unless `SKIP_DB_BOOT=1`), waits for Postgres to be ready, applies Prisma migrations, regenerates the client, and starts both workspaces concurrently. Frontend: http://localhost:3000 (Next.js offers 3001 if needed). Backend: http://localhost:4000. Use `npm run dev:frontend` or `npm run dev:backend` when you only need one side. Set `SKIP_PRISMA_PREP=1` if you want to skip the automatic migrate/generate step (for example, when pointing at a managed database).

When you change the Prisma schema, run `npm run prisma:generate --workspace @splitwise/backend` (and `npm run prisma:deploy --workspace @splitwise/backend` against your target database) to stay in sync.

### Performance & Metrics
- Bundle analysis: `npm run analyze --workspace @splitwise/frontend` renders a detailed bundle report to help spot heavy modules.
- Core Web Vitals: the app logs CLS, FID, LCP, TTFB, and INP to the console by default; set `NEXT_PUBLIC_VITALS_ENDPOINT` to POST metrics for collection.

## Implemented Sprints (1-2)

### Sprint 1 - Auth & Groups
- Email/password auth with JWT cookies; Google path scaffolded.
- User profile endpoint (`/users/me`) and search (`/users/search`).
- Groups CRUD: list, create, add members, membership guard checks.
- Relevant frontend routes: `/login`, `/register`, `/auth/callback`, `/groups`.

### Sprint 2 - Expenses & Balances
- Expense CRUD with split modes (equal, unequal, percent, shares) and rigorous validation.
- Multi-currency support with base currency + FX rate storage per expense.
- Balances: per-group netting, simplified settlement suggestions, record settlements.
- Frontend: `/groups/[id]` shows expenses, split editor, balances, simplified settles.
- UX: toast feedback, auth guard, member search, responsive layout.

## Testing & Quality
- Backend unit test (`vitest`) for balance simplification.
- Manual E2E scenarios documented in `docs/TESTING.md`.
- ESLint + Prettier enforced across workspaces.
- GitHub Actions CI at `.github/workflows/ci.yml` builds shared package, backend, runs backend tests, then builds frontend.

### Accessibility & Performance
- Accessibility: semantic headings/landmarks, aria‑live loading, keyboard‑only flows.
- Performance: React Query caching, light/dark theme transitions optimized.
- Lighthouse: Add your scores here after running local audits (Desktop/Mobile).

### Screenshots & Demos
- Place screenshots and GIFs in `docs/assets/` and reference them here.
- Recommended captures: Split dashboard (light/dark), Groups list, Group detail + settle flow, Expense editor.
- Suggested sizes: 1280×800 PNG for screenshots; short 5–10s MP4/WebM GIF for flows.

## Deployment Notes
- **Frontend**: Vercel (set `NEXT_PUBLIC_API_URL` to backend URL).
- **Backend**: Render/other Node host using `apps/backend/Dockerfile` or direct Node with Prisma migrations.
  - Build locally: `docker build -t splitly-api -f apps/backend/Dockerfile .`
  - Run: `docker run -p 4000:4000 --env-file apps/backend/.env splitly-api`
- **Database**: Supabase/Neon (set `DATABASE_URL`).
- Run `npm run prisma:deploy --workspace @splitwise/backend` on deploy to apply migrations.

### Environment flags
- `NEXT_PUBLIC_API_URL` — Frontend base API URL
- `NEXT_PUBLIC_ENABLE_DEMO_PREVIEW` — Enables demo balances on Split (default off)

## Roadmap
- Sprint 3: Analytics dashboards (category/member/month) + smart reminders.
- Sprint 4: OCR receipts (Tesseract/OpenAI) + PDF/Excel exports.
- Sprint 5: PWA offline sync, performance/accessibility, security hardening.

## Troubleshooting
- **CORS errors**: ensure backend `.env` `CORS_ORIGIN` includes the frontend origin(s) and restart the API.
- **JWT Zod errors**: secrets must be =32 characters.
- **Port already in use**: `npm run dev` clears ports 3000/4000 automatically; for stubborn cases run `npx kill-port 3000 4000` or terminate the PID shown by `netstat -ano`.
- **Local Postgres**: `npm run db:up` brings the Docker service up and `npm run db:down` stops it. Verify it with `docker ps` or `docker exec splitwise_plus_db psql -U postgres -l`. Set `SKIP_DB_BOOT=1` if you manage the database yourself.

Enjoy building Splitly!


## Recent Updates
- Rebranded the product to **Splitly** and refreshed the UI with a teal-forward palette (`#14B8A6` / `#2DD4BF`) for light/dark themes.
- Updated buttons, cards, inputs, auth pages, and group dashboards to use the new Splitly colors and typography accents.
- Introduced a post-login Split tab with quick totals, filterable individual/group balances, and inline settle shortcuts.
- Balance overview now reuses frontend settlements to surface owed/owing summaries per person and per group.
- Deep links into group settle-up forms prefill counterparty/mode so follow-up actions stay frictionless.
- Expense editor now lets you search for users and add them as participants on the fly before saving a split.
- Pre-dev automation now waits for Dockerized Postgres, applies Prisma migrate/generate, and launches both apps with one `npm run dev`.
- Polished the Split dashboard labels ('You are owed'/'You owe'), added demo preview balances, and improved accessibility cues across owed/owing tables.
- Introduced a header profile menu with Profile/History/Settings routes, sample data safeguards, and reliable layering in light/dark themes.
- Shipped dedicated Profile, History, and Settings surfaces with local preference storage and quick 'Back to dashboard' controls to speed navigation.

---

Contributing, Security, and Releases
- See CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md, and RELEASE.md.
- CI status badges above reference workflows in `.github/workflows`.
 - Added production-ready backend Dockerfile and gzip compression; removed X-Powered-By headers for leaner, safer responses.
 - Enabled Next.js bundle analysis and Core Web Vitals reporting to establish a performance baseline.

## Environment Flags
- Frontend
  - `NEXT_PUBLIC_API_URL`: Base URL for the API (e.g., `http://localhost:4000`).
  - `NEXT_PUBLIC_ENABLE_DEMO_PREVIEW`: Enables demo balances in Split dashboard when true. Default is `false` in `.env.example` and `.env.local`.
  - `NEXT_PUBLIC_VITALS_ENDPOINT` (optional): If set, the app posts Web Vitals to this URL.
- Backend
  - Rate limits (defaults): general = 1000 req / 15 min, auth = 20 req / 1 min.
  - `CORS_ORIGIN`: Comma-separated allowed origins (include your frontend URL).
  - `JWT_SECRET` and `REFRESH_JWT_SECRET`: must be at least 32 chars.

## QA & Release Readiness
- Lint and types: `npm run lint`
- Build both apps: `npm run build`
- Backend tests: `npm run test --workspace @splitwise/backend`
- Frontend bundle report: `npm run analyze --workspace @splitwise/frontend`
