# Splitly — Modern Expense Sharing (Monorepo)

[![CI](https://github.com/YOUR_USER/YOUR_REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USER/YOUR_REPO/actions/workflows/ci.yml)
[![CodeQL](https://github.com/YOUR_USER/YOUR_REPO/actions/workflows/codeql.yml/badge.svg)](https://github.com/YOUR_USER/YOUR_REPO/actions/workflows/codeql.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Node](https://img.shields.io/badge/Node-20+-339933?logo=node.js&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![License](https://img.shields.io/badge/license-MIT-informational)

A modern, full‑stack Splitwise alternative for groups and friends. Track expenses with multiple split modes, multi‑currency balances, and simplified settlements — in a fast, accessible UI with dark/light themes. Monorepo includes a Next.js frontend and a TypeScript Express + Prisma backend.

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
- Contributing, Security & License

## Features
- Expense tracking with split modes: equal, unequal, percent, shares
- Multi‑currency groups + simplified settlements
- Responsive, theme‑aware UI (light/dark) with a11y cues and keyboard support
- Dashboard overview of owed/owing across individuals and groups
- Groups: members, expenses, balances, settle‑up history
- Ready for OCR receipts and analytics (future roadmap)
- Monorepo with CI/CD, code standards, and docs

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
