# Security Policy

## Reporting a vulnerability

Please do not open public issues or pull requests for security reports.

Preferred path:

- Use GitHub's private vulnerability reporting (Security tab -> "Report a vulnerability").

If you cannot access private reporting:

- Contact @vgavriel on GitHub and request a secure channel for disclosure.

We aim to:

- Acknowledge receipt within 3 business days.
- Provide an initial assessment within 7 business days.
- Coordinate a fix and disclosure timeline with the reporter.

## Supported versions

Security fixes are made on the `main` branch and are not backported.

## Scope

In scope:

- The application code in this repository.
- Build and CI workflows in `.github/workflows`.
- Dependencies declared in `package.json`.

Out of scope:

- Issues in third-party services (GitHub, Vercel, Google OAuth, Upstash, etc.).
- Denial-of-service attacks beyond configured rate limits.
- Social engineering of project maintainers or users.

## Related docs

- Threat model: `docs/security-threat-model.md`
- Incident response: `docs/security-incident-response.md`
- App security controls: `docs/system-design/security.md`
