# Splitly — Modern Expense Sharing

[![CI](https://github.com/rithwik1510/Splitly/actions/workflows/ci.yml/badge.svg)](https://github.com/rithwik1510/Splitly/actions/workflows/ci.yml)
[![CodeQL](https://github.com/rithwik1510/Splitly/actions/workflows/codeql.yml/badge.svg)](https://github.com/rithwik1510/Splitly/actions/workflows/codeql.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Node](https://img.shields.io/badge/Node-20+-339933?logo=node.js&logoColor=white)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A polished, full‑stack Splitwise alternative for groups and friends. Track expenses with multiple split modes, multi‑currency balances, and simplified settlements — in a fast, accessible UI with dark/light themes. This monorepo contains a Next.js frontend and a TypeScript Express + Prisma backend.

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
  <img src="docs/assets/split-dashboard-dark.png" alt="Split dashboard — dark theme" width="80%">
  <em>Split dashboard — quick totals, filters, and tabbed view across Individuals/Groups.</em>
</p>

<p align="center">
  <img src="docs/assets/expense-editor-dark.png" alt="Expense editor — dark theme" width="80%">
  <em>Expense editor — split modes (equal/unequal/percent/shares) and participants.</em>
</p>

## 🏁 Getting Started

### Prerequisites

- Node.js 20+
- npm 8+
- Docker (optional, for local Postgres)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/your-repo-name.git
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

## 🤝 Contributing

Contributions are welcome! Please see the [CONTRIBUTING.md](CONTRIBUTING.md) file for more details.

## 📜 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.