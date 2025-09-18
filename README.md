# Splitly — Modern Expense Sharing (Monorepo)

[![CI](https://github.com/YOUR_USER/YOUR_REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USER/YOUR_REPO/actions/workflows/ci.yml)
[![CodeQL](https://github.com/YOUR_USER/YOUR_REPO/actions/workflows/codeql.yml/badge.svg)](https://github.com/YOUR_USER/YOUR_REPO/actions/workflows/codeql.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Node](https://img.shields.io/badge/Node-20+-339933?logo=node.js&logoColor=white)

A polished, full‑stack Splitwise alternative for groups and friends. Track expenses with multiple split modes, multi‑currency balances, and simplified settlements — in a fast, accessible UI with dark/light themes. This monorepo contains a Next.js frontend and a TypeScript Express + Prisma backend.

## Table of Contents
- Features
- Tech Stack
- Architecture
- Screenshots
- Quick Start
- Configuration
- Common Scripts
- Testing & Quality
- Accessibility & Performance
- Deployment
- Roadmap
- Contributing & Policies

## Features
- Expense tracking with split modes: equal, unequal, percent, shares
- Multi‑currency groups + simplified settlements
- Responsive, theme‑aware UI (light/dark) with a11y cues and keyboard support
- Dashboard overview of owed/owing across individuals and groups
- Groups: members, expenses, balances, settle‑up history
- OCR‑ready architecture and analytics hooks (roadmap)

## Tech Stack
- Frontend: Next.js (App Router), React 18, TypeScript, Tailwind CSS, React Query, next-themes
- Backend: Node.js, Express, TypeScript, Prisma (PostgreSQL)
- Tooling: npm workspaces, Prettier, ESLint, Vitest (backend), Docker
- CI/CD: GitHub Actions (CI + CodeQL), ready for Vercel/Render/Supabase

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

See ARCHITECTURE.md for deeper details on flows, auth, and data.

## Screenshots

Place images in `docs/assets/` and reference them here. Recommended captures: Split dashboard (light/dark), Group detail, Expense editor, History. Suggested sizes: 1280×800 PNG for screenshots; short 5–10s MP4/WebM or GIF for flows.

<figure>
  <img src="docs/assets/split-dashboard-dark.png" alt="Split dashboard — dark theme" width="1000" />
  <figcaption>Split dashboard — quick totals, filters, and tabbed view across Individuals/Groups.</figcaption>
  
</figure>

<figure>
  <img src="docs/assets/expense-editor-dark.png" alt="Expense editor — dark theme" width="1000" />
  <figcaption>Expense editor — split modes (equal/unequal/percent/shares) and participants.</figcaption>
  
</figure>

## Quick Start

Prereqs:
- Node.js 20+, npm 8+
- Docker (optional for local Postgres)

Bootstrap:
```bash
npm run setup
```

Run locally (both apps; DB auto‑starts via Docker unless disabled):
```bash
npm run dev
```

Open:
- Frontend: http://localhost:3000
- Backend:  http://localhost:4000

Only one side:
```bash
npm run dev:frontend
npm run dev:backend
```

## Configuration

Frontend (`apps/frontend/.env.local`):
```
NEXT_PUBLIC_API_URL="http://localhost:4000"
NEXT_PUBLIC_ENABLE_DEMO_PREVIEW="false"
```

Backend (`apps/backend/.env`):
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/splitwise_plus
CORS_ORIGIN="http://localhost:3000"
JWT_SECRET=your-32+char-secret
REFRESH_JWT_SECRET=your-32+char-refresh-secret
```

Docker DB:
```bash
npm run db:up   # start Postgres
npm run db:down # stop Postgres
```

Prisma (backend):
```bash
npm run prisma:generate --workspace @splitwise/backend
npm run prisma:deploy   --workspace @splitwise/backend
```

## Common Scripts

Workspace root:
- `npm run setup` — install deps, copy envs, prep DB when reachable
- `npm run dev` — start frontend + backend
- `npm run build` — build both apps
- `npm run lint` — lint both
- `npm run db:up` / `db:down` — Docker Postgres

Frontend:
- `npm run lint --workspace @splitwise/frontend`
- `npm run build --workspace @splitwise/frontend`

Backend:
- `npm run lint --workspace @splitwise/backend`
- `npm run test --workspace @splitwise/backend`
- `npm run prisma:* --workspace @splitwise/backend`

## Testing & Quality
- Backend: Vitest unit tests for settlement logic
- Linting: ESLint + Prettier (TypeScript rules)
- CI: GitHub Actions runs lint, tests, and builds on PRs to `main`

## Accessibility & Performance
- Semantic landmarks, aria‑live for loading/error states, keyboard‑friendly components
- React Query caching & optimistic UI where appropriate
- Lighthouse: capture Desktop/Mobile scores locally and add to README

## Deployment

Typical targets:
- Frontend: Vercel (set `NEXT_PUBLIC_API_URL`)
- Backend: Render/other Node host (Dockerfile provided)
- Database: Supabase/Neon

Migrations on deploy:
```bash
npm run prisma:deploy --workspace @splitwise/backend
```

Production flags:
- Ensure `NEXT_PUBLIC_ENABLE_DEMO_PREVIEW` is `false` in production

## Roadmap
- Analytics dashboards (category/member/month)
- OCR receipts, PDF/Excel exports
- PWA + offline sync
- Security & performance hardening

## Contributing & Policies
- See CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md, RELEASE.md
- Open issues/PRs with clear repros and screenshots where applicable

---

Enjoy building Splitly!

