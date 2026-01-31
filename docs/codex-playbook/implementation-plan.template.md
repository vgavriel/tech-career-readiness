# Implementation Plan (Template)

> Copy this file to `docs/implementation-plan.md` in your project and fill it in.

## Overview

- **Product**: [what you're building]
- **Primary user**: [who it serves]
- **Curriculum/source of truth**: [link to plan/spec]
- **MVP scope**: [bullet list]
- **Non-goals**: [bullet list]

## Architecture snapshot

- **Frontend**: [framework]
- **Backend**: [framework/API]
- **Database**: [db + ORM]
- **Auth**: [optional/required + provider]
- **Content source**: [CMS, docs, markdown, API, etc.]
- **Caching**: [in-memory/redis/cdn + TTL]
- **Observability**: [logging/metrics/tracing]
- **Hosting**: [deployment target]

## System design scaffolding

### Content rendering strategy

- [where content lives + how it is fetched]
- [sanitization + safe rendering rules]
- [how links/media are rewritten or handled]

### Auth + progress strategy

- [public vs. authenticated access rules]
- [guest/anonymous progress storage + merge flow]
- [permissions or admin gating]

### Data model + seed strategy

- [core entities + relationships]
- [unique constraints + indexes]
- [seed idempotency and stable identifiers]

### Caching strategy

- [cache keys + TTL]
- [dev bypass or cache busting]
- [shared cache vs. local fallback]

### API surface

- [routes/endpoints + expected inputs/outputs]
- [request validation + size limits]

### Security + abuse prevention

- [SSRF allowlist or URL validation rules]
- [rate limiting]
- [CSP / security headers]
- [PII handling + redaction]

### Observability + error handling

- [request IDs + structured logging]
- [client error capture]
- [fallbacks and degraded modes]

## Incremental implementation steps (checklist)

### Phase 1 -- Project foundation

- [ ] Scaffold project with chosen framework
- [ ] Configure lint + formatting + typecheck
- [ ] Set env example files + local setup docs

### Phase 2 -- CI + quality gates

- [ ] Add CI pipeline for lint + unit tests
- [ ] Add integration/E2E test jobs when applicable
- [ ] Add accessibility checks (pa11y or equivalent)

### Phase 3 -- Curriculum/content plan

- [ ] Document curriculum/content source of truth
- [ ] Map content entities to DB/model fields
- [ ] Define MVP scope + non-goals clearly

### Phase 4 -- Data model + seed

- [ ] Define schema + migrations
- [ ] Add indexes + uniqueness constraints
- [ ] Implement idempotent seed script

### Phase 5 -- Auth + progress

- [ ] Configure auth provider
- [ ] Add guest progress storage + merge on sign-in
- [ ] Add admin gating (if applicable)

### Phase 6 -- Content pipeline

- [ ] Fetch + sanitize content
- [ ] Add cache + dev bypass
- [ ] Restrict allowed content domains/URLs

### Phase 7 -- Core UX

- [ ] Implement primary routes/pages
- [ ] Add navigation + progress UI
- [ ] Define "Continue" behavior and focus filtering

### Phase 8 -- Security + reliability

- [ ] Rate limiting + request validation
- [ ] Security headers + CSP
- [ ] Error boundaries + fallbacks

### Phase 9 -- Observability

- [ ] Add structured logging + request IDs
- [ ] Add client error capture/telemetry (optional)
- [ ] Document log fields + redaction rules

### Phase 10 -- Deployment

- [ ] Configure production env vars
- [ ] Smoke-test critical flows
- [ ] Release checklist + rollback plan

---

## Decisions log

Record your key prompts + outcomes here.

- [date] [prompt] -> [outcome]

---

## Related

- `codex-playbook.md`
- `prompt-library.md`
- `checkpoints.md`
