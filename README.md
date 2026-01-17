Tech Career Readiness is a self-paced learning app for college students. It's built with Next.js, Prisma, and Postgres.

## Getting started

### Local (recommended)
```bash
npm install
npm run dev:local
```

This uses a tmpfs-backed Postgres container, dev credentials auth, and no-op
rate limiting. It will create `.env.local` from `.env.example` if needed.

### Staging-like (real services)
```bash
npm install
npm run env:staging
# fill in .env.staging.local
npm run dev:staging
```

See `docs/environments.md` for the full workflow.

### Environment variables and secrets
- `APP_ENV` controls behavior (`local`, `staging`, `production`, `test`).
- Dev: Next.js loads `.env`, `.env.local`, `.env.development`, and
  `.env.development.local` (later files override earlier ones).
- Prod: set variables in your hosting provider or secret manager; do not ship
  `.env` files.
- Keep secrets out of client code and never commit real values. Only commit
  `.env.example` and `.env.staging.example`.

Additional app configuration:
- `ADMIN_EMAILS` (comma-separated) to bootstrap admin access in dev/test only. In
  production, set `User.isAdmin` directly in the database.
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` for rate limiting.
- `MAX_JSON_BODY_BYTES` (optional) to adjust JSON payload size limits.

## Notes
- App code lives in `src/app`.
- Prisma schema lives in `prisma/schema.prisma`.
- Seeding uses the Postgres adapter (`@prisma/adapter-pg`) and `pg`.

## Testing
See `docs/testing-strategy.md` for the unit, integration, and end-to-end test plan.

Local integration + E2E quickstart (requires Docker):
```bash
npm run test:integration:local
npm run test:e2e:local
```
Ensure your Docker daemon is running (Docker Desktop, Colima, OrbStack, or
Rancher Desktop) before running these commands.
If port `5434` is already in use, set `TEST_DB_PORT` to a free port.

For CI or a custom test database, set `DATABASE_URL` and run
`npm run test:integration`.

## References
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
