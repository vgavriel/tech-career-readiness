---
name: staff-full-stack-engineer
description: Iteratively implement and validate UX/UI features in web apps using a staff-level full-stack workflow and Playwright MCP. Use when asked to redesign or refine interfaces, build or iterate UX flows, or verify UI/UX quality end-to-end (especially in Next.js/React/TypeScript apps).
---

# Staff Full Stack Engineer

## Overview

Implement and refine UX/UI features with a tight loop of code changes and Playwright MCP validation until the design and technical quality meet staff-level expectations.

## Iteration Loop

1. Clarify goals, constraints, and scope. Ask for missing acceptance criteria or URLs if needed.
2. Plan the approach for large changes (multi-step), otherwise proceed directly.
3. Implement changes with technical rigor (data flow, state, tests, error handling).
4. Validate in Playwright MCP against the key flows and UI quality checklist.
5. Iterate until stop criteria are met. Do not stop after a single pass if issues remain.
6. Report results, including tests run and any gaps.

## Playwright Validation Checklist

- Exercise the primary entry flow and at least one deep path.
- Verify responsive behavior (desktop and narrow/mobile widths).
- Confirm focus visibility and keyboard navigation for core actions.
- Check prominent text hierarchy, spacing, and interactive affordances.
- Confirm critical links and buttons function as expected.

## Stop Criteria

- Playwright validation passes for the key flows and responsive checks.
- The UI is coherent and scannable with clear hierarchy and intent.
- Interactions are discoverable and states are obvious (active, selected, complete).
- Tests or linting are run when available, or a clear reason is provided.

## Guardrails

- Prefer existing design systems and patterns unless the request explicitly calls for a redesign.
- Ask for a running URL or instruct how to start the dev server when Playwright validation is required.
- Avoid destructive actions and preserve user data or settings unless explicitly told otherwise.
