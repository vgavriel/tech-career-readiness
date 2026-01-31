# Implementation Plan: Start to Finish (Self-Paced Tech Recruiting Roadmap)

## Product goal

Build a public self-paced online course web app that teaches an end-to-end roadmap to landing a tech internship or job. The app differentiates itself with a clear curriculum path, guided experience, quick navigation, and per-user progress tracking with “Continue where you left off.”

## Curriculum plan

Source of truth for modules, focuses, progress categories, and gamification:

- `docs/curriculum-plan.md`

## MVP scope

### In scope

- Public browsing of course curriculum and lessons without authentication
- Google Sign-In for saving progress state
- Guest progress stored in localStorage with merge into account on sign-in
- Curriculum structure: Modules ➜ Lessons
- Landing quick picker to route to urgency focuses (plus an always-available “Explore roles” entry)
- Core progress tracking plus a separate “extra credit” progress category
- Role Library shows all roles with optional deep dives
- Lesson reading view with in-app rendering of Google Doc content from published URLs (no iframes)
- Progress tracking per lesson per user (complete/incomplete)
- Resume experience: continue where you left off, overall progress percent
- Simple caching for lesson content fetching

### Out of scope

- Quizzes, grading, certificates
- Discussion boards
- Admin dashboards
- Complex analytics
- Multi-role permissions (beyond a simple admin flag if ever needed)
- Embedding Google Docs via iframe

## Recommended tech stack

- Next.js (App Router) + TypeScript
- Auth.js (NextAuth) with Google provider
- Postgres (Neon)
- Prisma ORM
- TailwindCSS
- Vercel hosting

## High-level architecture

### Content rendering strategy (no iframe)

- Store each lesson’s published Google Doc URL in the database.
- Server-side route fetches HTML from the published URL.
- Sanitize HTML to prevent unsafe markup.
- Cache sanitized HTML for a short TTL (30–120 minutes).
- Client renders sanitized HTML inside the lesson layout.

### Auth strategy

- App is public for reading.
- Google Sign-In is used only to attach progress to a user.
- When logged out, users can read everything but see “Sign in to save progress.”

## Core user flows (MVP)

### Public browsing flow

1. User lands on homepage.
2. User uses the quick picker or chooses a focus from the header.
3. User browses modules and lessons (core + extra credit) via the navigator.
4. User opens a lesson and reads content.

### Progress tracking flow (authenticated)

1. User clicks “Sign in with Google.”
2. User returns to any lesson (navigator stays visible).
3. If guest progress exists, prompt to merge and apply it to the user account.
4. User marks lessons complete or incomplete.
5. Progress persists across sessions.
6. User clicks “Continue” to jump to the next incomplete lesson.

### Progress tracking flow (guest)

1. User browses lessons via the navigator and toggles completion.
2. Progress is stored in localStorage.
3. User sees UI guidance that sign-in saves progress across devices.

## App pages (MVP)

1. `/` (Landing)

- Title and short description
- CTA: “Start the course”
- CTA: “Sign in to save progress”
- Quick picker for urgency focuses + “Explore roles” entry
- Optional: small “How this course works” block

2. `/lesson/[lessonSlugOrId]` (Lesson detail)

- Title
- Optional: lesson objectives and “What success looks like”
- Render lesson content from publishedUrl (sanitized HTML)
- Navigator (left rail) with modules + lesson completion toggles
- Open source doc in new tab (optional, uses publishedUrl)

3. `/gold-stars` (Gold Stars awards)

- Gold Stars summary with earned/in-progress status

4. `/roadmap` (Legacy redirect)

- Redirects to the first lesson (navigator handles browsing)

5. `/account` (Optional, can be minimal)

- User profile basics
- Sign out

## Data model (Prisma)

### Models

- User
  - id (string or uuid)
  - email (unique, lowercase/citext)
  - name
  - image
  - focusKey (nullable string, current focus selection)
  - isAdmin
  - createdAt

