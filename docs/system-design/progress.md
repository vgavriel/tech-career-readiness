# Progress Tracking and Guest Merge

## What it is

Progress is tracked for both anonymous and authenticated users.

- Anonymous progress lives in localStorage.
- Authenticated progress is stored in the database.
- On sign-in, guest progress can be merged into the user's account.

## Why it exists

- Keeps the product usable without forcing login.
- Preserves progress across devices after sign-in.
- Enables "continue where you left off" UX.

## How it works

1. UI reads progress from the `ProgressProvider`.
2. When unauthenticated, progress is read/written from localStorage.
3. When authenticated, progress is read/written via `/api/progress`.
4. If guest progress exists at sign-in, `/api/progress/merge` applies it.

## Where it lives (code)

- Client-side state management:
  [`src/components/progress-provider.tsx`](../../src/components/progress-provider.tsx)
- Guest storage utilities:
  [`src/lib/guest-progress.ts`](../../src/lib/guest-progress.ts)
- Progress API:
  [`src/app/api/progress/route.ts`](../../src/app/api/progress/route.ts)
- Merge API:
  [`src/app/api/progress/merge/route.ts`](../../src/app/api/progress/merge/route.ts)
- Progress events and types:
  [`prisma/schema.prisma`](../../prisma/schema.prisma)

## Tradeoffs and constraints

- Guest progress is per-browser and can be cleared by the user.
- Merge is a one-time operation per sign-in session.

## Related docs

- [Auth and identity](./auth.md)
- [Data model](./data-model.md)
- [Frontend UX](./frontend-ux.md)
