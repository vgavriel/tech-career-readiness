# Implementation Plan (Template)

> Copy this file to `docs/implementation-plan.md` in your project and fill it in.

## Overview

- **Product**: [what you're building]
- **Primary user**: [who it serves]
- **MVP scope**: [bullet list]
- **Non-goals**: [bullet list]

## Architecture snapshot

- **Frontend**: [framework]
- **Backend**: [framework/API]
- **Database**: [db + ORM]
- **Auth**: [optional/required + provider]
- **Hosting**: [deployment target]

## Incremental implementation steps (checklist)

### Phase 1 -- Project foundation

- [ ] Scaffold project
- [ ] Configure lint + formatting
- [ ] Set env example files

### Phase 2 -- Data model

- [ ] Define schema
- [ ] Add seed strategy
- [ ] Add uniqueness constraints

### Phase 3 -- Auth + environments

- [ ] Configure auth provider
- [ ] Add env guards

### Phase 4 -- Core UX

- [ ] Implement main routes
- [ ] Add navigation
- [ ] Add basic progress UI

### Phase 5 -- Content pipeline

- [ ] Fetch + sanitize content
- [ ] Add cache + dev bypass

### Phase 6 -- Testing + CI

- [ ] Unit tests
- [ ] CI jobs
- [ ] Mock external network

### Phase 7 -- Quality pass

- [ ] Accessibility pass
- [ ] Performance pass
- [ ] Security review

### Phase 8 -- Deployment

- [ ] Production env
- [ ] Release checklist

---

## Decisions log

Record your key prompts + outcomes here.

- [date] [prompt] -> [outcome]

---

## Related

- `codex-playbook.md`
- `prompt-library.md`
- `checkpoints.md`
