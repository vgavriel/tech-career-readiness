Tech Career Readiness is a self-paced learning app for college students. It's built with Next.js, Prisma, and Postgres.

## Getting started

### 1) Install dependencies
```bash
npm install
```

### 2) Configure environment
Copy the example env file and set your database connection string.
```bash
cp .env.example .env
```

`DATABASE_URL` is required for Prisma CLI and seeding. Prisma 7 reads datasource config from `prisma.config.ts`.

For Auth.js (NextAuth):
- Generate `NEXTAUTH_SECRET` with `openssl rand -base64 32`.
- Create a Google OAuth client in Google Cloud Console and set
  `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`. Use
  `http://localhost:3000/api/auth/callback/google` as the redirect URI for
  local development.

### Environment variables and secrets
- Dev: Next.js loads `.env`, `.env.local`, `.env.development`, and
  `.env.development.local` (later files override earlier ones).
- Prod: set variables in your hosting provider or secret manager; do not ship
  `.env` files.
- Keep secrets out of client code and never commit real values. Only commit
  `.env.example`.

Additional app configuration:
- `ADMIN_EMAILS` (comma-separated) to bootstrap admin access in production.
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` for rate limiting.
- `MAX_JSON_BODY_BYTES` (optional) to adjust JSON payload size limits.

### 3) Apply migrations and seed data
```bash
npx prisma migrate deploy
npx prisma db seed
```

### 4) Run the dev server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

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
