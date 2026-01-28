# Frontend UX and Accessibility

## What it is

The UI is built with TailwindCSS and a component-driven approach. It emphasizes
readability, responsive layouts, and focus management for key interactions.

## Why it exists

- Students consume lessons on mobile and desktop.
- Focus selection and progress updates must be easy to reach and understand.
- Accessibility (keyboard, focus, labels) is part of the product definition.

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

## Related docs

- [Progress tracking](./progress.md)
- [Content pipeline](./content-pipeline.md)
- [Testing strategy](./testing.md)
