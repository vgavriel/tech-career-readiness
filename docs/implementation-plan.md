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
1) User lands on homepage.
2) User uses the quick picker or chooses a focus from the header.
3) User browses modules and lessons (core + extra credit) via the navigator.
4) User opens a lesson and reads content.

### Progress tracking flow (authenticated)
1) User clicks “Sign in with Google.”
2) User returns to any lesson (navigator stays visible).
3) If guest progress exists, prompt to merge and apply it to the user account.
3) User marks lessons complete or incomplete.
4) Progress persists across sessions.
5) User clicks “Continue” to jump to the next incomplete lesson.

### Progress tracking flow (guest)
1) User browses lessons via the navigator and toggles completion.
2) Progress is stored in localStorage.
3) User sees UI guidance that sign-in saves progress across devices.

## App pages (MVP)
1) `/` (Landing)
- Title and short description
- CTA: “Start the course”
- CTA: “Sign in to save progress”
- Quick picker for urgency focuses + “Explore roles” entry
- Optional: small “How this course works” block

2) `/lesson/[lessonSlugOrId]` (Lesson detail)
- Title
- Optional: lesson objectives and “What success looks like”
- Render lesson content from publishedUrl (sanitized HTML)
- Navigator (left rail) with modules + lesson completion toggles
- Open source doc in new tab (optional, uses publishedUrl)

3) `/badges` (Badge awards)
- Badge summary with earned/in-progress status

4) `/roadmap` (Legacy redirect)
- Redirects to the first lesson (navigator handles browsing)

5) `/account` (Optional, can be minimal)
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
- Use stable module keys for focus ordering and badge progress.
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

### Phase 0 — Project foundation
- [x] Create Next.js App Router project with TypeScript
- [x] Add TailwindCSS
- [x] Add Prisma and configure Neon Postgres connection

### Phase 0.5 — Continuous integration
- [x] Add CI pipeline to run lint + unit tests on every PR
- [x] Add integration tests job once APIs exist (Phase 3+)
- [x] Add E2E tests job once core pages exist (Phase 4+)

### Phase 0.9 — Curriculum planning (Brown-specific)
- [x] Create `docs/curriculum-plan.md` with modules, focuses, progress categories, and gamification
- [x] Link curriculum plan from this doc and update MVP scope for quick picker + extra credit progress

### Phase 1 — Database modeling + curriculum seed
- [x] Implement Prisma schema with User, Module (key), Lesson (slug), LessonSlugAlias, LessonProgress, LessonProgressEvent
- [x] Run initial migration
- [x] Add seed script (modules + lessons + placeholder URLs)
- [x] Update seed data to match `docs/curriculum-plan.md` modules and lessons

### Phase 2 — Auth (Google OAuth)
- [x] Configure Auth.js (NextAuth) with Google provider
- [x] Add auth routes for App Router
- [x] Add basic auth UI in global header

### Phase 3 — Content fetching + sanitization
- [x] Add `/api/lesson-content` route
- [x] Fetch publishedUrl server-side
- [x] Sanitize HTML
- [x] Add in-memory cache with TTL

### Phase 4 — Core pages (public browsing)
- [x] Landing page (`/`)
- [x] Lesson page (`/lesson/[slug]`) with content rendering + navigator rail
- [x] Roadmap redirect (`/roadmap`) to the first lesson

### Phase 5 — Progress tracking
- [x] Add progress API routes (complete/incomplete)
- [x] Lesson completion toggle UI
- [x] Navigator progress UI + core/extra credit summary
- [x] Store guest progress in localStorage and merge on sign-in

### Phase 5.5 — Security hardening + admin analytics
- [x] Add security headers + static CSP (allow inline styles for now)
- [x] Add Upstash rate limiting for API routes
- [x] Enforce request size limits and Zod validation for API inputs
- [x] Restrict lesson content fetch to Google Docs domains only (SSRF allowlist)
- [x] Tighten lesson sanitization (style allowlist + rel enforcement) and add fetch timeouts/in-flight caching
- [x] Add `User.isAdmin` flag + admin analytics page
- [x] Record `LessonProgressEvent` entries for every toggle
- [x] Document admin bootstrap via `ADMIN_EMAILS` (preview/test only; prod via DB flag)

### Phase 5.6 — CSP nonces/hashes (deferred)
- [ ] Replace `unsafe-inline` styles/scripts with CSP nonces/hashes once lesson HTML is finalized

### Phase 6 — Schema reset + slug aliases
- [x] Implement alias lookup in lesson route
- [x] Redirect old slugs to canonical slug
- [x] Remove duplicate lesson key/id handling (slug-only progress)
- [x] Drop unused cohort/module slug tables and simplify seed data
- [x] Normalize user emails and add progress indexes
- [x] Regenerate baseline migration for the reset schema

### Phase 7 — Quality pass + polish
- [x] Error handling for missing lessons/content fetch failures
- [x] Confirm public access to curriculum and lessons
- [x] UI polish for readability and CTAs
- [x] Add TSDoc for functions/types and component intent comments
- [x] Document local/preview workflows and gate auth/rate limiting by `APP_ENV`

### Phase 7.2 — Curriculum UX + focuses
- [x] Add landing quick picker that routes to curated focuses (and store selection)
- [x] Support focus filtering/ordering on the roadmap (core lessons in focus order)
- [x] Show focus progress alongside overall core progress
- [x] Define “Continue” behavior when a focus is selected (focus order vs global order)
- [x] Show core vs extra credit progress breakdown
- [x] Add lesson classification mapping for core/extra credit + role deep dives (badge source of truth)
- [x] Add Role Library view showing all role deep dives
- [x] Add lightweight badge awards (no streaks) based on lesson completion
- [x] Persist focus selection in the database and surface it in the header picker
- [x] Replace the standalone roadmap page with a persistent navigator (collapsible + resizable)
- [x] Add a badges page linked from the global header

### Phase 7.5 — Observability (lightweight)
- [ ] Add request ID generation (middleware) and return `x-request-id` headers for server routes
- [ ] Create a minimal structured logger wrapper with env-based log levels and default redaction for secrets/PII
- [ ] Instrument key server paths (lesson-content fetch, progress updates, auth callbacks) with duration + cache hit/miss fields
- [ ] Add client-side pageview telemetry via a minimal provider (e.g., Vercel Analytics) with a config flag to disable
- [ ] Document log fields and sampling/retention guidance in `docs/observability.md`

### Phase 8 — Deployment
- [ ] Deploy to Vercel
- [ ] Configure env vars
- [ ] Smoke-test public browsing, auth, progress, and continue flow
- [ ] Pre-production cleanup: simplify seed logic, run fresh migration/seed against a reset preview DB

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
- Better caching (Redis) and background refresh
- Table of contents generation from doc headings
- Support for multiple different courses