# Prompt Library (Copy-Paste)

This library is organized by phase and includes operational prompts that showed up in real sessions.
Every prompt is expanded to include the context and output shape Codex needs to be effective.

> Tip: Put context at the top (repo goal, constraints), then ask for specific outputs.

---

## How to use these prompts

- Fill placeholders in [brackets].
- Keep inputs short but precise (paths, errors, screenshots, URLs).
- Paste logs verbatim when possible.
- If you want tests run, say which ones.

---

## Phase 0 -- Product framing

**Prompt: Product goal + constraints (expanded)**

```
Context:
- Repo goal: [one paragraph]
- Primary user: [who it serves]
- Non-goals: [list]
- Constraints: [auth, data source, hosting, budget, timeline]
- Success metrics: [what "done" means]

Task:
1) Confirm the smallest viable MVP scope.
2) List explicit trade-offs and what to cut first.
3) Call out the riskiest unknowns and ask clarifying questions.

Output format:
- MVP scope (bullets)
- Trade-offs
- Open questions
```

**Prompt: Architecture shape + risks**

```
Given the goal and constraints, propose a minimal architecture.
Include:
- Frontend / backend / DB / auth / hosting
- One key risk per layer
- First 3 phases with acceptance criteria
```

**Prompt: System design scaffolding (fill the template)**

```
Fill in the "System design scaffolding" section for this project.
Include content rendering, auth/progress, data model, caching, API surface,
security/abuse prevention, and observability/error handling.
Keep it actionable and aligned to the MVP.
```

**Prompt: Decision log starter**

```
Create a short decision log format we can append to.
Include date, decision, rationale, and impact.
```

---

## Phase 1 -- Plan + scaffolding

**Prompt: Implementation plan (expanded)**

```
Create a comprehensive implementation plan with incremental phases and acceptance criteria.
Requirements:
- Match the repo tech stack: [list]
- Include checklists per phase
- Include security + observability + accessibility phases
- Keep it realistic for a solo builder

Output format:
- Phases with acceptance criteria
- Checklist (unchecked)
```

**Prompt: AGENTS.md (expanded)**

```
Draft AGENTS.md with:
- Branching rules (feature/<scope>)
- Test expectations (what to run, when to skip)
- Docs to follow (implementation plan, testing strategy)
- Tooling rules (Playwright, Context7)
- Output format expectations
```

**Prompt: Repo docs map**

```
List the minimum set of docs this repo should have.
For each, give 1-2 bullets for what must be included.
```

---

## Phase 2 -- Data model + seed

**Prompt: Prisma schema (expanded)**

```
Draft a Prisma schema for [entities].
Must include:
- Slug aliasing for backward-compatible URLs
- Stable keys for idempotent seed data
- Indexes for progress queries
- Soft-delete or archive flags where needed
Return the schema plus a short rationale for each model.
```

**Prompt: Seed strategy (expanded)**

```
Design a seed plan for curriculum data.
Include:
- Stable identifiers (module keys, lesson slugs)
- Idempotent upserts
- Handling slug changes with aliases
- How to rerun safely in dev/preview
```

**Prompt: Baseline migration reset**

```
Propose a safe "reset schema" plan for a young project.
Include migration steps, data safety warnings, and how to validate the reset.
```

---

## Phase 3 -- Auth + environments

**Prompt: Auth setup (expanded)**

```
Outline Auth.js/NextAuth setup for [provider].
Include:
- Required env vars
- Local dev behavior
- Failure modes (missing env)
- Any auth UI states we need
```

**Prompt: Environment guardrails**

```
Define environment guardrails:
- Which features are disabled in local/preview
- How to gate rate limiting, analytics, and admin access
- Where to document env vars
```

**Prompt: CSP in dev (from real issue)**

```
We see CSP errors in dev (unsafe-eval blocked) and buttons don't work.
Diagnose the root cause and propose a dev-only CSP relaxation.
Include the exact code changes and explain why production remains strict.
```

**Prompt: Admin bootstrap**

```
Define an admin bootstrap strategy:
- Local/preview via env allowlist
- Production via DB flag
- How to document it
```

---

## Phase 4 -- Content pipeline

**Prompt: Content API (expanded)**

```
Provide an API route design for fetching and sanitizing HTML.
Must include:
- SSRF allowlist or URL validation rules
- Sanitizer strategy (allowed tags/attrs)
- Caching with TTL + dev bypass
- Error handling + fallbacks
```

**Prompt: Link rewriting**

```
Given Google Doc HTML, define how to rewrite links:
- Internal doc links -> app routes
- External links -> new tab + rel enforcement
```

**Prompt: Cache layering**

```
Design a caching strategy:
- In-memory fallback
- Shared cache (Redis) with TTL
- CDN headers (s-maxage + SWR)
Include cache key format and invalidation approach.
```

**Prompt: Snapshot storage (optional)**

