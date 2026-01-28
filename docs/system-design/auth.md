# Auth and Identity

## What it is

The app uses NextAuth with a JWT session strategy. Auth exists only to attach
progress data to a user; all course content is readable when logged out.

There are two runtime modes:

- **Local/Test**: Simple credentials provider for a one-click dev login.
- **Preview/Production**: Google OAuth only.

## Why it exists

- Keeps the product public and low-friction while still offering persistent
  progress tracking for signed-in learners.
- Avoids server-side session tables by using JWTs.
- Supports "sign out everywhere" by invalidating tokens server-side.

## Key design choices

### JWT sessions with server-side revocation

JWTs are used for simplicity and performance. A `sessionVersion` field on the
user record is copied into the JWT. If the JWT's version does not match the
stored user version, the session is treated as invalid.

This enables:

- Immediate session invalidation without session tables.
- Rotation on password resets, admin actions, or suspected compromise.

### Environment-specific providers

- Local/Test environments use a credentials provider for fast iteration.
- Preview/Production enforce Google OAuth and require secrets.

### Admin bootstrap in non-prod

Admin access is granted in local/preview/test when the email is in
`ADMIN_EMAILS`. This avoids seed-time admin setup during development.

## Where it lives (code)

- Auth configuration: [`src/lib/auth.ts`](../../src/lib/auth.ts)
- Authenticated user lookup + admin gating:
  [`src/lib/auth-user.ts`](../../src/lib/auth-user.ts)
- NextAuth route handler:
  [`src/app/api/auth/[...nextauth]/route.ts`](../../src/app/api/auth/%5B...nextauth%5D/route.ts)
- Session type augmentation:
  [`src/types/next-auth.d.ts`](../../src/types/next-auth.d.ts)
- Environment defaults:
  [`.env.example`](../../.env.example)

## Tradeoffs and constraints

- JWTs are stateless, so revocation depends on a DB read to compare
  `sessionVersion` on each request.
- In local/test, credentials auth is not meant for production use.

## Related docs

- [Security](./security.md)
- [Data model](./data-model.md)
- [Operations](./operations.md)
