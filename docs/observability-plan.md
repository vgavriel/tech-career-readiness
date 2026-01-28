# Observability Implementation Plan (Vercel)

## Goals
- Centralize logs, metrics, traces, and error reporting for fast incident triage.
- Correlate user-facing errors to backend requests with request IDs and trace IDs.
- Add actionable alerts and runbooks to reduce mean time to resolution (MTTR).
- Keep costs low while staying compatible with Vercel hosting.

## Non-goals (for now)
- Full SIEM/enterprise security monitoring.
- Custom APM agent outside OpenTelemetry.
- Multi-region synthetic monitoring at scale.

## Current baseline (already in the codebase)
- Request IDs via proxy and response headers.
- Structured JSON logging with redaction and sampling.
- API route logging (auth, focus, progress, lesson-content).
- Lesson-content cache hit/miss logging.
- Client pageview telemetry via Vercel Analytics (flagged).
- Observability docs (`docs/observability.md`).

## Hosting constraints (Vercel)
- Vercel Log/Trace drains require Pro or Enterprise plans.
- On Hobby, you must send data directly to providers (OTLP or SDK).

## Tooling options (free tiers)
### Option A: New Relic Free (single vendor)
Pros:
- All-in-one (logs, metrics, traces, errors, dashboards).
- Simple operational workflow.
Cons:
- Single-vendor lock-in; may need upgrades as usage grows.

### Option B: Sentry (errors) + Grafana Cloud (metrics/traces/logs)
Pros:
- Best-in-class error UX from Sentry.
- Flexible metrics/tracing dashboards in Grafana Cloud.
Cons:
- Two tools to manage; setup is more involved.

## Decisions to make
1) Choose the stack (New Relic Free vs Sentry+Grafana Cloud Free).
2) Decide whether to upgrade to Vercel Pro for log/trace drains.
3) Decide data retention, sampling, and PII redaction policy.

## Phase 0 — Architecture + policy (1 day)
- Define ownership: primary on-call, escalation path, incident template.
- Standardize tags: `env`, `release`, `route`, `requestId`, `traceId`, `userIdHash`.
- Define sensitive fields policy and confirm redaction keys.
- Define SLOs and alert thresholds (see Phase 4).

## Phase 1 — Error reporting (server + client) (2–3 days)
Deliverables:
- Error tracking for server exceptions.
- Client error boundary that reports to the provider.
- Release tagging for deployments.

Tasks:
- Add error reporter SDK (New Relic or Sentry).
- Add a root client error boundary and route error handler.
- Include context: `requestId`, `route`, `userIdHash`, `release`.
- Wire Next.js runtime error hooks to the provider.

Acceptance:
- A forced server error appears in the error dashboard.
- A forced client error appears with route + release tags.

## Phase 2 — Tracing (OpenTelemetry) (2–3 days)
Deliverables:
- Distributed traces for API routes and server components.
- Spans for DB and external fetches (lesson content).

Tasks:
- Add `instrumentation.ts` and configure `@vercel/otel`.
- Export traces via OTLP to the provider (or via Vercel trace drains if Pro).
- Add custom spans around:
  - Lesson content fetch (including cache hit/miss).
  - Prisma queries (use middleware or manual spans).
  - Progress merge flow.
  - Auth callbacks.

Acceptance:
- A request trace shows all major spans with durations.
- Trace links include `requestId` and route tags.

## Phase 3 — Logging centralization (1–2 days)
Deliverables:
- Central log sink with search and correlations to trace IDs.

Tasks:
- If Pro: configure Vercel Log Drains (JSON/NDJSON).
- If Hobby: ship logs via provider SDK or OTLP log exporter.
- Ensure logs include `requestId`, `route`, `status`, `durationMs`.

Acceptance:
- Logs searchable by requestId and traceId.

## Phase 4 — Metrics & alerts (2–4 days)
Deliverables:
- RED metrics per route (Rate, Errors, Duration).
- Cache hit/miss metrics for lesson content and roadmap/modules.
- DB latency and query counts.
- Alerts on error spikes and latency regressions.

Tasks:
- Add metrics exporter (OTLP metrics).
- Track:
  - p50/p95/p99 latency per route.
  - 5xx error rate per route.
  - Lesson-content fetch failure rate.
  - Cache hit ratio per cache.
  - DB query time per request.
- Alerts:
  - 5xx rate > 1% for 5 minutes (core routes).
  - p95 latency > 1s for 5 minutes.
  - Lesson-content failures > 10% in 5 minutes.
  - Auth failures spike.

Acceptance:
- Dashboards show real traffic and metrics.
- Alerts trigger in a test scenario.

## Phase 5 — Dashboards & runbooks (1–2 days)
Deliverables:
- Dashboards for API health, auth, lesson content, DB health.
- Runbooks for common incidents.

Runbooks:
- Lesson content failures (external fetch or allowlist).
- Auth redirect loop.
- DB latency spike.
- Cache stampede (miss rates + timeouts).

## Phase 6 — Validation & chaos testing (ongoing)
- Add a synthetic check for `/` and `/lesson/:slug`.
- Simulate content fetch failure and verify alerts + error reporting.
- Perform quarterly observability review.

## Rollout checklist
- [ ] Choose provider stack.
- [ ] Add OTel instrumentation and OTLP export.
- [ ] Centralize logs.
- [ ] Add server/client error reporting.
- [ ] Ship metrics + dashboards.
- [ ] Configure alerting.
- [ ] Write runbooks.

## Acceptance criteria
- Any production error links to a trace and to logs (requestId or traceId).
- Top routes have p95/p99 latency dashboards.
- Cache hit rates are tracked and visible.
- Alerts trigger within 5 minutes for major regressions.
