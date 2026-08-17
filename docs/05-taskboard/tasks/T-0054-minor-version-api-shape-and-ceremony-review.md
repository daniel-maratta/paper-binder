# T-0054: Minor-Version API Shape And Ceremony Review

## Status
todo

## Type
maintainability

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
Track and remediate PaperBinder's overall API shape and over-ceremony concerns as a future minor-version engineering-quality task.

## Context
- `T-0049` reviewed API surface and ceremony for the `v1.1.1` patch and intentionally avoided broad application-code changes.
- `T-0050` handled only safe, mechanical maintainability splits that were obviously beneficial inside the patch scope.
- Reviewer feedback called out repeated endpoint ceremony, outcome/failure/problem-mapping records, broad Dapper service responsibilities, frontend shell composition hotspots, transcript-style tests, and names that repeat `PaperBinder` where namespace context already carries it.
- Final hiring-assessment polish confirmed `src/PaperBinder.Web/src/app/root-host.tsx` still concentrates route ownership, public-shell composition, view-state assembly, and auth/redirect flow handling in one seam. Backend maintainability hotspots were split during `v1.1.x` work; a future frontend pass should extract route sections, shell composition, and view-model helpers around stable responsibilities without changing user-facing behavior.
- This work is too broad for a patch. It should be planned as minor-version work so code-shape changes can be reviewed with enough time for security, tenant-isolation, API-contract, and regression validation.

## Acceptance Criteria
- [ ] Re-open the `T-0049` and `T-0050` review artifacts and produce a ranked remediation plan before editing code.
- [ ] Define explicit boundaries for what may be simplified and what must remain explicit for tenant isolation, authorization, CSRF, validation, and problem-response consistency.
- [ ] Reduce repeated ceremony only where the resulting code is easier to review and does not hide tenant/security decisions.
- [ ] Split large services or frontend files only when the split creates stable ownership boundaries, not cosmetic fragmentation.
- [ ] Review outcome/failure/result-mapping type names for responsibility clarity; avoid renames that churn public contracts without reviewer value.
- [ ] Compact overly transcript-like tests only where assertions remain behaviorally precise and security/tenant coverage stays obvious.
- [ ] Update API contract docs, engineering standards, and taskboard records if conventions or public-facing behavior change.
- [ ] Validation passes across affected focused tests plus the future minor-version release gates.

## Dependencies
- Completed `T-0049` API surface and ceremony review.
- Completed `T-0050` maintainability review.
- Completed `T-0052` final hiring assessment review.

## Blocked By
- A future minor-version release plan that pulls this task into scope.

## Review Gates
- Scope Lock: Overall API/code-shape remediation for a minor version; no hidden product expansion.
- Pre-PR Critique: Findings-first review with a proposed split plan before code changes.
- Escalation Notes: Backend, frontend, Docker-backed integration, and browser validation may require elevated execution.

## Current State
- Deferred. Patch-safe cleanup has landed where appropriate; broader API shape, frontend composition, and over-ceremony work remains tracked here.

## Touch Points
- `src/PaperBinder.Api/`
- `src/PaperBinder.Application/`
- `src/PaperBinder.Infrastructure/`
- `src/PaperBinder.Web/src/app/`
- `tests/`
- `docs/40-contracts/`
- `docs/50-engineering/`

## Implementation Plan
- Start with a no-code inventory and proposed commit sequence.
- Separate endpoint ceremony, application contracts, Dapper service size, frontend shell size, and test-shape findings into cohesive slices.
- For each slice, write or adjust focused tests before implementation when behavior could change.
- Land small, reviewable commits with validation evidence after each slice.

## Next Action
- Pull into the next minor-version plan when engineering-quality remediation is in scope.

## Validation Evidence
- Pending.

## Decision Notes
- This is not a mandate to abstract all repetition. Tenant context establishment, authorization checks, CSRF posture, validation, and problem mapping may remain explicit where that improves security review.
- The success criterion is natural, maintainable code shape without losing PaperBinder's deliberate security clarity.

## Validation Plan
- Focused backend/frontend tests for each touched slice.
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release`
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require`
- `powershell -ExecutionPolicy Bypass -File .\scripts\run-browser-e2e.ps1` when browser routing or shell code changes.
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`

## Outcome (Fill when done)
- Pending.
