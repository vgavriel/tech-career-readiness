# Testing Strategy and Tooling

## What it is

The project uses a layered testing strategy:

- **Unit tests** for pure logic and utilities.
- **Integration tests** for API routes and DB interactions.
- **E2E tests** for core user flows with Playwright.
- **Accessibility checks** with pa11y.

## Why it exists

- Unit tests catch logic regressions quickly.
- Integration tests ensure API behavior and DB boundaries are correct.
- E2E tests validate real flows across navigation and auth.
- a11y checks enforce inclusive UI standards.

## Where it lives (code)

- Vitest config: [`tooling/vitest.config.ts`](../../tooling/vitest.config.ts)
- Integration config: [`tooling/vitest.integration.config.ts`](../../tooling/vitest.integration.config.ts)
- Playwright config: [`tooling/playwright.config.ts`](../../tooling/playwright.config.ts)
- Accessibility config: [`tooling/pa11yci.config.js`](../../tooling/pa11yci.config.js)
- Test scripts: [`package.json`](../../package.json)

## Related docs

- [Testing strategy](../testing-strategy.md)
- [Engineering standards](../engineering-standards.md)