- Module
  - id
  - key (unique, stable identifier)
  - title
  - order (int)
  - description (string, optional)

- Lesson
  - id
  - moduleId (FK)
  - title
  - slug (unique, stable + user-facing)
  - order (int)
  - publishedUrl (string)
  - googleDocId (string, optional)
  - estimatedMinutes (int, optional)
  - objectivesMarkdown (string, optional)
  - isArchived (boolean, default false)
  - supersededByLessonId (optional FK to Lesson)

- LessonSlugAlias
  - id
  - lessonId (FK)
  - slug (unique)

- LessonProgress
  - id
  - userId (FK)
  - lessonId (FK)
  - completedAt (datetime nullable)
  - unique constraint on (userId, lessonId)
  - index on (userId, completedAt)

- LessonProgressEvent
  - id
  - userId (FK)
  - lessonId (FK)
  - action (completed/incomplete)
  - createdAt
  - indexes on (userId, createdAt) and (lessonId, createdAt)

### Notes

- Store curriculum structure in DB for ordering, navigation, and progress calculations.
- Use stable module keys for focus ordering and gold star progress.
- Use stable lesson slugs; store legacy slugs in LessonSlugAlias to support redirects.

## Seed data

- Use a seed script to populate:
  - 9 modules aligned to `docs/curriculum-plan.md`
  - Lessons per module for core + extra credit content
  - Placeholder `publishedUrl` values until real Google Doc URLs are ready
- Seed should be idempotent (use upsert where possible).
- Seed should use stable module keys as identity and insert lesson slug aliases on slug changes.

## Auth + progress

- Configure Google OAuth with Auth.js (NextAuth).
- When logged out: show “Sign in to save progress.”
- When logged in: show checkmarks, completion toggles, and “Continue” UI.
- When logging in with guest progress: prompt to merge local progress into the account.

## Caching + sanitization

- Cache sanitized HTML by lessonId with a TTL (30–120 minutes).
- Provide a dev-only cache bypass (query param).
- Use a sanitizer library compatible with Node to strip scripts/unsafe attributes.

## Incremental implementation steps (checklist)

### Phase 1 — Project foundation

- [x] Create Next.js App Router project with TypeScript
- [x] Add TailwindCSS
- [x] Add Prisma and configure Neon Postgres connection

### Phase 2 — Continuous integration

- [x] Add CI pipeline to run lint + unit tests on every PR
- [x] Add integration tests job once APIs exist (Phase 3+)
- [x] Add E2E tests job once core pages exist (Phase 4+)
- [x] Add accessibility checks with pa11y (WCAG AAA) in CI and local scripts

### Phase 3 — Curriculum planning (Brown-specific)

- [x] Create `docs/curriculum-plan.md` with modules, focuses, progress categories, and gamification
- [x] Link curriculum plan from this doc and update MVP scope for quick picker + extra credit progress

### Phase 4 — Database modeling + curriculum seed

- [x] Implement Prisma schema with User, Module (key), Lesson (slug), LessonSlugAlias, LessonProgress, LessonProgressEvent
- [x] Run initial migration
- [x] Add seed script (modules + lessons + placeholder URLs)
- [x] Update seed data to match `docs/curriculum-plan.md` modules and lessons

### Phase 5 — Auth (Google OAuth)

- [x] Configure Auth.js (NextAuth) with Google provider
- [x] Add auth routes for App Router
- [x] Add basic auth UI in global header

### Phase 6 — Content fetching + sanitization

- [x] Add `/api/lesson-content` route
- [x] Fetch publishedUrl server-side
- [x] Sanitize HTML
- [x] Add in-memory cache with TTL
- [x] Rewrite Google Doc edit links to internal lesson routes using stored doc IDs

### Phase 7 — Core pages (public browsing)

- [x] Landing page (`/`)
- [x] Lesson page (`/lesson/[slug]`) with content rendering + navigator rail
- [x] Roadmap redirect (`/roadmap`) to the first lesson

