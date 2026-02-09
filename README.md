<div align="center">

# Splitly — Modern Expense Sharing

</div>

<p align="center">
A polished, full‑stack Splitwise alternative for groups and friends. Track expenses with multiple split modes, multi‑currency balances, and simplified settlements — in a fast, accessible UI with dark/light themes. This monorepo includes a Next.js frontend and a TypeScript Express + Prisma backend.
</p>

<p align="center">

[![CI](https://github.com/rithwik1510/Splitly/actions/workflows/ci.yml/badge.svg)](https://github.com/rithwik1510/Splitly/actions/workflows/ci.yml)
[![CodeQL](https://github.com/rithwik1510/Splitly/actions/workflows/codeql.yml/badge.svg)](https://github.com/rithwik1510/Splitly/actions/workflows/codeql.yml)
![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Node](https://img.shields.io/badge/Node-20+-339933?logo=node.js&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</p>

---

## 📚 Table of Contents

- [✨ Features](#-features)
- [🚀 Tech Stack](#-tech-stack)
- [🏛️ Architecture](#️-architecture)
- [📸 Screenshots](#-screenshots)
- [🏁 Getting Started](#-getting-started)
- [⚙️ Configuration](#️-configuration)
- [🧪 Testing](#-testing)
- [💡 Troubleshooting](#-troubleshooting)
- [🚀 Recent Updates](#-recent-updates)
- [🤝 Contributing](#-contributing)
- [📜 License](#-license)

---

## ✨ Features

- **Expense Tracking**: Multiple split modes (equal, unequal, percent, shares).
- **Multi-Currency Support**: Create groups with different currencies and get simplified settlements.
- **Modern UI**: Responsive, theme-aware UI (light/dark) with accessibility features.
- **Dashboard**: Overview of what you owe and what you are owed.
- **Groups**: Manage members, expenses, balances, and settlement history.
- **And much more...**

## 🚀 Tech Stack

- **Frontend**: Next.js (App Router), React 18, TypeScript, Tailwind CSS, React Query, next-themes
- **Backend**: Node.js, Express, TypeScript, Prisma (PostgreSQL)
- **Tooling**: npm workspaces, Prettier, ESLint, Vitest (backend), Docker
- **CI/CD**: GitHub Actions (CI + CodeQL)

## 🏛️ Architecture

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

See [ARCHITECTURE.md](ARCHITECTURE.md) for more details.

## 📸 Screenshots

<p align="center">
  <img src="docs/assets/split-dashboard-hero.png" alt="Split dashboard hero section" width="90%">
  <br />
  <em>Split dashboard hero with quick context for participants, currency, and latest activity.</em>
</p>

<p align="center">
  <img src="docs/assets/split-dashboard-full.png" alt="Split dashboard full view" width="90%">
  <br />
  <em>Full dashboard overview with balances, sharing groups, and add-expense panel.</em>
</p>

<p align="center">
  <img src="docs/assets/expense-editor-detail.png" alt="Expense editor detailed form" width="90%">
  <br />
  <em>Expense editor form with split mode controls and participant selector.</em>
</p>

<p align="center">
  <img src="docs/assets/expense-editor-full.png" alt="Expense editor complete panel" width="90%">
  <br />
  <em>Complete expense editor workflow with snapshot card and save action.</em>
</p>

## 🏁 Getting Started

### Prerequisites

- Node.js 20+
- npm 8+
- Docker (optional, for local Postgres)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/rithwik1510/Splitly.git
    ```
2.  Install dependencies:
    ```bash
    npm run setup
    ```
3.  Run the development servers:
    ```bash
    npm run dev
    ```

The frontend will be available at `http://localhost:3000` and the backend at `http://localhost:4000`.

## ⚙️ Configuration

The application requires some environment variables to be set. Copy the `.env.example` files to `.env` in both the `apps/frontend` and `apps/backend` directories and fill in the required values.

### Frontend (`apps/frontend/.env.local`)

```
NEXT_PUBLIC_API_URL="http://localhost:4000"
NEXT_PUBLIC_ENABLE_DEMO_PREVIEW="false"
```

### Backend (`apps/backend/.env`)

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/splitwise_plus
CORS_ORIGIN="http://localhost:3000"
JWT_SECRET=your-32+char-secret
REFRESH_JWT_SECRET=your-32+char-refresh-secret
```

## 🧪 Testing

- **Backend**: Vitest unit tests for settlement logic.
- **Linting**: ESLint + Prettier for code quality.
- **CI**: GitHub Actions runs lint, tests, and builds on PRs to `main`.

To run the tests, use the following command:

```bash
npm run test --workspace @splitwise/backend
```

## 💡 Troubleshooting

- **CORS errors**: ensure backend `.env` `CORS_ORIGIN` includes the frontend origin(s) and restart the API.
- **JWT Zod errors**: secrets must be =32 characters.
- **Port already in use**: `npm run dev` clears ports 3000/4000 automatically; for stubborn cases run `npx kill-port 3000 4000` or terminate the PID shown by `netstat -ano`.
- **Local Postgres**: `npm run db:up` brings the Docker service up and `npm run db:down` stops it. Verify it with `docker ps` or `docker exec splitwise_plus_db psql -U postgres -l`. Set `SKIP_DB_BOOT=1` if you manage the database yourself.

## 🚀 Recent Updates

- Rebranded the product to **Splitly** and refreshed the UI with a teal-forward palette (`#14B8A6` / `#2DD4BF`) for light/dark themes.
- Updated buttons, cards, inputs, auth pages, and group dashboards to use the new Splitly colors and typography accents.
- Introduced a post-login Split tab with quick totals, filterable individual/group balances, and inline settle shortcuts.
- Balance overview now reuses frontend settlements to surface owed/owing summaries per person and per group.
- Deep links into group settle-up forms prefill counterparty/mode so follow-up actions stay frictionless.
- Expense editor now lets you search for users and add them as participants on the fly before saving a split.
- Pre-dev automation now waits for Dockerized Postgres, applies Prisma migrate/generate, and launches both apps with one `npm run dev`.
- Polished the Split dashboard labels ("You are owed"/"You owe"), added demo preview balances, and improved accessibility cues across owed/owing tables.
- Introduced a header profile menu with Profile/History/Settings routes, sample data safeguards, and reliable layering in light/dark themes.
- Shipped dedicated Profile, History, and Settings surfaces with local preference storage and quick "Back to dashboard" controls to speed navigation.

## 🤝 Contributing

Contributions are welcome! Please see the [CONTRIBUTING.md](CONTRIBUTING.md) file for more details.

## 📜 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
