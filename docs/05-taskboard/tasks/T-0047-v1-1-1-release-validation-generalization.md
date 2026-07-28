# T-0047: V1.1.1 Release Validation Generalization

## Status
queued

## Type
debt

## Priority
P1

## Owner
agent

## Created
2026-07-28

## Updated
2026-07-28

## Checkpoint
CP2

## Phase
V1.1.1 patch

## Summary
Generalize release-document validation so future release cycles do not depend on a hard-coded archived CP17 artifact path or heading shape.

## Context
- `scripts/validate-docs.ps1` currently validates release-artifact structure through a `V1` CP17-specific assumption.
- The current behavior passed for `v1.1.0`, but it is noisy and brittle for later patch releases.

## Acceptance Criteria
- [ ] Release validation no longer requires a permanently pinned `docs/archive/v1/checkpoints/pr/cp17-release-preparation-and-reviewer-snapshot/description.md` gate for non-CP17 release cycles.
- [ ] The generalized check still validates the current release checklist/workflow artifacts.
- [ ] Historical CP17 links remain valid and are preserved as historical evidence.
- [ ] Docs and focused script validation pass.

## Dependencies
- [T-0046](./T-0046-v1-1-1-patch-planning-and-taskboard-alignment.md)

## Blocked By
- (none)

## Review Gates
- Scope Lock: Validation generalization only; no release workflow redesign.
- Pre-PR Critique: Confirm the replacement gate checks real current release artifacts, not a weaker no-op.
- Escalation Notes: Validation scripts may require elevated execution if sandbox friction appears.

## Current State
- Queued.

## Touch Points
- `scripts/validate-docs.ps1`
- `docs/95-delivery/release-checklist.md`
- `docs/95-delivery/release-workflow.md`
- related tests/docs only if needed

## Implementation Plan
- Identify the exact CP17-specific assertion in `Assert-ReleaseChecklistStructure`.
- Replace it with a release-current check grounded in the active release checklist/workflow.
- Preserve historical CP17 validation only where it is explicitly historical.
- Run focused validation and docs validation.

## Next Action
- Pull after CP1 and inspect `Assert-ReleaseChecklistStructure`.

## Validation Evidence
- Pending.

## Decision Notes
- This task should improve future patch-release maintainability without weakening documentation integrity.

## Validation Plan
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`
- Focused script/parser checks as needed.

## Outcome (Fill when done)
- Pending.

