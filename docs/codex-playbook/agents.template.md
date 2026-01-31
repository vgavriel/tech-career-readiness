# Agent Guide (Template)

## Purpose

This file provides instructions to Codex (or any coding agent) about how to operate in this repo.

## Project snapshot

- Product: [one-line description]
- Stack: [frontend] + [backend] + [db] + [auth]
- Key docs: `README.md`, `docs/implementation-plan.md`, `docs/testing-strategy.md`

## Workflow expectations for agents

- Follow `docs/implementation-plan.md` in order and update its checklist.
- Create a new branch per request (e.g., `feature/<scope>` or `chore/<scope>`).
- Commit after each phase; run a quick self-review.
- Add/update tests for features or bugfixes; avoid real network/OAuth in tests.
- State which tests were run (or why not run).

## Key paths

- App routes: `src/app`
- Shared UI: `src/components`
- Server/lib logic: `src/lib`
- Schema: `prisma/schema.prisma`
- Tests: `src/**/__tests__`

## Setup (local)

```bash
npm install
npm run dev
```

## Testing

```bash
npm run lint
npm run test
```

## Environment variables

- `DATABASE_URL`
- `AUTH_SECRET`
- `PROVIDER_CLIENT_ID`
- `PROVIDER_CLIENT_SECRET`

---

## Instructions to Codex

- Keep changes scoped and explain reasoning.
- Prefer minimal, incremental changes.
- Ask clarifying questions when requirements are ambiguous.
