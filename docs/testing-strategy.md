# Testing Strategy

## Goals

- High confidence that core user flows work end-to-end.
- Fast feedback from unit and integration tests.
- Low flake rates by eliminating real network calls and nondeterminism.

## Test pyramid and tooling

- Unit tests (majority): Vitest + @testing-library/react + jsdom.
- Integration tests: Vitest + MSW for HTTP stubs + Prisma against a test database.
- End-to-end tests: Playwright against a built Next.js server.

## Test environments and data

- Use a dedicated test database and never reuse dev/prod data.
- If you use `.env.test`, include:
  - `APP_ENV=test`
  - `DATABASE_URL` pointing to the test database.
  - `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` as dummy values.
- Migrate and seed once per test run; isolate tests with:
  - transaction rollback per test, or
  - truncate tables between tests, or
  - a fresh database/schema per run.
- Prefer fixtures and data builders over inline data to keep tests readable.

## Unit tests (fast, deterministic)

Target pure logic and UI rendering without hitting the DB or network.

- `src/lib/*`: env validation helpers, slug resolution, progress calculations.
- `src/components/*`: render states and interactions (e.g., signed-in vs signed-out header).
- Content sanitization and caching logic once implemented.

## Integration tests (API + DB)

Verify route handlers, DB access, and caching behavior with real data.

- Lesson content route:
  - fetch publishedUrl HTML via MSW fixture
  - sanitize output
  - cache hit/miss behavior and TTL handling
- Progress routes:
  - mark complete/incomplete
  - enforce unique `(userId, lessonId)`
  - merge guest progress on sign-in
- Slug alias redirects:
  - resolve canonical lesson/module slugs
  - return 404 for missing slugs

## End-to-end tests (critical flows)

Run against the built app with a seeded test DB.

- Public browsing:
  - landing -> roadmap -> lesson page
  - lesson content renders without auth
- Auth + progress:
  - test auth provider (no real Google OAuth)
  - mark lesson complete, persist, and show progress percent
  - "Continue where you left off" navigates to next incomplete lesson
- Guest progress:
  - toggle progress while logged out (localStorage)
  - sign in and verify merge behavior
- Error handling:
  - unknown lesson slug shows 404
  - upstream content failure shows a friendly error state

## Accessibility checks (automated)

- Use pa11y-ci with WCAG AAA standard for key routes.
- Run locally with `npm run test:a11y:local` (server already running) or `npm run test:a11y` (build + start).
- CI runs `npm run test:a11y` against a seeded test database with mock lesson content.
- An npm override makes `pa11y-ci` use the directly declared `pa11y` version. The unit suite checks installed module resolution so a Pa11y upgrade cannot pass by auditing with an older nested copy.
- `npm run test:a11y` will auto-start the Dockerized test DB if `DATABASE_URL` is missing or unreachable (set `A11Y_SKIP_TEST_DB=1` to skip).

## Flake prevention checklist

- Do not hit real OAuth or external content URLs in tests.
- Mock all network calls with MSW or Playwright routing.
- Use `LESSON_CONTENT_MOCK_HTML` to bypass publishedUrl fetches in test runs.
- Fix time with `TZ=UTC` and fake timers when needed.
- Use role- and label-based queries instead of fragile selectors.
- Avoid arbitrary sleeps; rely on Playwright/Vitest auto-waits.
- Keep lesson navigation within one document to exercise the router cache. For
  delayed navigation, hold target requests (including prefetches) before loading
  the source page, wait for the navigator to hydrate, and assert no document reload.
- Keep seed data deterministic and stable across runs.

## Local integration + E2E quickstart

Requires Docker for the ephemeral Postgres test database.

```bash
npm run test:integration:local
```

```bash
npm run test:e2e:local
```

The E2E helper migrates and seeds the test database, builds the app with the test
environment, then runs Playwright against `next start`. Playwright starts a fresh
server on port `3001` and fails if that port is occupied; use `PLAYWRIGHT_PORT` to
choose another port. It does not reuse a development server, whose Fast Refresh
reloads can interrupt navigation tests.

When managing the test database yourself, run `npm run build` before
`npm run test:e2e`. Use the same test environment for both commands, including
`APP_ENV=test`, the mock lesson content, dummy auth credentials, and
`NEXTAUTH_URL` / `NEXT_PUBLIC_SITE_URL` matching the Playwright base URL. CI runs
the build as a separate step after seeding so build failures appear separately
from browser-test failures.

Use `KEEP_TEST_DB=1` to keep the container running after the command finishes.
`npm run test:integration` expects `DATABASE_URL` to be set (CI uses this).
If port `5434` is already in use, set `TEST_DB_PORT` to a free port.

## CI execution

- See [Dependency updates](dependency-updates.md) for the auto-merge policy and the CI coverage required for development-tool majors.
- `test:unit` on every PR.
- `test:integration` on every PR.
- `test:e2e` and `test:a11y` on every Renovate PR, on `main`, and through manual workflow dispatch.
- Track coverage for `src/lib` and critical components; set realistic thresholds.

## Rollout plan

1. Add test tooling and a minimal smoke suite (unit + one e2e).
2. Build out API + DB integration coverage.
3. Expand e2e coverage to the full MVP flows.
