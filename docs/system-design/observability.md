# Observability and Error Reporting

## What it is

Observability in this app centers on structured logs, request IDs, and client
error reporting. The goal is to debug production issues quickly without logging
sensitive data.

## Why it exists

- The app is public and needs visibility into failures.
- Client-side errors are invisible to the server unless captured.
- Structured logs enable search and alerting in hosted logs.

## Logging and request IDs

Each server request can be tagged with a request ID for traceability.

Where it lives:

- Logger implementation: [`src/lib/logger.ts`](../../src/lib/logger.ts)
- Log constants: [`src/lib/log-constants.ts`](../../src/lib/log-constants.ts)
- Request ID resolution: [`src/lib/request-id.ts`](../../src/lib/request-id.ts)

## Client error ingestion

Client errors are captured and sent to `/api/client-error`. Payloads are
scrubbed to remove query params and hash user agent strings.

Where it lives:

- Client reporter: [`src/lib/client-error.ts`](../../src/lib/client-error.ts)
- Server route: [`src/app/api/client-error/route.ts`](../../src/app/api/client-error/route.ts)
- Scrubber: [`src/lib/client-error-scrub.ts`](../../src/lib/client-error-scrub.ts)

## Related docs

- [Security](./security.md)
- [Testing strategy](./testing.md)
- [Observability plan](../observability-plan.md)
