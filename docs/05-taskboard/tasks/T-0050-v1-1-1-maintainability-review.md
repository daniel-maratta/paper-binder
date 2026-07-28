# T-0050: V1.1.1 Maintainability Review

## Status
queued

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
- `T-0049`'s code-shape review routes the safest mechanical split candidates here: `DocumentContracts.cs`, `BinderContracts.cs`, local Dapper record/mapper extraction from `DapperDocumentService.cs`, and repeated integration-test setup/assertion helpers.

## Acceptance Criteria
- [ ] Maintainability findings are recorded with file references and disposition.
- [ ] Any split is mechanical, behavior-preserving, and local to an obvious hotspot.
- [ ] Public types remain split by responsibility unless a multi-type file has one clear, defensible reason to stay together.
- [ ] Tests/build/docs validation pass for touched areas.

## Dependencies
- [T-0049](./T-0049-v1-1-1-api-surface-and-ceremony-review.md)

## Blocked By
- (none)

## Review Gates
- Scope Lock: Discovery plus only safe mechanical splits if obviously beneficial.
- Pre-PR Critique: Explicitly identify skipped refactors and why they are not patch-safe.
- Escalation Notes: Build/test workflows may require approval.

## Current State
- Queued.

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

## Next Action
- Start after CP3 lands.

## Validation Evidence
- Pending.

## Decision Notes
- No speculative abstraction or broad architectural cleanup in this patch.

## Validation Plan
- Focused tests for touched modules.
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`

## Outcome (Fill when done)
- Pending.
