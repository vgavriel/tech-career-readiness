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

## Release versions

`npm run build` wraps `next build` with `scripts/with-build-version.mjs`. The
wrapper computes a date-based deploy version (`YYYY.MM.DD.<short-sha>`) and
passes it into Next.js as the build id and `NEXT_PUBLIC_APP_VERSION`.

On every push to `main`, `.github/workflows/version.yml` creates the matching
Git tag and GitHub release (`vYYYY.MM.DD.<short-sha>`). Deployed versions can be
checked with the `X-App-Version` response header or `GET /api/version`.

## Related docs

- [Testing strategy](./testing.md)
- [Engineering standards](../engineering-standards.md)
- [Implementation plan](../implementation-plan.md)
