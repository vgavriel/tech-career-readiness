# Environments

This project supports two local workflows:

- Local: fully offline, tmpfs Postgres, dev auth, no-op rate limiting.
- Staging: real Neon DB, Google OAuth, Upstash rate limiting.

Both workflows use `APP_ENV` to control behavior.

## Local (APP_ENV=local)

Use this for everyday development and onboarding.

```bash
npm run dev:local
```

What it does:
- Creates `.env.local` if missing (from `.env.example`).
- Forces `APP_ENV=local`.
- Starts a tmpfs-backed Postgres container.
- Runs `prisma migrate deploy`, `prisma generate`, and `prisma db seed`.
- Starts the dev server.

If you only want to refresh the env file without starting Docker:
```bash
npm run env:local
```

If you want to prep the local DB without starting the server:
```bash
npm run dev:setup
```

Auth and rate limiting:
- Uses a dev-only credentials provider (no Google OAuth).
- Rate limiting is disabled.

## Staging (APP_ENV=staging)

Use this when you need real integrations (Neon, Google OAuth, Upstash).

```bash
npm run env:staging
# edit .env.staging.local with real credentials
npm run dev:staging
```

Requirements:
- `DATABASE_URL` for Neon.
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`.
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`.
- `NEXTAUTH_URL` set to the local dev URL (or your deployed staging URL).

Notes:
- `APP_ENV=staging` disables dev auth and requires Google OAuth.
- Rate limiting requires Upstash config.

## Tests (APP_ENV=test)

Test runners set `APP_ENV=test` automatically.
Auth uses the dev credentials provider, and lesson content can be mocked.
