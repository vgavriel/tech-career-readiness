# Implementation Plan: Start to Finish (Self-Paced Tech Recruiting Roadmap)

## Product goal
Build a public self-paced online course web app that teaches an end-to-end roadmap to landing a tech internship or job. The app differentiates itself with a clear curriculum path, guided experience, quick navigation, and per-user progress tracking with “Continue where you left off.”

## MVP scope
### In scope
- Public browsing of course curriculum and lessons without authentication
- Google Sign-In for saving progress state
- Guest progress stored in localStorage with merge into account on sign-in
- Curriculum structure: Modules ➜ Lessons
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
2) User clicks “View the roadmap.”
3) User browses modules and lessons.
4) User opens a lesson and reads content.

### Progress tracking flow (authenticated)
1) User clicks “Sign in with Google.”
2) User returns to roadmap page.
3) If guest progress exists, prompt to merge and apply it to the user account.
3) User marks lessons complete or incomplete.
4) Progress persists across sessions.
5) User clicks “Continue” to jump to the next incomplete lesson.

### Progress tracking flow (guest)
1) User browses roadmap and toggles lessons.
2) Progress is stored in localStorage.
3) User sees UI guidance that sign-in saves progress across devices.

## App pages (MVP)
1) `/` (Landing)
- Title and short description
- CTA: “View the roadmap”
- CTA: “Sign in to save progress”
- Optional: small “How this course works” block

2) `/roadmap` (Curriculum overview)
- List modules in order
- Under each module, list lessons
- Show completion checkmarks for logged-in users
- Show overall progress percent for logged-in users
- Button: “Continue where you left off” (logged in)
- If logged out: show “Sign in to save progress,” show guest checkmarks, and note they are stored locally

3) `/lesson/[lessonSlugOrId]` (Lesson detail)
- Title
- Optional: lesson objectives and “What success looks like”
- Render lesson content from publishedUrl (sanitized HTML)
- Buttons:
  - Mark complete / Mark incomplete (requires login)
  - Next lesson / Previous lesson navigation
  - Open source doc in new tab (optional, uses publishedUrl)

4) `/account` (Optional, can be minimal)
- User profile basics
- Sign out

## Data model (Prisma)
### Models
- User
  - id (string or uuid)
  - email (unique)
  - name
  - image
  - createdAt
  - updatedAt

- Cohort (future readiness)
  - id
  - name
  - slug (unique)
  - isDefault (boolean)
  - createdAt
  - updatedAt

- Module
  - id
  - key (unique, stable internal identifier)
  - slug (unique, user-facing)
  - title
  - order (int)
  - description (string, optional)
  - cohortId (optional)
  - createdAt
  - updatedAt

- Lesson
  - id
  - moduleId (FK)
  - title
  - slug (unique, stable)
  - order (int)
  - publishedUrl (string)
  - estimatedMinutes (int, optional)
  - objectivesMarkdown (string, optional)
  - cohortId (optional)
  - createdAt
  - updatedAt

- LessonSlugAlias
  - id
  - lessonId (FK)
  - slug (unique)
  - createdAt

- ModuleSlugAlias
  - id
  - moduleId (FK)
  - slug (unique)
  - createdAt

- LessonProgress
  - id
  - userId (FK)
  - lessonId (FK)
  - completedAt (datetime nullable)
  - updatedAt
  - createdAt
  - unique constraint on (userId, lessonId)

### Notes
- Store curriculum structure in DB for ordering, navigation, and progress calculations.
- Use stable module keys; store legacy module slugs in ModuleSlugAlias to support redirects.
- Use stable lesson slugs; store legacy slugs in LessonSlugAlias to support redirects.
- Cohort readiness allows future per-cohort curricula without major refactor.

## Seed data
- Use a seed script to populate:
  - 7 modules
  - Lessons per module (at least 2 lessons per module for MVP)
  - Placeholder `publishedUrl` values (e.g., `https://example.com`)
- Seed should be idempotent (use upsert where possible).
- Seed should use stable module keys as identity and insert module slug aliases on slug changes.

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

### Phase 1 — Database modeling + curriculum seed
- [x] Implement Prisma schema with User, Cohort, Module (key + slug), ModuleSlugAlias, Lesson, LessonSlugAlias, LessonProgress
- [x] Run initial migration
- [x] Add seed script (modules + lessons + placeholder URLs)

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
- [x] Roadmap page (`/roadmap`) with ordered modules/lessons
- [x] Lesson page (`/lesson/[slug]`) with content rendering

### Phase 5 — Progress tracking
- [x] Add progress API routes (complete/incomplete)
- [x] Lesson completion toggle UI
- [x] Roadmap progress UI + percent complete
- [x] Global progress summary + Continue link
- [x] Store guest progress in localStorage and merge on sign-in

### Phase 5.5 — Security hardening + admin analytics
- [x] Add security headers + static CSP (allow inline styles for now)
- [x] Add Upstash rate limiting for API routes
- [x] Enforce request size limits and Zod validation for API inputs
- [x] Restrict lesson content fetch to Google Docs domains only (SSRF allowlist)
- [x] Add `User.isAdmin` flag + admin analytics page
- [x] Record `LessonProgressEvent` entries for every toggle
- [x] Document admin bootstrap via `ADMIN_EMAILS`

### Phase 5.6 — CSP nonces/hashes (deferred)
- [ ] Replace `unsafe-inline` styles/scripts with CSP nonces/hashes once lesson HTML is finalized

### Phase 6 — Slug alias redirects
- [ ] Implement alias lookup in lesson route
- [ ] Redirect old slugs to canonical slug

### Phase 7 — Quality pass + polish
- [ ] Error handling for missing lessons/content fetch failures
- [ ] Confirm public access to curriculum and lessons
- [ ] UI polish for readability and CTAs

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

## Environment variables
- DATABASE_URL
- NEXTAUTH_URL
- NEXTAUTH_SECRET
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET

## Prisma configuration
- Prisma 7 uses `prisma.config.ts` for datasource and seed configuration.

## Acceptance criteria
- Any visitor can browse `/roadmap` and open lessons.
- Guests can track lesson completion locally and optionally merge on sign-in.
- Lesson content loads from publishedUrl and renders in-app without iframe.
- A user can sign in with Google and save lesson completion state.
- Completion state persists across sessions.
- Roadmap shows progress percent for logged-in users.
- Continue button takes user to first incomplete lesson.

## Optional enhancements (post-MVP)
- Search lessons by keyword (title and optionally HTML text)
- “Where are you in the process?” picker on landing
- Lightweight feedback button per lesson
- Better caching (Redis) and background refresh
- Table of contents generation from doc headings
