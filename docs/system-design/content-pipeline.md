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
Resources in that order, with one heading for each season. Source introductions,
seasonal advice, links, standalone images, and wrapped media are retained; edits
flow through the normal content cache. The calendar replaces only the exact known
document title, jump-list prompt, and paragraphs containing only a recognized
season/resource heading link. Empty spacer blocks are omitted. Added introductory
guidance is displayed below the interactive title, rather than discarded.

If the required structure is missing or reordered, meaningful content occurs
between a season heading and its first subsection, or text/content sits outside
the supported wrapper structure, the parser returns no enhancement and the route
renders the entire original lesson. Media counts as meaningful content in these
checks. This is a presentation parser, not a sanitizer; it only receives HTML
already processed by the existing sanitization and link-rewriting pipeline.

`src/components/recruiting-timeline.tsx` selects the current two-month season using
the America/New_York date, updates across date boundaries, and lets readers browse
without moving the current-season marker. A recognized source-heading URL always
shows the original guide, including when restored through Back/Forward. Leaving a
source heading with a season button or Back to now adds a fragment-free history entry so a previous selection
cannot override a restored heading. The reader and timeline share `useLessonHash`;
reader-owned fragment changes explicitly notify subscribers, and heading scrolling
runs after the corresponding content has rendered.

The original guide is also the component's server-rendered hydration baseline.
This is not a course-wide no-JavaScript guarantee: the surrounding lesson reader
streams content through React Suspense. The interactive reader has no full-guide
toggle or source-document link. It uses shared theme tokens and container queries
within the existing course navigation and progress UI.

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
