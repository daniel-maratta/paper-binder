# T-0049: V1.1.1 API Surface And Ceremony Review

## Status
done

## Type
risk

## Priority
P1

## Owner
agent

## Created
2026-07-28

## Updated
2026-07-28

## Checkpoint
CP3

## Phase
V1.1.1 patch

## Summary
Review repeated API endpoint, service, and result-mapping ceremony; land only very small cleanup where it improves clarity without weakening security or contract behavior.

## Context
- This follows the post-RC2 hireability review note that repeated endpoint/service/result-mapping patterns may contain small reducible ceremony.
- Tenant isolation, authorization, CSRF, validation, and problem-response consistency are non-negotiable.
- This task is discovery plus tiny cleanup, not a broad API framework rewrite.
- Additional reviewer feedback received on 2026-07-28 identified over-ceremonial, generated-looking code shape as a hiring-artifact risk: repeated outcome/failure/problem-mapping names, endpoint boilerplate, large Dapper services, long frontend route/shell files, transcript-style integration tests, and over-explanatory product/docs language.

## Acceptance Criteria
- [x] API surface review findings are recorded with file references and disposition.
- [x] Any cleanup is tiny, cohesive, and demonstrably behavior-preserving. No application-code cleanup was applied because the safe candidates cross multiple endpoint/security seams and belong in a deliberate follow-up.
- [x] No endpoint semantics, authorization policy, tenant scoping, CSRF behavior, or public API contract changes without explicit task/owner approval.
- [x] Focused backend tests and docs validation pass. No backend tests were required because no application code changed; docs validation passed.

## Dependencies
- [T-0047](./T-0047-v1-1-1-release-validation-generalization.md)
- [T-0048](./T-0048-v1-1-1-compose-configuration-noise-cleanup.md)

## Blocked By
- (none)

## Review Gates
- Scope Lock: Discovery plus only very small cleanup.
- Pre-PR Critique: Findings-first review; reject cleanup that adds indirection without clear value.
- Escalation Notes: Backend test workflows may require approval.

## Current State
- Done. Code-shape findings and patch-safe remediation plan are recorded in `docs/archive/v1-1/remediation/engineering-quality/t-0049-api-surface-code-shape-review.md`; no application-code cleanup was applied inside `T-0049`.

## Touch Points
- `src/PaperBinder.Api/`
- `src/PaperBinder.Application/`
- `tests/`
- `docs/40-contracts/` only if contract documentation drift is found

## Implementation Plan
- Inventory API endpoint/result-mapping patterns and compare with existing shared helpers.
- Record findings and dispositions.
- Apply tiny behavior-preserving cleanup only where obvious; otherwise record why cleanup is deferred.
- Run focused tests and validation.

## Next Action
- Pull `T-0050` for the maintainability review and evaluate the mechanical split candidates recorded by this task.

## Validation Evidence
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1` - passed on 2026-07-28.
- Backend tests were not run because this task produced a review/remediation-plan artifact and taskboard updates only; no application code, endpoint contract, authorization policy, tenant scoping, CSRF behavior, or problem-response mapping changed.

## Decision Notes
- Preserve reviewer clarity over abstraction.
- The added reviewer feedback is real but cross-cutting. The safe response is a remediation plan plus CP4 handoff, not a broad endpoint abstraction that would hide tenant/security boundaries.
- Endpoint helper consolidation was rejected for `T-0049`: it touches repeated tenant/membership and problem-writing helpers across several endpoint files, so it is not the tiny low-risk cleanup this checkpoint should land.

## Validation Plan
- Focused backend tests for touched endpoints/services when application code changes.
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`

## Outcome (Fill when done)
- Done on 2026-07-28. Recorded the API ceremony/code-shape review and remediation plan without changing application code. The review found valid code-inspection risk in repeated endpoint ceremony, grouped outcome/failure contracts, large Dapper services, large frontend surfaces, transcript-style integration tests, and over-prefixed internal API names. The task keeps explicit security/contract boundaries intact and hands patch-safe mechanical split candidates to `T-0050`.
