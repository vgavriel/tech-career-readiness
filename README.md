[![E2E](https://github.com/vgavriel/tech-career-readiness/actions/workflows/e2e.yml/badge.svg?branch=main)](https://github.com/vgavriel/tech-career-readiness/actions/workflows/e2e.yml)
[![A11y (WCAG AAA)](https://github.com/vgavriel/tech-career-readiness/actions/workflows/a11y.yml/badge.svg?branch=main)](https://github.com/vgavriel/tech-career-readiness/actions/workflows/a11y.yml)

# Tech Career Readiness

Tech Career Readiness is a self-paced learning app built for college students.
The app itself is intentionally simple; the **engineering scaffolding** around
it is not. This repo is written for students who want to see how production
systems are designed and why those choices matter.

If you've completed an introductory CS sequence, you should be able to follow
along. Each document explains **what a system does**, **why it exists**, and
**where the code lives**.

## Start here (student-friendly)

- [System design guide](docs/system-design/README.md)
- [Architecture overview](docs/architecture.md)
- [Implementation plan](docs/implementation-plan.md)

## WCAG accessibility explainer

We run automated checks against **WCAG AAA**. If you're new to accessibility,
this explainer is a good starting point:
https://www.w3.org/WAI/WCAG21/Understanding/conformance

## System design map

These docs are intentionally thorough and cross-linked:

- [Auth and identity](docs/system-design/auth.md)
- [Data model](docs/system-design/data-model.md)
- [Content pipeline (Google Docs → HTML)](docs/system-design/content-pipeline.md)
- [Caching strategy](docs/system-design/caching.md)
- [Progress tracking and guest merge](docs/system-design/progress.md)
- [Security and abuse prevention](docs/system-design/security.md)
- [Observability and error reporting](docs/system-design/observability.md)
- [Testing strategy and tooling](docs/system-design/testing.md)
- [Frontend UX and accessibility](docs/system-design/frontend-ux.md)
- [Operations, environments, and tooling](docs/system-design/operations.md)
- [Privacy and licensing](docs/system-design/privacy-legal.md)

## Quickstart

### Local (recommended)

```bash
npm install
npm run dev:local
```

This uses a tmpfs-backed Postgres container, dev credentials auth, and no-op
rate limiting. It will create `.env.local` from `.env.example` if needed.

### Preview-like (real services)

```bash
npm install
npm run env:preview
# fill in .env.preview
npm run dev:preview
```

See [Environments](docs/environments.md) for the full workflow.

## Environment variables (short version)

- `APP_ENV` controls behavior (`local`, `preview`, `production`, `test`).
- Local dev uses `.env.local` (auto-loaded by Next.js).
- Preview dev uses `.env.preview` (loaded by `npm run dev:preview`).
- Only commit `.env.example` and `.env.preview.example`.
- Never commit real secrets.

Additional configuration:

- `ADMIN_EMAILS` (comma-separated) to bootstrap admin access in local/preview/test.
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` for rate limiting.
- `MAX_JSON_BODY_BYTES` (optional) for JSON payload limits.

## Testing

See [Testing Strategy](`docs/testing-strategy.md) for the full plan.

Local integration + E2E quickstart (requires Docker):

```bash
npm run test:integration:local
npm run test:e2e:local
```

If port `5434` is already in use, set `TEST_DB_PORT` to a free port.
