# T-0050: V1.1.1 Maintainability Review

## Status
done

## Type
risk

## Priority
P2

## Owner
agent

## Created
2026-07-28

## Updated
2026-07-28

## Checkpoint
CP4

## Phase
V1.1.1 patch

## Summary
Review maintainability hotspots and apply only safe mechanical splits when the benefit is obvious and the blast radius is low.

## Context
- Existing engineering-quality records already call out large service, route, and test-file hotspots.
- This patch should not become a broad refactor.
- Mechanical splits are allowed only where they reduce file size or ownership confusion without changing behavior.
- `T-0049`'s code-shape review routes the safest mechanical split candidates here: the pre-`T-0050` aggregate document and binder application contract files, local Dapper record/mapper extraction from `DapperDocumentService.cs`, and repeated integration-test setup/assertion helpers.

## Acceptance Criteria
- [x] Maintainability findings are recorded with file references and disposition.
- [x] Any split is mechanical, behavior-preserving, and local to an obvious hotspot.
- [x] Public types remain split by responsibility unless a multi-type file has one clear, defensible reason to stay together.
- [x] Tests/build/docs validation pass for touched areas.

## Dependencies
- [T-0049](./T-0049-v1-1-1-api-surface-and-ceremony-review.md)

## Blocked By
- (none)

## Review Gates
- Scope Lock: Discovery plus only safe mechanical splits if obviously beneficial.
- Pre-PR Critique: Explicitly identify skipped refactors and why they are not patch-safe.
- Escalation Notes: Build/test workflows may require approval.

## Current State
- Done. Maintainability findings and deferrals are recorded in `docs/archive/v1-1/remediation/engineering-quality/t-0050-maintainability-review.md`; document and binder application contract types were split into responsibility-named files without changing public type names, namespaces, service signatures, endpoint behavior, tenant scoping, authorization, CSRF behavior, or persistence logic.

## Touch Points
- `src/`
- `tests/`
- `docs/archive/v1-1/remediation/engineering-quality/`
- `docs/05-taskboard/`

## Implementation Plan
- Review hotspot records and current file sizes/ownership boundaries.
- Identify any clearly beneficial mechanical split.
- Apply only low-risk splits; otherwise record deferrals.
- Run focused and repo-level validation as appropriate.

## Skill-TDD Posture
- This checkpoint is limited to behavior-preserving maintainability work.
- No behavior-changing RED slice is planned unless discovery finds a real defect.
- Mechanical split validation is `REFACTOR -> BUILD/TEST`: keep public type names and namespaces stable, compile immediately after splits, and run docs validation after reference propagation.

## Next Action
- Pull `T-0051` for README provenance cleanup and the About page flagship-article link.

## Validation Evidence
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release` - passed on 2026-07-28 with 0 warnings and 0 errors.
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Skip` - passed on 2026-07-28: frontend component tests 64/64, unit tests 142/142, non-Docker integration tests 33/33. Docker-backed integration tests were explicitly skipped because the change was a mechanical application contract file split with no persistence, SQL, tenant predicate, endpoint, authorization, CSRF, or runtime behavior changes.
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1` - passed on 2026-07-28.

## Decision Notes
- No speculative abstraction or broad architectural cleanup in this patch.

## Validation Plan
- Focused tests for touched modules.
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`

## Outcome (Fill when done)
- Done on 2026-07-28. Split aggregate document and binder application contract files by responsibility, recorded maintainability findings and patch-scope deferrals, and preserved the public application surface and security-sensitive runtime behavior.
