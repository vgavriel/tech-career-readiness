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

## Mobile lesson layout regressions

`e2e/lesson-layout.spec.ts` runs in desktop Chromium and iPhone SE/15 WebKit
projects. It uses the real roadmap content and the existing mocked content for
the next lesson, with no Google Docs or OAuth requests.

- Measure the lesson pane against the visible viewport and reject extra scroll
  space in its ancestors or horizontal overflow.
- Scroll only the lesson pane to the end, then require the final paragraph and
  Next action to be fully visible with no large empty area below them.
- Tap Next by screen coordinates on mobile so Playwright cannot hide a scroll
  trap by automatically scrolling a locator into view. Verify navigation to the
  next lesson and its initial heading position.
- Measure list marker gutters and text bounds in light and dark themes.
- Shrink/restore the viewport and rotate between portrait and landscape; verify
  Next and the navigator remain reachable after layout settles.
- Save end-of-lesson/list screenshots, plus screenshots and traces on failure.
  These are review artifacts; geometry assertions provide the automated checks.

Run the focused suite locally (Docker is required for the test database):

```bash
PLAYWRIGHT_HOST_PLATFORM_OVERRIDE=mac15-arm64 \
PLAYWRIGHT_BROWSERS_PATH=.playwright-browsers \
npm run test:e2e:local -- e2e/lesson-layout.spec.ts
```

The local helper installs Chromium and WebKit when either is missing. The E2E
workflow runs these checks on every PR targeting main, as well as main pushes.
WebKit uses the same production build as Chromium. Local servers with `APP_ENV=test`
permit HTTP assets; deployed production and preview builds retain CSP upgrades to HTTPS.

Device emulation does not reproduce the iOS Chrome toolbar, on-screen keyboard,
or native momentum/rubber-band scrolling. Before release, also check Chrome on
a physical iPhone: scroll a long lesson to its end, tap Next, rotate the phone,
and repeat with browser controls expanded and collapsed. Viewport resizing is
an automated approximation of changing available space, not a real toolbar test.

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
- `test:e2e` on every PR targeting main and every main push, with manual runs available.
- `test:a11y` on every Renovate PR, on main, and through manual workflow dispatch.
- Track coverage for `src/lib` and critical components; set realistic thresholds.

## Rollout plan

1. Add test tooling and a minimal smoke suite (unit + one e2e).
2. Build out API + DB integration coverage.
3. Expand e2e coverage to the full MVP flows.
