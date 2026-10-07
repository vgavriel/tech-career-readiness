# Architecture Notes

## Request-rendered app shell and CSP

HTML uses a fresh Content Security Policy (CSP) nonce for each request. The root
layout awaits `connection()` before rendering so Next.js can attach that nonce
to its framework scripts. `cacheComponents` is disabled: partial prerendering
creates a static shell before the request nonce exists, which can leave startup
scripts blocked by CSP. This broke hydration when upgrading to Next.js 16.4.

This follows Next.js's [dynamic rendering requirement for nonce-based CSP](https://nextjs.org/docs/app/guides/content-security-policy#dynamic-rendering-requirement).
HTML is rendered per request rather than shared through the full route cache.
Do not enable static HTML caching or partial prerendering without revisiting the
security policy and validating startup in a production build.

- `src/app/layout.tsx` establishes request-time rendering and wraps `AppShell`
  in Suspense so session-dependent content can still stream.
- `src/components/app-shell.tsx` fetches session/user data and renders
  `Providers`, `SiteHeader`, and the page content.
- `src/lib/roadmap-modules.ts` uses `unstable_cache` with a one-hour revalidation
  interval to share public module/lesson metadata across requests. No session
  data or request APIs belong inside this cache.
- Lesson HTML keeps its separate memory, Redis, and API/CDN caching layers.

The Playwright `startup` project verifies nonce freshness, inline script
authorization, and working theme controls before the remaining E2E tests run.
