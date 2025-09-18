# Splitly — Modern Expense Sharing (Monorepo)

[![CI](https://github.com/rithwik1510/Splitly/actions/workflows/ci.yml/badge.svg)](https://github.com/rithwik1510/Splitly/actions/workflows/ci.yml)
[![CodeQL](https://github.com/rithwik1510/Splitly/actions/workflows/codeql.yml/badge.svg)](https://github.com/rithwik1510/Splitly/actions/workflows/codeql.yml)
![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Node](https://img.shields.io/badge/Node-20+-339933?logo=node.js&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)

A polished, full‑stack Splitwise alternative for groups and friends. Track expenses with multiple split modes, multi‑currency balances, and simplified settlements — in a fast, accessible UI with dark/light themes. This monorepo includes a Next.js frontend and a TypeScript Express + Prisma backend.

> Short description for GitHub:  
> Splitly is a modern expense sharing app with multi‑currency groups, multiple split modes, and simplified settlements. Next.js + TypeScript frontend, Express + Prisma backend, Postgres database, a11y‑friendly UI, and CI/CD ready for deployment.

---

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
- Expense tracking with split modes: equal, unequal, percent, and shares
- Multi‑currency groups + simplified settlements
- Dashboard overview of owed/owing across individuals and groups
- Responsive, theme‑aware UI (light/dark) with a11y cues and keyboard support
- Groups: members, expenses, balances, settle‑up history
- OCR‑ready architecture and analytics hooks (roadmap)

## Tech Stack
- Frontend: Next.js (App Router), React 18, TypeScript, Tailwind CSS, React Query, next-themes
- Backend: Node.js, Express, TypeScript, Prisma (PostgreSQL)
- Tooling: npm workspaces, ESLint, Prettier, Vitest (backend), Docker
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