### Phase 8 — Progress tracking

- [x] Add progress API routes (complete/incomplete)
- [x] Lesson completion toggle UI
- [x] Navigator progress UI + core/extra credit summary
- [x] Store guest progress in localStorage and merge on sign-in

### Phase 9 — Security hardening + admin analytics

- [x] Add security headers + static CSP (allow inline styles for now)
- [x] Add Upstash rate limiting for API routes
- [x] Enforce request size limits and Zod validation for API inputs
- [x] Restrict lesson content fetch to Google Docs domains only (SSRF allowlist)
- [x] Tighten lesson sanitization (style allowlist + rel enforcement) and add fetch timeouts/in-flight caching
- [x] Add `User.isAdmin` flag + admin analytics page
- [x] Record `LessonProgressEvent` entries for every toggle
- [x] Document admin bootstrap via `ADMIN_EMAILS` (local/preview/test only; prod via DB flag)

### Phase 10 — CSP nonces/hashes (deferred)

- [x] Replace `unsafe-inline` styles/scripts with CSP nonces/hashes once lesson HTML is finalized

### Phase 11 — Schema reset + slug aliases

- [x] Implement alias lookup in lesson route
- [x] Redirect old slugs to canonical slug
- [x] Remove duplicate lesson key/id handling (slug-only progress)
- [x] Drop unused cohort/module slug tables and simplify seed data
- [x] Normalize user emails and add progress indexes
- [x] Regenerate baseline migration for the reset schema

### Phase 12 — Quality pass + polish

- [x] Error handling for missing lessons/content fetch failures
- [x] Confirm public access to curriculum and lessons
- [x] UI polish for readability and CTAs
- [x] UI redesign pass for calmer, Brown-specific layout and reduced text density
- [x] UI simplification pass to remove low-value text and redundant elements
- [x] Streamline focus selection and homepage CTA hierarchy for clarity
- [x] Strip standardized footer blocks from lesson content
- [x] Refine homepage progress card and timeline picker density
- [x] Remove lesson Focus/Deliverable and Outcomes/Checklist panels from lesson pages
- [x] Normalize lesson table spacing and borders
- [x] Hide horizontal rules inside lesson content
- [x] Fix in-lesson hash navigation to avoid scroll trap in nested containers
- [x] Tighten mobile lesson content padding and list indentation for readability
- [x] Tighten lesson content heading line-height and post-heading spacing
- [x] Reposition the mobile navigator toggle to avoid overlapping lesson content
- [x] Add next-core-lesson CTA for mobile lesson navigation
- [x] Add TSDoc for functions/types and component intent comments
- [x] Expand TSDoc coverage across app/API/seed utilities (Jan 2026 refresh)
- [x] Document local/preview workflows and gate auth/rate limiting by `APP_ENV`
- [x] Expand automated test coverage for auth/progress flows, admin gating, and caching guardrails
- [x] Add dedicated `typecheck` script and wire into CI
- [x] Enforce formatting with Prettier + lint-staged + Husky
- [x] Harden lint rules for import order, unused module exports, and client/server boundaries
- [x] Modularize lesson content utilities for fetch/sanitize/images/cache concerns
- [x] Document engineering standards + architectural rules in `docs/engineering-standards.md`

### Phase 13 — Curriculum UX + focuses

- [x] Add landing quick picker that routes to curated focuses (and store selection)
- [x] Support focus filtering/ordering on the roadmap (core lessons in focus order)
- [x] Show focus progress alongside overall core progress
- [x] Define “Continue” behavior when a focus is selected (focus order vs global order)
- [x] Show core vs extra credit progress breakdown
- [x] Add lesson classification mapping for core/extra credit + role deep dives (gold star source of truth)
- [x] Add Role Library view showing all role deep dives
- [x] Add lightweight gold star awards (no streaks) based on lesson completion
- [x] Persist focus selection in the database and surface it in the header picker
- [x] Replace the standalone roadmap page with a persistent navigator (collapsible + resizable)
- [x] Auto-scroll the navigator to the active lesson on open
- [x] Add a Gold Stars page linked from the global header
- [x] Replace Start Here lesson 1 with in-app overview content (no external links)
- [x] Add estimated reading time metadata for every lesson

