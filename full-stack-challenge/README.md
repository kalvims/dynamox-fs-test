# Dynamox Full-Stack Challenge

Implementation of the [Full-Stack Developer Challenge](../full-stack-challenge.md).

## Structure

```
fullstack-test/
  apps/api       Node.js + Express + Prisma + PostgreSQL
  apps/web       Vite + React + TypeScript + MUI 5 + Redux Toolkit
  libs/shared    Shared types and domain rules
```

## Prerequisites

- Node.js 20+
- Docker (PostgreSQL)

## Quick start

```bash
cd fullstack-test
npm install
npm run db:up
cp apps/api/.env.example apps/api/.env   # if needed
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev:api   # http://localhost:3001
npm run dev:web   # http://localhost:4200
```

**Seed credentials:** `admin@dynamox.test` / `Dynamox@123`

## Assumptions (so far)

1. Auth uses a single seeded user with JWT (stateless). Logout clears the client token and hits `POST /api/auth/logout` for API symmetry.
2. Machine types are exactly `Pump` and `Fan` (Prisma enums + shared TS enums).
3. Deleting a machine cascades to monitoring points, sensors and readings (to be used in later features).
4. Private routes on the web require a valid JWT restored via `GET /api/auth/me`.
5. API CORS allows `http://localhost:4200`; the Vite proxy also forwards `/api` in development.

## Current progress (Phase 1)

- [x] Nx monorepo scaffold
- [x] PostgreSQL + Prisma schema + seed
- [x] Auth (login / logout / protected routes)
- [x] Machines CRUD (API + UI)
- [ ] Monitoring points & sensors
- [ ] Time-series
- [ ] Broader automated tests / e2e
