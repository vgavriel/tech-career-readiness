# Checkpoints (Decision Gates)

Use this checklist to decide when a phase is "done." If you can't verify a checkpoint, pause and fix before moving on.

---

## Phase 0 -- Product framing

- [ ] Problem statement + target user documented
- [ ] MVP scope and non-goals documented
- [ ] Constraints captured (auth, hosting, data source)
- [ ] Curriculum/source-of-truth doc created and linked

## Phase 1 -- Plan + scaffolding

- [ ] `docs/implementation-plan.md` exists with phases + acceptance criteria
- [ ] `AGENTS.md` exists and reflects your workflow
- [ ] Engineering/test expectations documented (`docs/testing-strategy.md`, etc.)
- [ ] Repo builds locally (or setup steps documented)

## Phase 2 -- CI + quality gates

- [ ] CI runs lint + unit tests on every PR
- [ ] Integration/E2E jobs added when APIs/pages exist
- [ ] A11y checks wired (pa11y or equivalent)
- [ ] Playwright artifacts uploaded on failure (if E2E exists)

## Phase 3 -- Curriculum planning

- [ ] `docs/curriculum-plan.md` defines modules, focuses, progress categories
- [ ] Curriculum plan linked from implementation plan
- [ ] Gamification plan captured (core vs extra credit, badges)

## Phase 4 -- Data model + seed

- [ ] Prisma schema matches the plan (User/Module/Lesson/Progress/Alias)
- [ ] Uniqueness constraints + indexes in place
- [ ] Seed plan is idempotent (upsert + stable keys)
- [ ] Seed data matches curriculum plan + slug alias entries

## Phase 5 -- Auth + environments

- [ ] Auth provider configured + required env vars documented
- [ ] Auth fails fast if config missing
- [ ] Public browsing works without auth
- [ ] Admin bootstrap strategy documented (local/preview vs prod)

## Phase 6 -- Content pipeline

- [ ] Lesson content fetched + sanitized server-side
- [ ] SSRF allowlist / URL validation in place
- [ ] Cache with TTL + dev bypass
- [ ] Doc link rewriting + safe rel/target handling
- [ ] Content errors surfaced with fallback messaging

## Phase 7 -- Core UX + navigation

- [ ] Core routes render (landing, lesson, roles, gold stars)
- [ ] Navigator is persistent + collapsible/resizable
- [ ] Navigator auto-scrolls to active lesson
- [ ] Focus selection + quick picker implemented

## Phase 8 -- Progress + gamification

- [ ] Progress API implemented with validation
- [ ] Guest progress stored locally + merge-on-login flow
- [ ] Core vs extra credit progress shown
- [ ] "Continue" and "Next core lesson" CTAs defined + tracked
- [ ] Badge/award surface (Gold Stars) implemented

## Phase 9 -- Security + reliability

- [ ] Security headers + CSP in place (dev/prod differences documented)
- [ ] Rate limiting on API routes
- [ ] Request size limits + Zod validation
- [ ] Lesson content fetch restricted to allowed domains
- [ ] Error boundaries + fallback states implemented

## Phase 10 -- Observability

- [ ] Request IDs generated and returned on server routes
- [ ] Structured logging with redaction + log levels
- [ ] Key paths instrumented with duration/cache hit fields
- [ ] Client error capture / telemetry gated by env flag

## Phase 11 -- Accessibility + UI polish

- [ ] Color contrast meets AAA (or documented)
- [ ] Skip link + focus-visible styles in place
- [ ] Touch targets meet minimum size
- [ ] Lesson content typography + spacing refined
- [ ] Mobile layout readable and resilient

## Phase 12 -- Deployment readiness

- [ ] Production env vars verified
- [ ] Pre-prod cleanup: fresh migration/seed run
- [ ] Smoke-test public browsing, auth, progress, and continue flow
- [ ] Release checklist completed

---

## Evidence & transparency

- [ ] Save key prompts + outcomes in a timeline doc
- [ ] Link timeline from `case-study-timeline.md`
- [ ] Keep prompt library updated with real prompts

---

## Related

- `codex-playbook.md`
- `prompt-library.md`
- `case-study-timeline.md`
- `README.md`
