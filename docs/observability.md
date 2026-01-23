# Observability

## Request IDs
- Middleware assigns `x-request-id` to all `/api` routes and returns the same value on the response.
- If a request already includes `x-request-id`, it is preserved and propagated downstream.

## Structured logging
Logs are JSON lines emitted by `src/lib/logger.ts`.

Common fields:
- `timestamp`: ISO timestamp.
- `level`: debug/info/warn/error.
- `message`: event name.
- `requestId`: correlates logs with `x-request-id`.
- `route`: logical route label when applicable.
- `durationMs`: elapsed milliseconds for the server handler.
- `status`: HTTP status code when applicable.
- `cache`: "hit" or "miss" for lesson-content fetches.
- `action`, `provider`, `method`, `userId`: contextual fields for auth/progress logs.

### Redaction defaults
The logger redacts values for keys that commonly contain secrets or PII
(e.g., email, tokens, secrets, passwords, cookies, authorization headers).

### Configuration
- `LOG_LEVEL`: debug/info/warn/error. Default: debug (local), warn (test), info (preview/prod).
- `LOG_SAMPLE_RATE`: 0-1 float; applies to debug/info logs only. Warn/error always log.
- `NEXT_PUBLIC_ANALYTICS_ENABLED`: true/false; controls client pageview telemetry.

## Client pageview telemetry
Page views are tracked with `@vercel/analytics` when enabled. By default it
is on for preview/production and off for local/test unless overridden by
`NEXT_PUBLIC_ANALYTICS_ENABLED`.

## Sampling and retention guidance
- Keep warn/error logs at full retention for 30-90 days.
- Sample info/debug via `LOG_SAMPLE_RATE` and retain for 7-14 days.
- If volume spikes, apply additional sampling or filters at the log sink.
