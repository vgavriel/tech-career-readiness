# Principal Engineering Review Checklist

## Purpose

Methodical, evidence-driven review and remediation plan to keep this codebase correct, secure, idiomatic, and simple.

## Why This Order

1. **Baseline first**: establish objective health signals before making changes.
2. **Refactor planning second**: choose high-ROI targets to avoid random churn.
3. **Correctness third**: fix behavior and data integrity risks before style/structure.
4. **Idiomatic fourth**: align implementation with TypeScript/Next.js/Prisma patterns.
5. **Simplicity fifth**: remove complexity only after behavior is stable and covered.
6. **Regression pass last**: verify no quality regressions after improvements.

This order minimizes rework and protects user-facing behavior while incrementally improving maintainability.

## Scoring

- `0`: no evidence
- `1`: high risk
- `2`: works but fragile
- `3`: solid production quality
- `4`: excellent

Passing threshold for each mandatory gate:

- Gate average `>= 3.0`
- No criterion below `2`
- Zero open `P0`/`P1` findings for correctness

## Baseline Evidence (2026-02-27)

- [x] `npm run lint` (1 warning, 0 errors)
- [x] `npm run typecheck`
- [x] `npm run test:unit` (47 files, 205 tests passed)
- [x] `npm run test:integration:local` (3 files, 17 tests passed)
- [x] `npm run test:e2e:local` (11 tests passed)
- [x] `npm run test:a11y` (6/6 URLs passed)

## Gate 1: Refactor Planning

- [x] Collect hotspot evidence (size + churn)
- [x] Rank candidates by `(Impact x Risk x Churn) / Effort`
- [ ] Approve first refactor batch
- [ ] Define rollback + success metrics for each batch

### Current Refactor Candidates

1. `src/components/lesson-navigator.tsx` (large UI + state logic mixed; high churn)
2. `src/components/site-header.tsx` (desktop/mobile duplication and interaction complexity)
3. `src/app/lesson/[slug]/page.tsx` (data fetch, fallback policy, and rendering concerns coupled)

## Gate 2: Correctness

- [x] Validate auth/origin/rate-limit protections on mutable APIs
- [x] Verify API payload validation and request-size limits
- [x] Fix deterministic correctness issue: focus menu panel IDs are now instance-safe
- [x] Guard against empty sanitized lesson content (avoid blank lesson rendering)
- [ ] Audit remaining edge-case behavior for progress merges

## Gate 3: Idiomatic Implementation

- [x] Remove lint warning in `lesson-next-core-cta` via explicit typed memo return
- [x] Make E2E selectors robust by resolving focus panel via `aria-controls`
- [ ] Audit remaining high-churn modules for idiomatic simplifications

## Gate 4: Simplicity and Effectiveness

- [x] Reduce duplication in `site-header` nav/action rendering
- [ ] Extract navigator row rendering concerns from `lesson-navigator`
- [ ] Re-check cognitive load after refactor edits

## Regression Gate

- [x] `npm run lint`
- [x] `npm run typecheck`
- [x] `npm run test:unit -- src/components/__tests__/focus-menu.test.tsx src/components/__tests__/lesson-next-core-cta.test.tsx`
- [x] `npm run test:unit -- src/lib/__tests__/lesson-content.test.ts`
- [x] `npm run test:e2e:local -- e2e/header-responsive.spec.ts e2e/secondary-pages.spec.ts`
- [x] `npm run test:e2e:local -- e2e/public-browsing.spec.ts e2e/lesson-content-error.spec.ts`
- [x] `npm run test:unit -- src/components/__tests__/site-header.test.tsx`
- [x] `npm run test:e2e:local -- e2e/header-responsive.spec.ts`

## Findings Log

- **P1 (fixed)**: duplicate hardcoded `id="focus-menu-panel"` could create invalid DOM ID collisions and brittle selectors when multiple focus menus exist.
  - Fix: generated per-instance focus panel IDs; updated tests to resolve target panel from toggle `aria-controls`.
- **P3 (fixed)**: unused type alias in `lesson-next-core-cta`.
  - Fix: typed `useMemo` return to enforce state shape and remove warning.
- **P1 (fixed)**: lesson content pipeline could return sanitized empty HTML and render a blank lesson body.
  - Fix: added non-empty guard in `fetchLessonContent` and regression test coverage.
- **P3 (fixed)**: duplicated desktop/mobile header nav/disclosure markup increased drift risk.
  - Fix: centralized primary nav metadata and shared sign-in disclosure rendering in `site-header`.
