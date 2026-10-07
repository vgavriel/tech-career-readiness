# Caching Strategy

## What it is

The app caches content at multiple layers to reduce DB and network load:

- Lesson HTML cache (memory + Upstash Redis)
- Public roadmap metadata in the Next.js Data Cache
- CDN caching for static assets and the lesson content API

## Why it exists

- Lesson HTML fetch is slow and rate-limited by external hosts.
- Module/lesson metadata is low-churn and should not hit the DB on every request.
- Caching keeps costs low and reduces latency for learners.

## Layer 1: Lesson HTML cache

- In-memory cache per server instance.
- Optional shared Upstash Redis cache in preview/production.
- TTL defaults to one hour and is versioned for safe invalidation.

Where it lives:

- Cache implementation: [`src/lib/lesson-content/cache.ts`](../../src/lib/lesson-content/cache.ts)
- Pipeline integration: [`src/lib/lesson-content/index.ts`](../../src/lib/lesson-content/index.ts)

## Layer 2: Public metadata cache

Module and lesson metadata use Next.js `unstable_cache` with a one-hour
revalidation interval. This data cache is shared across requests even though
HTML renders dynamically to support per-request CSP nonces. Session/user data
is not cached here. Cache Components and partial prerendering stay disabled;
see the [app shell architecture](../architecture.md).

Where it lives:

- Cached modules loader: [`src/lib/roadmap-modules.ts`](../../src/lib/roadmap-modules.ts)

## Tradeoffs and constraints

- In-memory caches are per-instance and are cleared on deploys or cold starts.
- Shared caches require Redis credentials and are disabled in tests.
- Cache TTLs are conservative; changes may take time to propagate.

## Related docs

- [Content pipeline](./content-pipeline.md)
- [Operations](./operations.md)
- [Observability](./observability.md)
