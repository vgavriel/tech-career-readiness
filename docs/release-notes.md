# Release Notes

This repo uses continuous deployment: every merge to `main` is a deployable
version. Release notes are generated from the pull requests included in that
deploy, not from manual package version bumps.

## Version Format

Production versions use:

```text
YYYY.MM.DD.<short-sha>
```

Example:

```text
2026.05.12.abcdef0
```

The `Version` workflow creates the matching Git tag and GitHub Release:

```text
vYYYY.MM.DD.<short-sha>
```

## Pull Request Contract

Every PR should include a `## Release` block:

```md
## Release

Release type: user-facing
Release note: Lesson pages now show progress while content loads.
```

Use one of these release types:

- `user-facing`: visible feature or behavior change for learners/instructors.
- `fix`: user-visible bug fix.
- `accessibility`: accessibility improvement.
- `performance`: user-visible speed or reliability improvement.
- `security`: security-sensitive fix or hardening.
- `dependency`: dependency maintenance.
- `internal`: engineering-only change worth keeping in the release ledger.
- `none`: engineering-only change that does not need a curated note.

Use `Release note: None` for internal-only changes. Renovate PRs are
automatically classified as `dependency` when no release block is present.

Optional labels can override the PR body when needed:

- `release:user-facing`
- `release:fix`
- `release:accessibility`
- `release:performance`
- `release:security`
- `release:dependency`
- `release:internal`
- `release:none`

## Automation

On every push to `main`, `.github/workflows/version.yml`:

1. Computes the date-based version from the merge commit date and short SHA.
2. Finds the previous `vYYYY.MM.DD.<short-sha>` tag.
3. Creates the new tag if it does not already exist.
4. Runs `scripts/generate-release-notes.mjs`.
5. Creates or updates the GitHub Release with grouped notes.

The release-note generator groups PRs into:

- User-Facing Changes
- Security
- Dependency Maintenance
- Internal Changes
- Direct Commits

## Codex Responsibilities

When Codex opens or updates a PR, it should keep the `## Release` block accurate:

- write a clear release note for user-facing work,
- use `Release note: None` for internal-only work,
- classify dependency work as `dependency`,
- update the release block when the PR scope changes,
- never manually bump `package.json` for deploy versions.
