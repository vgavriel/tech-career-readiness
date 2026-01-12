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
- Add `.env.test` with:
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

## Flake prevention checklist
- Do not hit real OAuth or external content URLs in tests.
- Mock all network calls with MSW or Playwright routing.
- Use `LESSON_CONTENT_MOCK_HTML` to bypass publishedUrl fetches in test runs.
- Fix time with `TZ=UTC` and fake timers when needed.
- Use role- and label-based queries instead of fragile selectors.
- Avoid arbitrary sleeps; rely on Playwright/Vitest auto-waits.
- Keep seed data deterministic and stable across runs.

## Local integration + E2E quickstart
Requires Docker for the ephemeral Postgres test database.

```bash
npm run test:integration:local
```

```bash
npm run test:e2e:local
```

Use `KEEP_TEST_DB=1` to keep the container running after the command finishes.
Use `USE_EXISTING_DB=1` with `DATABASE_URL` to skip Docker entirely.

## CI execution
- `test:unit` on every PR.
- `test:integration` on every PR.
- `test:e2e` on main branch and nightly (or on PRs for critical changes).
- Track coverage for `src/lib` and critical components; set realistic thresholds.

## Rollout plan
1) Add test tooling and a minimal smoke suite (unit + one e2e).
2) Build out API + DB integration coverage.
3) Expand e2e coverage to the full MVP flows.
