Implement the plan in docs/implementation-plan.md in order. Do not skip steps. After each step, update a checklist. Commit after each phase.
Walk me through the changes you made so I can keep track and review all technical decisions.

Before any commit: Perform a Pre-Commit Review: Act as a senior engineer doing a pre-commit review. Identify bugs, edge cases, and cleanup suggestions.
For any UI change, validate the update in Playwright against `localhost:3000` and report what was checked. If Playwright cannot run, say why.

## Branching and PR workflow
- Create a new feature branch for each request before making changes (unless explicitly told to work on `main`).
- Use branch names like `feature/<short-scope>` or `chore/<short-scope>`.
- After finishing a phase, commit on the branch and ask the user to open a PR.
- Assume CI runs on `pull_request`; avoid pushing directly to `main`.

## Testing policy
- For every feature or bugfix, add or update tests at the appropriate level:
  - unit for pure logic and components
  - integration for API/DB/cache boundaries
  - end-to-end for critical user flows
- If a test layer lacks scaffolding, add it first.
- Keep tests deterministic: no real network/OAuth; use mocks, MSW, or Playwright routing.
- Always state which tests were run or why they were not run.
- If a change does not merit tests, explicitly justify.
