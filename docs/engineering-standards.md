# Engineering Standards

These standards keep the codebase consistent, safe, and easy to maintain.

## Type safety & build discipline

- Run `npm run typecheck` in CI and before larger refactors.
- Keep `"strict": true` in `tsconfig.json`.
- Avoid `any` and `ts-ignore` unless explicitly justified in a comment.

## Formatting & linting

- Prettier is the formatter of record: use `npm run format` or let `lint-staged` handle it.
- ESLint enforces import order (`simple-import-sort`) and unused exports (`import/no-unused-modules`) for `src/lib`, `src/components`, and `src/hooks`.
- Avoid server-only imports in client components: no `next/headers` or `next-auth` in `src/components` and `src/hooks`.

## App Router boundaries (cacheComponents)

- Keep runtime APIs (`cookies()`, `headers()`, `getServerSession`) inside the app-shell boundary.
- `src/app/layout.tsx` should stay static; runtime data goes in `src/components/app-shell.tsx`.
- Any client component that depends on runtime data must render inside the same `<Suspense>` boundary.

## Caching & content rendering

- Lesson content caching layers:
  - In-memory cache (local fallback).
  - Redis cache (shared in preview/production).
  - CDN cache for `/api/lesson-content` (s-maxage + SWR).
- Avoid using runtime APIs inside cache scopes (`use cache` or cached helpers).
- When lesson content is updated, prefer explicit invalidation (version bump or key rotation).

## API and security conventions

- Validate request payloads with Zod.
- Enforce request size limits and rate limiting in public endpoints.
- Use `errorResponse` for consistent error shapes and log with `createRequestLogger`.
- Keep SSRF allowlists tight (Google Docs only).

## Testing expectations

- Unit tests for pure logic and components.
- Integration tests for API/DB boundaries.
- E2E tests for critical user flows.
- No real network/OAuth calls in tests; use mocks or Playwright routing.

## Documentation

- Keep architectural rules in `docs/architecture.md`.
- Update `docs/implementation-plan.md` checklists as phases complete.
- Add or update docs when changing system behavior (caching, auth, logging).
