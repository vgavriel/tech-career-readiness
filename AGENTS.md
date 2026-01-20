# Agent Guide

## Purpose
This file provides meta-context for coding agents working in this repo.

## Project snapshot
- Product: Tech Career Readiness, a self-paced learning app for students.
- Stack: Next.js (App Router) + TypeScript + Prisma + Postgres + NextAuth.
- Key docs: `README.md`, `docs/implementation-plan.md`,
  `docs/testing-strategy.md`, `docs/codex-instructions.md`.

## Workflow expectations for agents
- Follow `docs/implementation-plan.md` in order and update its checklist.
- Create a new feature branch per request (e.g., `feature/<scope>` or
  `chore/<scope>`) unless told to work on `main`.
- Commit after each phase; run a pre-commit review for bugs/edge cases/cleanup.
- Add/update tests for features or bugfixes; avoid real network/OAuth in tests.
- State which tests were run or why they were not run.
- Use the installed Context7 MCP for up-to-date docs for all deps and packages.

## Key paths
- App routes and pages: `src/app`
- Shared UI: `src/components`
- Server/lib logic: `src/lib`
- Prisma schema: `prisma/schema.prisma`
- Tests: `src/**/__tests__`
- Vitest config/setup: `tooling/vitest.config.ts`, `tooling/vitest.setup.ts`

## Setup (local)
```bash
npm install
npm run dev:local
```

## Testing
```bash
npm run lint
npm run test
npm run test:unit
```

## Environment variables
- `DATABASE_URL` (required for Prisma)
- `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (Auth.js)
