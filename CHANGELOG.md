# Changelog

All notable changes to this project will be documented in this file.

## 0.1.0 – Polish Sprint
- Frontend: unified loading skeletons, responsive layout polish, accessible focus states, and consistent copy tone.
- Split dashboard: improved owed/owing labels, demo balances, and deep links to settle-up.
- Error handling: actionable toasts and retry affordances for common fetch/mutation flows.
- Performance: added bundle analyzer (`npm run analyze --workspace @splitwise/frontend`) and Core Web Vitals reporting.
- Backend: enabled gzip compression and removed `X-Powered-By`; documented rate limits.
- DX: pre-dev automation for Dockerized Postgres + Prisma migrate/generate; added backend Dockerfile.

## 0.1.0 – Initial Preview
- Auth (email/password), groups CRUD, expense CRUD with split modes, balances with simplification and settlements.
- Next.js 14 app router UI with Tailwind, React Query; Express + Prisma API.
