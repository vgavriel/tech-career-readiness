# Content Pipeline (Google Docs -> HTML)

## What it is

Lessons are written in Google Docs and published as HTML. The app fetches the
published HTML server-side, sanitizes it, rewrites specific structures, and then
renders it as safe HTML inside the lesson page.

## Why it exists

- Avoids iframes and allows consistent styling.
- Prevents unsafe HTML or scripts from executing.
- Keeps lesson content editable by non-engineers in Google Docs.

## Pipeline stages

1. **Fetch**: only from allowlisted Google Doc hosts.
2. **Sanitize**: remove unsafe tags and attributes.
3. **Transform**: map doc styles, extract structure, and rewrite images.
4. **Cache**: store sanitized HTML for a TTL to reduce re-fetch cost.

## Where it lives (code)

- Fetch + allowlist + redirect handling:
  [`src/lib/lesson-content/fetch.ts`](../../src/lib/lesson-content/fetch.ts)
- Sanitization rules:
  [`src/lib/lesson-content/sanitize.ts`](../../src/lib/lesson-content/sanitize.ts)
- HTML extraction + structure fixes:
  [`src/lib/lesson-content/extract.ts`](../../src/lib/lesson-content/extract.ts)
- Image rewriting:
  [`src/lib/lesson-content/images.ts`](../../src/lib/lesson-content/images.ts)
- Orchestrator:
  [`src/lib/lesson-content/index.ts`](../../src/lib/lesson-content/index.ts)

## Recruiting timeline presentation

The `tech-recruiting-timeline` lesson enhances the sanitized, internally linked
Google Doc HTML with a six-season interactive reader. The parser in
`src/lib/recruiting-timeline.ts` requires the existing season headings (including
month ranges), What's happening, Action Items, Recruiting Tip, and Essential Brown
Resources. It preserves the source advice and links; edits flow through the normal
content cache. If the expected structure changes, the entire original lesson is
rendered instead of dropping content.

`src/components/recruiting-timeline.tsx` selects the current two-month season using
the America/New_York date, updates across date boundaries, and lets readers browse
without moving the current-season marker. The full original guide remains available,
including without JavaScript. Incoming source heading links open that full view to
retain the existing heading-navigation behavior. The component uses shared theme
tokens and container queries within the existing course navigation and progress UI.

## Security and privacy notes

- Only `docs.google.com` and `drive.google.com` are allowed.
- Redirects are validated to stay on allowlisted hosts.
- Sanitization prevents XSS from lesson content.

## Tradeoffs and constraints

- HTML fidelity depends on how Google Docs exports content.
- Images load only from allowlisted Google hosts (`docs.google.com`,
  `googleusercontent.com`, `gstatic.com`) unless we later proxy them.

## Related docs

- [Caching strategy](./caching.md)
- [Security](./security.md)
- [Frontend UX](./frontend-ux.md)
