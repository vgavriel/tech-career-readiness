# Case Study Timeline (Condensed)

This is a student-friendly narrative of how the app was built end-to-end with Codex. It summarizes the _decisions_ and _outcomes_ rather than every single message.

> Full evidence lives in `/Users/viktorgavrielov/Downloads/CodexDecisionTimeline.md` on this machine. Copy it into this folder if you want it in-repo.

---

## 0) Pre-Codex cloud planning (before 2026-01-07)

**Key decisions**

- Define the product goal, MVP scope, and constraints (public browsing + optional Google auth, content from Google Docs).
- Ask for a full implementation plan and a schema/seed strategy.

**Outcome**

- A comprehensive implementation plan was drafted, forming the backbone for the repo's execution steps.

---

## 1) Initial reviews + guardrails (2026-01-07 -> 2026-01-08)

**Key decisions**

- Run code review guidelines and fix early schema risks (unique ordering for modules/lessons).
- Address CI/lint failures quickly to keep feedback loops tight.

**Outcome**

- Schema stability and CI confidence improved early in the build.

---

## 2) Core platform foundation

**Key decisions**

- Establish the data model, seed strategy, and slug aliasing for URL stability.
- Lock down env-var guards for auth.

**Outcome**

- A stable base for content + progress tracking with safe routing.

---

## 3) Content pipeline + UX iteration

**Key decisions**

- Fetch, sanitize, and cache lesson content.
- Implement core pages and navigator behavior.

**Outcome**

- Public browsing experience becomes functional and usable.

---

## 4) Quality pass + scaling

**Key decisions**

- Fix test infra issues and CI mismatches.
- Evaluate accessibility + polish.

**Outcome**

- Stability and usability improved for broader release readiness.

---

## 5) Reproducibility takeaway for students

**Key decisions to copy**

- Start with a plan and a checklist.
- Use explicit prompts for schema, auth, and caching.
- Use CI failures as "design feedback" rather than blockers.
- Keep a timeline of prompts + outcomes to build learning value.

---

## Related

- `codex-playbook.md`
- `prompt-library.md`
- `checkpoints.md`
- `README.md`
