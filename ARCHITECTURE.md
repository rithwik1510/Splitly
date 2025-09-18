# Architecture

This monorepo contains a Next.js frontend and an Express/Prisma backend connected to PostgreSQL.

## High-level

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

## Frontend
- Next.js App Router using React 18, TypeScript, and Tailwind.
- Data fetching via React Query with cache keys scoped by resource (groups, balances, history).
- Theming & a11y: next-themes for light/dark, aria-live loading, skip links.

## Backend
- Express + TypeScript with modular routers/services.
- Prisma schema models Users, Groups, Expenses, Shares, Settlements.
- JWT auth with future OAuth providers.

## Data considerations
- Amounts stored as Decimal in DB, converted for UI precision.
- Group base currency is the source of truth for balances & settlements.

## Environments
- Local: Docker Postgres (`docker-compose.yml`).
- Prod: Render/other for API, Vercel for Next.js, Supabase/Neon for DB.

