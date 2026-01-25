# Architecture Notes

## Cache-aware app shell (cacheComponents + Suspense)
We enable `cacheComponents` in `next.config.ts`, which means runtime data access
(`cookies()`, `headers()`, `getServerSession`, etc.) must be rendered inside a
`<Suspense>` boundary to avoid blocking the whole route. To keep the root layout
static while still supporting auth/session data, the app shell is split:

- `src/app/layout.tsx` is static and only renders a Suspense boundary.
- `src/components/app-shell.tsx` is a server component that fetches runtime
  data and renders `Providers`, `SiteHeader`, and the page content.

This structure keeps the outer HTML cache-friendly while allowing the dynamic
parts to stream in once runtime data resolves.

### Why this matters for caching
- Static parts of the layout can be cached and streamed immediately.
- Dynamic, per-request data stays isolated inside the Suspense boundary.
- It avoids Next.js `blocking-route` and `missing-suspense` errors when
  `cacheComponents` is enabled.

### Guidelines
- Keep runtime APIs out of `src/app/layout.tsx`.
- Put runtime data fetching in `src/components/app-shell.tsx` or children.
- Wrap any client components that rely on runtime hooks inside the same boundary.
