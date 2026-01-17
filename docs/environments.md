# Environments

This project supports two local workflows:

- Local: fully offline, tmpfs Postgres, dev auth, no-op rate limiting.
- Preview: real Neon DB, Google OAuth, Upstash rate limiting.

Both workflows use `APP_ENV` to control behavior.
Env files: `.env.local` is auto-loaded by Next.js, `.env.preview` is loaded by
`npm run dev:preview`. This repo does not use `.env`.
Templates: `.env.example` is the local template and `.env.preview.example` is
the preview template.

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
If the dev database container is already running, the script reuses it (and its
port) so you can restart the app without re-creating the DB.

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

## Preview (APP_ENV=preview)

Use this when you need real integrations (Neon, Google OAuth, Upstash).

```bash
npm run env:preview
# edit .env.preview with real credentials
npm run dev:preview
```

Requirements:
- `DATABASE_URL` for Neon.
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`.
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`.
- `NEXTAUTH_URL` set to the local dev URL (or your deployed preview URL).

Notes:
- `APP_ENV=preview` disables dev auth and requires Google OAuth.
- Rate limiting requires Upstash config.

## Tests (APP_ENV=test)

Test runners set `APP_ENV=test` automatically.
Auth uses the dev credentials provider, and lesson content can be mocked.
