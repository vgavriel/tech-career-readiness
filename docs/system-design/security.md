# Security and Abuse Prevention

## What it is

Security controls focus on preventing common web-app risks: CSRF, SSRF, XSS,
rate-limit abuse, and leaking sensitive data in logs.

## Why it exists

- The app is public and must defend against automated abuse.
- Lesson HTML is external content and must be sanitized.
- Logging must avoid leaking PII.

## Protections in place

### Request guard (CSRF protection)

State-changing routes enforce:

- JSON-only content type
- Origin/Referer allowlist

Where it lives:

- [`src/lib/request-guard.ts`](../../src/lib/request-guard.ts)

### Rate limiting

Upstash rate limiting is enabled in preview/production with per-bucket limits.
Anonymous requests use IP-based keys; if IP is missing, a warning is logged.

Where it lives:

- [`src/lib/rate-limit.ts`](../../src/lib/rate-limit.ts)

### Lesson fetch allowlist (SSRF mitigation)

Lesson HTML can only be fetched from allowlisted Google Doc hosts, including
redirect validation.

Where it lives:

- [`src/lib/lesson-content/fetch.ts`](../../src/lib/lesson-content/fetch.ts)

### HTML sanitization (XSS prevention)

Sanitization removes unsafe tags and attributes before rendering lesson HTML.

Where it lives:

- [`src/lib/lesson-content/sanitize.ts`](../../src/lib/lesson-content/sanitize.ts)

### Client error scrubbing (PII protection)

Client errors are scrubbed server-side before logging to avoid leaking PII
(e.g., URL query params, full user agent strings).

Where it lives:

- [`src/app/api/client-error/route.ts`](../../src/app/api/client-error/route.ts)
- [`src/lib/client-error-scrub.ts`](../../src/lib/client-error-scrub.ts)

### Session revocation

JWTs include a server-side `sessionVersion`, enabling "sign out everywhere"
without session tables.

Where it lives:

- [`src/lib/auth.ts`](../../src/lib/auth.ts)
- [`src/lib/auth-user.ts`](../../src/lib/auth-user.ts)

## Tradeoffs and constraints

- CSRF protection depends on a tight origin allowlist.
- External images can still leak privacy if allowed by sanitization rules.

## Related docs

- [Auth and identity](./auth.md)
- [Content pipeline](./content-pipeline.md)
- [Observability](./observability.md)
