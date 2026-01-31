# Checkpoints (Decision Gates)

Use this checklist to decide when a phase is "done." If you can't verify a checkpoint, pause and fix before moving on.

---

## Phase 0 -- Product framing

- [ ] Problem statement + target user documented
- [ ] MVP scope and non-goals documented
- [ ] Constraints captured (auth, hosting, data source)

## Phase 1 -- Plan + scaffolding

- [ ] `docs/implementation-plan.md` exists with phases + acceptance criteria
- [ ] `AGENTS.md` exists and reflects your workflow
- [ ] Repo builds locally (or setup steps documented)

## Phase 2 -- Data model + seed

- [ ] Prisma schema matches the plan
- [ ] Uniqueness constraints for ordering in place
- [ ] Seed plan is idempotent (upsert + stable keys)

## Phase 3 -- Auth + env

- [ ] Required env vars documented
- [ ] Auth setup fails fast if config missing
- [ ] Public browsing still works

## Phase 4 -- Content pipeline

- [ ] Content API returns sanitized HTML
- [ ] Cache is in place with dev bypass
- [ ] Content errors are surfaced clearly

## Phase 5 -- UX + navigation

- [ ] Core routes render (list + detail)
- [ ] Global progress indicator appears
- [ ] Navigator scrolls to active item (if applicable)

## Phase 6 -- Progress tracking

- [ ] Progress model implemented
- [ ] Guest progress captured (or explicitly deferred)
- [ ] Merge behavior defined on login

## Phase 7 -- Testing + CI

- [ ] Unit tests exist for core logic
- [ ] CI runs lint + tests
- [ ] Network/OAuth calls are mocked

## Phase 8 -- Security + observability

- [ ] Security checklist reviewed
- [ ] Logs are redacted of secrets/PII
- [ ] Observability scope defined

## Phase 9 -- Accessibility + polish

- [ ] Color contrast meets AA (or documented)
- [ ] Keyboard navigation works
- [ ] Content layout readable on mobile

## Phase 10 -- Deployment

- [ ] Production env vars verified
- [ ] Release checklist completed
- [ ] Governance docs reviewed

---

## Evidence & transparency

- [ ] Save key prompts + outcomes in a timeline doc
- [ ] Link timeline from `case-study-timeline.md`

---

## Related

- `codex-playbook.md`
- `prompt-library.md`
- `case-study-timeline.md`
- `README.md`
