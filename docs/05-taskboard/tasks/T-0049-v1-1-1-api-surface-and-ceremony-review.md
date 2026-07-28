# T-0049: V1.1.1 API Surface And Ceremony Review

## Status
queued

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

## Acceptance Criteria
- [ ] API surface review findings are recorded with file references and disposition.
- [ ] Any cleanup is tiny, cohesive, and demonstrably behavior-preserving.
- [ ] No endpoint semantics, authorization policy, tenant scoping, CSRF behavior, or public API contract changes without explicit task/owner approval.
- [ ] Focused backend tests and docs validation pass.

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
- Queued.

## Touch Points
- `src/PaperBinder.Api/`
- `src/PaperBinder.Application/`
- `tests/`
- `docs/40-contracts/` only if contract documentation drift is found

## Implementation Plan
- Inventory API endpoint/result-mapping patterns and compare with existing shared helpers.
- Record findings and dispositions.
- Apply tiny behavior-preserving cleanup only where obvious.
- Run focused tests and validation.

## Next Action
- Start after CP2 lands.

## Validation Evidence
- Pending.

## Decision Notes
- Preserve reviewer clarity over abstraction.

## Validation Plan
- Focused backend tests for touched endpoints/services.
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`

## Outcome (Fill when done)
- Pending.

