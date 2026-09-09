# Frontend UX and Accessibility

## What it is

The UI is built with TailwindCSS and a component-driven approach. It emphasizes
readability, responsive layouts, and focus management for key interactions.

## Why it exists

- Students consume lessons on mobile and desktop.
- Focus selection and progress updates must be easy to reach and understand.
- Accessibility (keyboard, focus, labels) is part of the product definition.

## WCAG accessibility explainer

We run automated tests to check for **WCAG AAA** conformance. If you're new to accessibility,
this explainer is a good starting point:
https://www.w3.org/WAI/WCAG21/Understanding/conformance

## Key UI systems

### Focus menu and picker

The focus system allows learners to filter content by priority.

Where it lives:

- Focus menu: [`src/components/focus-menu.tsx`](../../src/components/focus-menu.tsx)
- Focus picker: [`src/components/focus-picker.tsx`](../../src/components/focus-picker.tsx)
- Focus state: [`src/components/focus-provider.tsx`](../../src/components/focus-provider.tsx)
- Focus options: [`src/lib/focus-options.ts`](../../src/lib/focus-options.ts)

### Responsive lesson tables

Lesson content includes tables that are reflowed into stacked cards on mobile.

Where it lives:

- Global styles: [`src/app/globals.css`](../../src/app/globals.css)

### Header navigation

The header adapts to mobile and tablet layouts while keeping sign-in and
privacy links visible.

Where it lives:

- Header: [`src/components/site-header.tsx`](../../src/components/site-header.tsx)

### Browser theme preference

The round header button shows a moon in light mode and a sun in dark mode,
indicating the mode it switches to. It remains visible alongside the mobile menu.
Light is the default. The preference is stored only in `localStorage` under
`tcr-theme`; signing in or out does not change it, and no database field or API
request is involved. Other tabs in the same browser respond to storage changes.
When storage is blocked, switching still works for the current visit.

The root layout applies the stored theme before first paint using a small static
script. The proxy permits its exact SHA-256 hash under the existing CSP, keeping
the root layout static without allowing arbitrary inline scripts. Shared CSS
variables style both themes, including native controls and focus indicators.
The button waits for hydration before becoming interactive.

- Toggle: [`src/components/theme-toggle.tsx`](../../src/components/theme-toggle.tsx)
- Preference and initializer: [`src/lib/theme.ts`](../../src/lib/theme.ts)
- Browser coverage: [`e2e/theme.spec.ts`](../../e2e/theme.spec.ts)
- `npm run test:a11y:local` audits the key pages and focus states in both themes.

## Related docs

- [Progress tracking](./progress.md)
- [Content pipeline](./content-pipeline.md)
- [Testing strategy](./testing.md)
