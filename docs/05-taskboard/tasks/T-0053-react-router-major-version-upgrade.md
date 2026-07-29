# T-0053: React Router Major-Version Upgrade

## Status
todo

## Type
risk

## Priority
P2

## Owner
unassigned

## Created
2026-07-29

## Updated
2026-07-29

## Checkpoint
Future minor-version release

## Phase
Post-v1.1.1 minor upgrade

## Summary
Upgrade PaperBinder from React Router 7.x to the current supported major version, then re-validate routing, auth redirects, tenant-host navigation, and audit posture.

## Context
- `T-0045` finding F5 deferred the React Router 7 to 8 major-version migration beyond `v1.1.0`.
- `T-0052` applied same-major lockfile remediation for `v1.1.1`, reducing the audit report to React Router RSC-mode advisories that do not apply to PaperBinder's shipped client-rendered SPA runtime mode.
- The carry-forward is still a major-version upgrade, not only audit remediation. It needs its own minor-version task because router majors can alter route semantics, navigation APIs, data-router behavior, and package transitive dependencies.

## Acceptance Criteria
- [ ] Freshly inspect React Router release notes, migration guidance, and `npm audit` output at implementation time.
- [ ] Upgrade `react-router` / `react-router-dom` to the current supported major version without enabling SSR, RSC mode, framework actions, or document request action handling unless a separate ADR explicitly changes PaperBinder's frontend architecture.
- [ ] Preserve root-host and tenant-host route behavior, including login, provisioning, logout, impersonation, binder navigation, document navigation, and not-found handling.
- [ ] Re-check every `<Link to>` and `navigate()` call so attacker-controlled input does not reach React Router path resolution.
- [ ] Update package manifests, lockfile, tests, and docs that mention the router/audit disposition.
- [ ] Validation passes: frontend tests, frontend build, browser E2E root-host and tenant-host suites, docs validation, and any broader release validation required by the minor-version plan.

## Dependencies
- Completed `T-0052` final validation and hiring assessment review.

## Blocked By
- A future minor-version release plan that pulls this task into scope.

## Review Gates
- Scope Lock: React Router major upgrade and directly required follow-through only.
- Pre-PR Critique: Treat routing and redirect trust as security-sensitive. Review before broad mechanical edits.
- Escalation Notes: Frontend package installation, Vite/Vitest commands, browser E2E, and Docker-backed validation may require elevated execution.

## Current State
- Deferred. PaperBinder remains on React Router 7.x after same-major `v1.1.1` remediation.

## Touch Points
- `src/PaperBinder.Web/package.json`
- `src/PaperBinder.Web/package-lock.json`
- `src/PaperBinder.Web/src/`
- `docs/05-taskboard/`
- `docs/95-delivery/release-checklist.md`
- `REVIEWERS.md`

## Implementation Plan
- Re-read current React Router migration and security guidance at task start.
- Upgrade packages and run the frontend test suite to expose route/API drift.
- Fix only migration-required code and tests.
- Re-run browser and release validation gates.
- Update the documented audit/carry-forward disposition.

## Next Action
- Pull into the next minor-version plan when dependency-upgrade work is in scope.

## Validation Evidence
- Pending.

## Decision Notes
- The `v1.1.1` patch did not need this migration because the remaining advisory affected React Router RSC mode, which PaperBinder does not use.
- The future task still exists because staying indefinitely on an old router major is a maintainability and audit signal issue even when the current shipped runtime is not exposed.

## Validation Plan
- `npm.cmd run test -- --run`
- `npm.cmd run build`
- `powershell -ExecutionPolicy Bypass -File .\scripts\run-browser-e2e.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`
- Broader minor-version validation as defined by the future release plan.

## Outcome (Fill when done)
- Pending.
