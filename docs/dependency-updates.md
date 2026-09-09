# Dependency updates

Renovate opens dependency pull requests and rebases them when they fall behind
`main`. Auto-merge eligibility is defined in `renovate.json`:

| Update                                                                     | Auto-merge        |
| -------------------------------------------------------------------------- | ----------------- |
| Patch and minor updates, including `package.json` changes                  | Yes               |
| npm lockfile-only updates and scheduled lockfile maintenance               | Yes               |
| Major upgrades of explicitly listed development tools exercised by CI      | Yes               |
| Major application, framework, runtime, and other development-tool upgrades | No; manual review |

The major-update list covers Vitest and its V8 coverage provider, Testing Library,
jsdom, Playwright, Pa11y/pa11y-ci, TypeScript, and the listed ESLint tools.
The required checks run these tools through typechecking, linting, unit and
integration tests, browser tests, and accessibility audits. Add a tool to this list
only when the required checks exercise it. Merely appearing in `devDependencies`
does not qualify a major upgrade: Prisma, Tailwind, `eslint-config-next`, Node.js
types, Husky, lint-staged, and Prettier majors still need review.

The existing npm, ESLint, and TypeScript version ceilings continue to block known
incompatible releases. Their scheduled compatibility probes remain responsible
for proposing removal of those ceilings.

Eligible updates use GitHub's PR auto-merge. The Main Branch Protection ruleset
requires an up-to-date branch and all seven existing checks: `unit`, `integration`,
`dependency-review`, `Analyze`, `CodeQL`, `a11y`, and `e2e`. Renovate's bypass applies
only to the separate review requirement; it cannot bypass those checks. The
accessibility and browser workflows run on Renovate PRs.

`pa11y-ci` has its own dependency on Pa11y. An npm override points that dependency
at the project's declared Pa11y range, and a unit test verifies that both resolve
to the same installed module. This makes a direct Pa11y major upgrade run in the
accessibility audit instead of silently continuing to use an older nested copy.

The policy takes effect after the configuration PR merges into `main` and
Renovate next processes the repository. Existing eligible PRs must rebase and pass
the required checks before they can merge.
