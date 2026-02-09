<p align="center">
  <img src="docs/assets/splitly-mark.svg" alt="Splitly symbol" width="92" />
</p>

<h1 align="center">Splitly</h1>

<p align="center">
  Modern expense sharing for friends, roommates, and teams.
</p>

<p align="center">
  A polished full-stack Splitwise alternative built with a Next.js frontend and an Express + Prisma backend.
</p>

<p align="center">
  <a href="https://github.com/rithwik1510/Splitly/actions/workflows/ci.yml"><img src="https://github.com/rithwik1510/Splitly/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/rithwik1510/Splitly/actions/workflows/codeql.yml"><img src="https://github.com/rithwik1510/Splitly/actions/workflows/codeql.yml/badge.svg" alt="CodeQL"></a>
  <img src="https://img.shields.io/badge/Next.js-14-black?logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Node-20+-339933?logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma" alt="Prisma">
  <img src="https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white" alt="PostgreSQL">
</p>

## Table of Contents

- [Why Splitly](#why-splitly)
- [Screenshots](#screenshots)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Scripts](#scripts)
- [Testing and Quality](#testing-and-quality)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Why Splitly

Splitly helps groups settle shared spending without friction.

- Multiple split strategies: equal, unequal, percent, and shares.
- Group-first workflow for roommates, trips, and recurring teams.
- Balance overview with owed/owing filters and fast settle-up paths.
- Multi-currency support and cleaner settlement visibility.
- Responsive, theme-aware UI with modern, accessible components.

## Screenshots

<p align="center">
  <img src="docs/assets/split-dashboard-hero.png" alt="Split dashboard hero section" width="92%">
  <br />
  <em>Dashboard hero with participants, base currency, and latest activity.</em>
</p>

<p align="center">
  <img src="docs/assets/split-dashboard-full.png" alt="Split dashboard full view" width="92%">
  <br />
  <em>Full split dashboard: balances, group context, and expense flow entry points.</em>
</p>

<p align="center">
  <img src="docs/assets/expense-editor-detail.png" alt="Expense editor detail view" width="92%">
  <br />
  <em>Expense editor detail view with split modes and participant allocation controls.</em>
</p>

<p align="center">
  <img src="docs/assets/expense-editor-full.png" alt="Expense editor full workflow" width="92%">
  <br />
  <em>Complete expense workflow with snapshot context and save action.</em>
</p>

## Architecture

```mermaid
flowchart LR
  subgraph Frontend[Frontend - Next.js]
    UI[App Router pages]
    Query[React Query hooks]
  end

  subgraph Backend[Backend - Express]
    Routes[REST routes]
    Services[Domain services]
    Prisma[(Prisma ORM)]
  end

  DB[(PostgreSQL)]

  UI --> Query --> Routes --> Services --> Prisma --> DB
```

For deeper details, see `ARCHITECTURE.md`.

## Tech Stack

| Layer | Stack |
| --- | --- |
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS, React Query |
| Backend | Node.js, Express, TypeScript, Prisma |
| Database | PostgreSQL |
| Tooling | npm workspaces, ESLint, Prettier, Vitest, Docker |
| CI/Security | GitHub Actions, CodeQL |

## Repository Structure

```text
Splitly/
|- apps/
|  |- frontend/        # Next.js app
|  |- backend/         # Express API + Prisma
|- packages/
|  |- shared/          # Shared types/utilities
|- docs/
|  |- assets/          # README screenshots and branding assets
|- scripts/            # Setup and predev automation
```

## Quick Start

### Prerequisites

- Node.js 20+
- npm 8+
- Docker (optional, for local PostgreSQL)

### 1. Clone

```bash
git clone https://github.com/rithwik1510/Splitly.git
cd Splitly
```

### 2. Install and bootstrap

```bash
npm run setup
```

### 3. Start development

```bash
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`

## Configuration

Create the following files manually:

- `apps/frontend/.env.local`
- `apps/backend/.env`

Recommended values:

### `apps/frontend/.env.local`

```env
NEXT_PUBLIC_API_URL="http://localhost:4000"
NEXT_PUBLIC_ENABLE_DEMO_PREVIEW="false"
```

### `apps/backend/.env`

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/splitwise_plus
CORS_ORIGIN="http://localhost:3000"
JWT_SECRET=replace-with-32-plus-character-secret
REFRESH_JWT_SECRET=replace-with-32-plus-character-refresh-secret
JWT_EXPIRES_IN=15m
REFRESH_EXPIRES_IN=7d
PORT=4000
```

## Scripts

### Root scripts

| Command | Purpose |
| --- | --- |
| `npm run setup` | Install dependencies and bootstrap local setup |
| `npm run dev` | Run frontend + backend together |
| `npm run lint` | Lint frontend + backend |
| `npm run build` | Build frontend + backend |
| `npm run format` | Format codebase with Prettier |
| `npm run db:up` | Start local PostgreSQL container |
| `npm run db:down` | Stop local PostgreSQL container |

### Workspace scripts

| Command | Purpose |
| --- | --- |
| `npm run dev --workspace @splitwise/frontend` | Run frontend only |
| `npm run dev --workspace @splitwise/backend` | Run backend only |
| `npm run test --workspace @splitwise/backend` | Run backend tests |
| `npm run prisma:migrate --workspace @splitwise/backend` | Run Prisma migrations |
| `npm run prisma:generate --workspace @splitwise/backend` | Generate Prisma client |

## Testing and Quality

- Backend unit tests are powered by Vitest.
- Linting uses ESLint with strict warnings policy.
- Formatting is handled by Prettier.
- CI runs checks on pull requests to `main`.

Useful commands:

```bash
npm run test --workspace @splitwise/backend
npm run lint
npm run build
```

## Troubleshooting

- CORS errors: verify `CORS_ORIGIN` in `apps/backend/.env`.
- Invalid JWT env errors: `JWT_SECRET` and `REFRESH_JWT_SECRET` must be at least 32 chars.
- Port conflicts: predev attempts to free `3000` and `4000`; if needed, stop conflicting processes manually.
- DB connection failures: run `npm run db:up` or set `SKIP_DB_BOOT=1` if you manage DB outside Docker.

## Contributing

Contributions are welcome. Please read `CONTRIBUTING.md` before opening a pull request.

## License

This project is distributed under the MIT License.
