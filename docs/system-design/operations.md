# Operations, Environments, and Tooling

## What it is

This document covers the operational scaffolding: environment setup, scripts,
pre-commit hooks, and CI entry points.

## Why it exists

- Keeps developer onboarding consistent.
- Prevents regressions with automated linting and typechecks.
- Ensures CI behaves like local development.

## Environments

The app distinguishes between local, preview, test, and production. Secrets are
read from `.env.local` or `.env.preview` during setup.

Where it lives:

- Environment helpers: [`src/lib/env.ts`](../../src/lib/env.ts)
- Environment docs: [`docs/environments.md`](../environments.md)

## Scripts and tooling

- Typecheck wrapper (ensures Prisma client exists):
  [`scripts/typecheck.sh`](../../scripts/typecheck.sh)
- Postinstall hooks: [`scripts/postinstall.sh`](../../scripts/postinstall.sh)
- Pre-commit hook: [`.husky/pre-commit`](../../.husky/pre-commit)
- Command catalog: [`package.json`](../../package.json)

## CI entry points

- `npm run lint`
- `npm run test:unit`
- `npm run test:integration:local`
- `npm run test:e2e:local`

## Related docs

- [Testing strategy](./testing.md)
- [Engineering standards](../engineering-standards.md)
- [Implementation plan](../implementation-plan.md)
