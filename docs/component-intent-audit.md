# Component Intent Audit (2026-02-27)

## Scope

- Reviewed every production component in `src/components/*.tsx` (19 files).
- Cross-checked runtime composition through `src/app` routes/pages.
- Included confidence ratings per component based on code + usage evidence.
- Updated after dead-code cleanup removing unused focus-roadmap wrappers and lesson progress card.

## Confidence Scale

- `High`: behavior and purpose are clear from implementation and live route usage.
- `Medium`: behavior is clear, but product intent/active usage is partial or indirect.

## Shell and App Infrastructure

### `app-shell.tsx`

- Does: server-side app wrapper that loads session/user/env flags and renders global providers + header.
- Why: centralize runtime APIs (`getServerSession`, user focus preload, analytics gating) outside static root layout.
- Used by: root layout.
- Confidence: `High`.

### `providers.tsx`

- Does: client provider stack (`SessionProvider` -> `FocusProvider` -> `ProgressProvider`) plus optional Vercel analytics and global client error reporting.
- Why: single composition point for app-wide state and telemetry.
- Used by: `app-shell`.
- Confidence: `High`.

### `site-header.tsx`

- Does: global navigation, auth controls, desktop/mobile menu behavior, and header-level focus menu.
- Why: persistent primary navigation and sign-in entrypoint across pages.
- Used by: `app-shell`.
- Confidence: `High`.

### `navigator-layout.tsx`

- Does: split-pane lesson layout with resizable/collapsible navigator, mobile drawer, and hash-link scroll handling inside nested scroll containers.
- Why: keep lesson navigation always available while preserving readable lesson content pane behavior.
- Used by: lesson detail page.
- Confidence: `High`.

## Focus and Progress State Layer

### `focus-provider.tsx`

- Does: focus selection context, optimistic updates, authenticated persistence to `/api/focus`, and lazy hydration per signed-in user.
- Why: one canonical focus state used by landing, header, roadmap logic, and lesson navigation ordering.
- Used by: `providers`, consumed by multiple components.
- Confidence: `High`.

### `progress-provider.tsx`

- Does: progress context with guest localStorage mode, authenticated API mode, merge-on-sign-in flow, error surfacing, and completion mutation API.
- Why: unify progress semantics across guest/auth states and avoid duplicate progress logic in UI components.
- Used by: `providers`, consumed broadly.
- Confidence: `High`.

### `focus-menu.tsx`

- Does: interactive focus dropdown/panel with keyboard support, outside-click dismissal, inline and popover modes.
- Why: quick focus switching from the header on secondary pages.
- Used by: `site-header` (desktop and mobile inline variant).
- Confidence: `High`.

### `focus-picker.tsx`

- Does: landing-page select control for optional focus selection.
- Why: make focus selection obvious at the top of onboarding.
- Used by: home page.
- Confidence: `High`.

### `sign-in-cta.tsx`

- Does: reusable sign-in button that resolves active auth provider and optional callback URL.
- Why: consistent sign-in trigger for multiple contexts without duplicating provider lookup logic.
- Used by: progress summary and lesson navigator surfaces.
- Confidence: `High`.

## Lesson Experience Components

### `lesson-content.tsx`

- Does: injects sanitized lesson HTML.
- Why: separates content rendering boundary from page-level fetch/fallback logic.
- Used by: lesson page.
- Confidence: `High`.

### `lesson-progress-toggle.tsx`

- Does: lesson-level complete/incomplete toggle with inline error state and dismiss.
- Why: primary completion control in lesson header.
- Used by: lesson page.
- Confidence: `High`.

### `lesson-next-core-cta.tsx`

- Does: computes next/catch-up/restart CTA based on core progression and active focus ordering.
- Why: guide users to the next meaningful action after reading a lesson.
- Used by: lesson page.
- Confidence: `High`.

### `lesson-navigator.tsx`

- Does: left-rail module/lesson navigator with focus-aware filtering, progress display, completion toggles, and active-lesson auto-scroll.
- Why: keep roadmap context and interaction on lesson pages without full-page route hops.
- Used by: `navigator-layout` in lesson page.
- Confidence: `High`.

### `lesson-not-found-cta.tsx`

- Does: computes best "back to course" destination for lesson 404 state, including completed-core fallback.
- Why: avoid dead-end 404 experience and preserve progression.
- Used by: lesson `not-found` page.
- Confidence: `High`.

## Curriculum and Progress Display Components

### `roadmap-progress-summary.tsx`

- Does: progress ring summary plus CTA logic (start/continue/review/restart), optional focus and extra-credit panes.
- Why: canonical progress summary UI reused across contexts.
- Used by: `home-progress-card`.
- Confidence: `High`.

### `home-progress-card.tsx`

- Does: homepage wrapper around `roadmap-progress-summary` with focused-home defaults.
- Why: keeps home-specific summary config separate from generic summary component.
- Used by: home page.
- Confidence: `High`.

### `role-library-list.tsx`

- Does: card grid for role deep-dive lessons with completion-aware badges.
- Why: dedicated presentation for role-library experience.
- Used by: roles page.
- Confidence: `High`.

### `back-to-course-cta.tsx`

- Does: computes personalized "Back to course" destination from focus/progress state.
- Why: shared return-to-roadmap action for non-lesson pages (roles/gold stars).
- Used by: roles and gold-stars pages.
- Confidence: `High`.

### `roadmap-gold-stars.tsx`

- Does: renders earned/in-progress milestone cards from gold-star status calculation.
- Why: gamification/progress reinforcement view.
- Used by: gold-stars page.
- Confidence: `High`.

## Adjacent Non-Component Dependency (Important)

### `src/hooks/use-auth-provider.ts`

- Does: resolves available auth provider(s) from NextAuth and exposes UI-ready provider metadata + readiness.
- Why: decouples sign-in UI components from raw NextAuth provider response handling.
- Influence: critical for `site-header` and `sign-in-cta` behavior, especially local/dev auth fallback.
- Confidence: `High`.

## Repository-Level Observations

- Core runtime path remains cohesive:
  - `layout` -> `app-shell` -> `providers` + `site-header`
  - lesson page -> `navigator-layout` + `lesson-navigator` + lesson content/progress controls
  - secondary pages use `back-to-course-cta`, `roadmap-gold-stars`, `role-library-list`, and home progress cards
- `/roadmap` is currently implemented as an intentional redirect route to the first lesson.
- Removed unused components on 2026-02-27:
  - `lesson-progress-card.tsx`
  - `roadmap-focus-provider.tsx`
  - `roadmap-focus-module-list.tsx`
  - `roadmap-focus-summary.tsx`
  - `roadmap-focus-status.tsx`
  - `roadmap-module-list.tsx`
