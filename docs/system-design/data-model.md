# Data Model

## What it is

The database models curriculum structure (modules and lessons) and user progress.
Everything that drives navigation, ordering, and completion is stored in
Postgres via Prisma.

## Why it exists

- Ensures deterministic ordering and stable lesson identifiers.
- Supports guest-to-user merge and progress event auditing.
- Enables cross-device progress tracking.

## Core models

### User

Holds identity and personalization state.

- `email` is unique and case-insensitive.
- `focusKey` stores the current focus selection.
- `sessionVersion` supports server-side session invalidation.

### Module + Lesson

Represents the curriculum structure and lesson ordering.

- `Module.order` + `Lesson.order` provide stable navigation ordering.
- `LessonSlugAlias` preserves legacy slugs and supports redirects.
- `Lesson.supersededByLessonId` links deprecated lessons to replacements.

### LessonProgress + LessonProgressEvent

Tracks completion state and an audit trail of changes.

- `LessonProgress` stores current completion state.
- `LessonProgressEvent` records the action history.

## Where it lives (code)

- Prisma schema: [`prisma/schema.prisma`](../../prisma/schema.prisma)
- Seed logic: [`prisma/seed.js`](../../prisma/seed.js)
- Seed utilities: [`prisma/seed-utils.js`](../../prisma/seed-utils.js)

## Tradeoffs and constraints

- Progress is denormalized into a current state table plus an audit event table.
  This is intentional to keep reads fast while preserving history.

## Related docs

- [Progress tracking](./progress.md)
- [Content pipeline](./content-pipeline.md)
- [Caching strategy](./caching.md)
