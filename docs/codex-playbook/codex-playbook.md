# Codex Playbook: Build a Web App End-to-End

This playbook is designed to be **copied and reused** by students. It shows _how to drive a full app build_ with Codex using explicit phases, reproducible prompts, and outcome checkpoints.

> If you only read one file: start here, then jump to the prompt library.

## Principles

- **Clarity over speed:** Each phase must have outputs you can verify.
- **Single source of truth:** Keep plan + schema + curriculum in `docs/`.
- **Small, safe steps:** Ask Codex for scoped changes; review outputs.
- **Evidence:** Tie every phase to a prompt + outcome.

---

## Phase 0 -- Product framing + constraints

**Goal**: Define the problem, target user, and system boundaries.

**Prompts**: see `prompt-library.md` -> Phase 0.

**Outputs**

- Product goal (1 paragraph)
- Non-goals (what you won't build yet)
- Constraints (auth, data source, hosting)

**Guardrails**

- Avoid over-engineering
- Document trade-offs in the plan

---

## Phase 1 -- Planning + scaffolding

**Goal**: Create a structured implementation plan.

**Prompts**: "Create a comprehensive implementation plan..."

**Outputs**

- `docs/implementation-plan.md` (checklist-driven)
- `AGENTS.md` (Codex operating rules)

**Guardrails**

- Plan must be incremental and testable
- Each phase has acceptance criteria

---

## Phase 2 -- Data model + seed strategy

**Goal**: Define schema, slug strategy, and seed workflow.

**Outputs**

- Prisma schema
- Seed script plan with stable keys + aliasing
- Migration strategy

**Guardrails**

- Unique constraints on ordering
- Slug aliasing for URL stability

---

## Phase 3 -- Auth + environments

**Goal**: Ensure optional login works and env vars are enforced.

**Outputs**

- Auth.js/NextAuth configuration
- Environment variable checklist

**Guardrails**

- Fail fast if required env vars are missing
- Keep auth optional for public browsing

---

## Phase 4 -- Content pipeline (fetch -> sanitize -> cache)

**Goal**: Safely render remote content.

**Outputs**

- API route for content
- Sanitization strategy
- Cache + bypass for dev

**Guardrails**

- Strip scripts and unsafe HTML
- Avoid caching raw HTML with sensitive data

---

## Phase 5 -- Core UX + navigation

**Goal**: Implement primary pages and navigation.

**Outputs**

- Lesson listing and detail routes
- Progress indicators on every page
- Navigator behavior (scroll to current lesson)

**Guardrails**

- Keep UI readable and accessible
- Track decisions tied to UX changes

---

## Phase 6 -- Progress tracking + persistence

**Goal**: Store and surface progress without breaking public access.

**Outputs**

- Progress model + event logging
- UI for completion toggles
- Merge logic for guest -> auth

**Guardrails**

- Avoid blocking users who are not signed in

---

## Phase 7 -- Testing + CI

**Goal**: Make quality reproducible.

**Outputs**

- Unit + integration tests
- CI guardrails (lint, tests, accessibility)

**Guardrails**

- Use test fixtures; avoid live OAuth
- Document why tests aren't run

---

## Phase 8 -- Security + observability

**Goal**: Prevent regressions and build confidence.

**Outputs**

- Security hardening checklist
- Lightweight telemetry/logging plan

**Guardrails**

- Avoid logging PII or OAuth secrets

---

## Phase 9 -- Accessibility + polish

**Goal**: Make the app usable by everyone.

**Outputs**

- WCAG checks
- Usability improvements

**Guardrails**

- Validate keyboard navigation and contrast

---

## Phase 10 -- Deployment + release

**Goal**: Prepare for public release.

**Outputs**

- Environment setup
- Release checklist
- Governance docs

**Guardrails**

- Ensure secrets are locked down

---

## How to use this playbook

- Follow the phases in order.
- Use the checkpoint gates to verify progress.
- Record prompts + outcomes as you go to create your own timeline.

---

## Related

- `prompt-library.md`
- `checkpoints.md`
- `case-study-timeline.md`
- `implementation-plan.template.md`
- `agents.template.md`
- `README.md`
