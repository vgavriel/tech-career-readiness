# Prompt Library (Copy-Paste)

This library is organized by phase. Use these prompts as-is or tailor them to your project.

> Tip: Put context at the top (repo goal, constraints), then ask for specific outputs.

---

## Phase 0 -- Product framing

**Prompt: Product goal + constraints**

```
I'm building a public web app for [audience].
Goal: [one paragraph].
Non-goals: [list].
Constraints:
- Auth: optional (public browsing)
- Data source: [docs / CMS / DB]
- Hosting: [Vercel / Render / etc]
Please confirm the minimal MVP scope and list trade-offs.
```

**Prompt: Architecture shape**

```
Given the goal and constraints, propose a minimal architecture and list the first 3 implementation phases.
```

---

## Phase 1 -- Plan + scaffolding

**Prompt: Implementation plan**

```
Create a comprehensive implementation plan with incremental phases and acceptance criteria.
Include a checklist. Keep it realistic for a solo builder.
```

**Prompt: AGENTS.md**

```
Draft an AGENTS.md with workflow expectations, test rules, and branch conventions.
```

---

## Phase 2 -- Data model + seed

**Prompt: Prisma schema**

```
Draft a Prisma schema for [entities].
Include slug aliasing and stable keys for seed idempotency.
```

**Prompt: Seed strategy**

```
Design a seed script plan with stable identifiers and slug alias entries.
Use upsert where possible.
```

---

## Phase 3 -- Auth + env

**Prompt: Auth setup**

```
Outline Auth.js/NextAuth setup for [provider].
Include required env vars and fail-fast checks.
```

---

## Phase 4 -- Content pipeline

**Prompt: Content API**

```
Provide an API route design for fetching and sanitizing HTML.
Include caching and a dev bypass.
```

---

## Phase 5 -- UX + navigation

**Prompt: Core pages**

```
List the core routes and UI components needed for the MVP.
Include a minimal global progress indicator.
```

**Prompt: Navigator behavior**

```
When a lesson is opened, scroll the navigator to the active item. Outline the approach.
```

---

## Phase 6 -- Progress tracking

**Prompt: Progress model**

```
Design a simple progress tracking model.
Include guest progress + merge on login.
```

---

## Phase 7 -- Testing + CI

**Prompt: CI guardrails**

```
Propose CI guardrails for lint/test/coverage. Avoid real network/OAuth.
```

**Prompt: Fix CI failure**

```
CI fails on [test/log]. Investigate and propose the smallest fix.
```

---

## Phase 8 -- Security + observability

**Prompt: Security review**

```
Review this codebase for security risks and privacy concerns. Prioritize actionable fixes.
```

**Prompt: Observability plan**

```
Define a lightweight observability plan (structured logs, redaction, minimal telemetry).
```

---

## Phase 9 -- Accessibility + polish

**Prompt: Accessibility**

```
Audit the UI for WCAG issues and propose fixes.
```

---

## Phase 10 -- Deployment

**Prompt: Release checklist**

```
Create a production release checklist for [hosting].
```

---

## Related

- `codex-playbook.md`
- `checkpoints.md`
- `case-study-timeline.md`
- `README.md`