### Phase 14 — Accessibility (WCAG AAA)

- [x] Update color tokens for AAA contrast (text + non-text UI)
- [x] Add skip link, focus-visible styles, and reduced-motion handling
- [x] Increase interactive target sizes and add keyboard resizing for the navigator
- [x] Reinforce link affordances and progress visuals for non-text contrast
- [x] Preserve lesson list indentation when sanitizing Google Docs HTML

### Phase 15 — Observability (lightweight)

- [x] Add request ID generation (proxy) and return `x-request-id` headers for server routes
- [x] Create a minimal structured logger wrapper with env-based log levels and default redaction for secrets/PII
- [x] Instrument key server paths (lesson-content fetch, progress updates, auth callbacks) with duration + cache hit/miss fields
- [x] Add global error boundaries and client error capture endpoint
- [x] Add client-side pageview telemetry via a minimal provider (e.g., Vercel Analytics) with a config flag to disable
- [x] Document log fields and sampling/retention guidance in `docs/observability.md`
- [x] Draft full production observability plan (`docs/observability-plan.md`)

### Phase 16 — Lesson content scaling

- [x] Add a shared Redis-backed cache for sanitized lesson HTML across instances
- [x] Keep in-memory caching as a local fallback for lesson content fetches
- [x] Reuse the shared cache for API responses and server-rendered lessons
- [x] Add CDN cache headers for lesson content API responses (s-maxage + SWR)

### Phase 17 — Deployment

- [ ] Deploy to Vercel
- [ ] Configure env vars
- [ ] Smoke-test public browsing, auth, progress, and continue flow
- [x] Pre-production cleanup: simplify seed logic
- [ ] Pre-production cleanup: run fresh migration/seed against a reset preview DB

### Phase 18 — Long-term content scalability (post-MVP)

- [ ] Persist sanitized lesson HTML in storage with versioning
- [ ] Add background refresh jobs (cron/QStash) to keep snapshots warm
- [ ] Provide cache invalidation + fallback to last-known-good content

### Phase 19 — Repository governance (public release)

- [x] Add CODEOWNERS to require maintainer review for main-branch changes

### Phase 20 — Open-source security practices

- [x] Add `SECURITY.md` with private vulnerability reporting guidance
- [x] Add CodeQL code scanning workflow for TypeScript
- [x] Add dependency review workflow with license guardrails
- [x] Add Dependabot config for npm and GitHub Actions
- [x] Document repo security expectations (MFA, least privilege, secret scanning)

### Phase 21 — Codex learning artifacts (student playbook)

- [x] Create student-facing Codex playbook in `docs/codex-playbook`
- [x] Add prompt library, checkpoints, case study timeline, and templates
- [x] Link all playbook artifacts from `docs/codex-playbook/README.md`

## Environment variables

- APP_ENV (local, preview, production, test)
- DATABASE_URL
- NEXTAUTH_URL
- NEXTAUTH_SECRET
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET

## Prisma configuration

- Prisma 7 uses `prisma.config.ts` for datasource and seed configuration.

## Acceptance criteria

- Any visitor can browse lessons via the navigator (and `/roadmap` redirects to the first lesson).
- Guests can track lesson completion locally and optionally merge on sign-in.
- Lesson content loads from publishedUrl and renders in-app without iframe.
- A user can sign in with Google and save lesson completion state.
- Completion state persists across sessions.
- Navigator shows completion status for core + extra credit lessons.
- Focus selection persists to the user account and is visible in the header.

## Optional enhancements (post-MVP)

- Search lessons by keyword (title and optionally HTML text)
- Lightweight feedback button per lesson
- Table of contents generation from doc headings
- Support for multiple different courses