```
Propose a plan to persist sanitized HTML snapshots with versioning.
Include storage, versioning key, and rollback strategy.
```

---

## Phase 5 -- UX + navigation

**Prompt: Core pages (expanded)**

```
List the core routes and UI components needed for the MVP.
Include:
- Landing
- Lesson view
- Progress summary
- Role library (if applicable)
Include acceptance criteria for each page.
```

**Prompt: Navigator behavior (expanded)**

```
When a lesson is opened, the navigator should scroll to the active item.
Outline the approach, include focus management and keyboard behavior.
```

**Prompt: Focus selection + Continue behavior**

```
Define how focus selection affects ordering and the Continue CTA.
Include:
- How to store the focus selection
- How to resolve "Continue" when focus is active
- Fallback behavior when there is no progress
```

**Prompt: Next lesson CTA**

```
Design a "next core lesson" CTA.
Include responsive behavior and how completion is tracked on click.
```

**Prompt: UI redesign with a style guide**

```
We have a brand/style guide PDF. Redesign the UI to match it.
Requirements:
- Use Playwright MCP to validate the live UI
- Prioritize typography, spacing, and hierarchy
- Provide a before/after checklist
```

**Prompt: Content typography pass**

```
Audit lesson content typography (headings, paragraphs, lists, tables).
Identify spacing and readability problems, then propose concrete CSS fixes.
```

---

## Phase 6 -- Progress tracking

**Prompt: Progress model (expanded)**

```
Design a progress model with:
- Guest progress in localStorage
- Merge-on-login flow
- Per-lesson completion + timestamps
Include data model fields and API endpoints.
```

**Prompt: Progress API hardening**

```
Harden the progress endpoints:
- Validate inputs (type + size)
- Return 400 for malformed payloads
- Avoid DB writes for no-op updates
```

---

## Phase 7 -- Testing + CI

**Prompt: CI guardrails (expanded)**

```
Propose CI guardrails for lint/test/coverage.
Include:
- Unit + integration + E2E jobs
- A11y checks (pa11y)
- "No real network/OAuth" guidance
```

**Prompt: Fix CI failure (expanded)**

```
CI fails with [error/log]. Provide:
1) Root cause
2) Minimal fix
3) Tests to validate
Keep the change set as small as possible.
```

**Prompt: Lint config debugging (from real issue)**

```
ESLint fails to resolve Next shareable configs in flat config.
Find the minimal fix (likely FlatCompat) and update the config.
```

**Prompt: Test DB harness (from real issue)**

```
Review test DB harness scripts:
- Avoid exporting unrelated env vars
- Handle port conflicts with clear errors
- Ensure cleanup after tests
Assume Docker Compose supports --wait.
```

---

## Phase 8 -- Security + observability

**Prompt: Security review (expanded)**

```
Review this codebase for security and privacy risks.
Prioritize:
- SSRF protection
- CSP and security headers
- Request size limits
- PII handling / redaction
Give concrete fixes with file paths.
```

**Prompt: Observability plan (expanded)**

```
Define a lightweight observability plan:
- Structured logging with request IDs
- Client error capture
- Minimal telemetry gating by env flag
Include log fields and redaction rules.
```

**Prompt: Rate limiting + validation**

```
Add rate limiting and input validation for API routes.
Include bucket keys, limits, and error responses.
```

---

## Phase 9 -- Accessibility + polish

**Prompt: Accessibility audit (expanded)**

```
Audit the UI for WCAG issues and propose fixes.
Include:
- Focus-visible states
- Target size
- Contrast for text and non-text elements
```

**Prompt: Performance + readability pass**

```
Identify the top 5 performance or readability issues in the UI.
Provide concrete fixes and any trade-offs.
```

---

## Phase 10 -- Deployment

**Prompt: Release checklist (expanded)**

```
Create a production release checklist for [hosting].
Include env vars, smoke tests, analytics flags, and rollback steps.
```

**Prompt: Pre-prod DB reset + seed**

```
Define a safe pre-prod reset/seed procedure.
Include warnings, confirmation steps, and validation checks.
```

---

## Operational prompts (from real sessions)

**Prompt: Switch branches**

```
We need to work on branch [name]. If it doesn't exist, create it.
Do not continue on main.
```

**Prompt: Use Playwright to verify UI changes**

```
Make the change, then verify using Playwright MCP:
- Desktop and mobile widths
- Primary flow
- Core interaction (buttons/links)
Report any UI issues you find and iterate.
```

**Prompt: Handle direction changes**

```
User says "nevermind" or changes direction.
Summarize what changed, then continue with the new request only.
```

**Prompt: Debug "button does nothing" in dev**

```
The UI loads but buttons don't respond. Console shows CSP errors.
Find the root cause and apply a dev-only CSP fix.
```

---

## Related

- `codex-playbook.md`
- `checkpoints.md`
- `case-study-timeline.md`
- `README.md`
