# System Design Guide

This folder documents the system design choices behind Tech Career Readiness.
Each document explains what the design is, why it exists, and where to find the
implementation in the codebase. The intent is to show students the production
scaffolding that sits around a relatively simple learning app.

If you are new here, start with these two documents:

- [Architecture overview](../architecture.md)
- [Implementation plan](../implementation-plan.md)

## Topics

- [Auth and identity](./auth.md)
- [Data model](./data-model.md)
- [Content pipeline (Google Docs -> HTML)](./content-pipeline.md)
- [Caching strategy](./caching.md)
- [Progress tracking and guest merge](./progress.md)
- [Security and abuse prevention](./security.md)
- [Observability and error reporting](./observability.md)
- [Testing strategy and tooling](./testing.md)
- [Frontend UX and accessibility](./frontend-ux.md)
- [Operations, environments, and tooling](./operations.md)
- [Privacy and licensing](./privacy-legal.md)

## How to read this documentation

Every document uses the same structure:

- **What it is**: a short, educational description.
- **Why it exists**: what it ensures or prevents.
- **Where it lives**: links to the exact source files.
- **Tradeoffs**: constraints, risks, or known limitations.

## Related docs

- [Engineering standards](../engineering-standards.md)
- [Testing strategy](../testing-strategy.md)
- [Observability plan](../observability-plan.md)
- [Environment setup](../environments.md)
- [Codex instructions](../codex-instructions.md)
