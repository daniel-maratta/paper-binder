# T-0051: V1.1.1 README Provenance And About Article Link

## Status
queued

## Type
docs

## Priority
P1

## Owner
agent

## Created
2026-07-28

## Updated
2026-07-28

## Checkpoint
CP5

## Phase
V1.1.1 patch

## Summary
Clean up and polish `README.md` provenance/reviewer copy and restore the About-page link to the real flagship article.

## Context
- `README.md` should clearly describe provenance, reviewer entry points, and current published-release state.
- The About page currently has a featured-article slot; the owner says the real flagship article now exists and the previously existing link should be restored.

## Acceptance Criteria
- [ ] `README.md` is polished without adding product scope or stale release claims.
- [ ] Provenance wording remains factual and consistent with `PROJECT_ORIGIN.md`.
- [ ] The About page links to the real flagship article instead of showing a placeholder state.
- [ ] Frontend tests are updated if they currently assert the placeholder state.
- [ ] Docs and focused frontend validation pass.

## Dependencies
- [T-0050](./T-0050-v1-1-1-maintainability-review.md)

## Blocked By
- The exact flagship article URL must be discoverable from repo context or provided by the owner.

## Review Gates
- Scope Lock: README polish and About article link only.
- Pre-PR Critique: Confirm provenance claims are source-backed and not over-marketed.
- Escalation Notes: Frontend tests may require approval.

## Current State
- Queued.

## Touch Points
- `README.md`
- `PROJECT_ORIGIN.md`
- `src/PaperBinder.Web/src/app/root-host.tsx`
- `src/PaperBinder.Web/src/app/root-host.test.tsx`

## Implementation Plan
- Reconcile README wording with `PROJECT_ORIGIN.md` and release docs.
- Find the real flagship article URL from existing repo context or owner-provided source.
- Restore the About-page link and update tests.
- Run focused frontend/docs validation.

## Next Action
- Start after CP4 lands.

## Validation Evidence
- Pending.

## Decision Notes
- If the article URL is not discoverable locally, pause this task for owner input rather than guessing.

## Validation Plan
- Focused frontend tests for root-host About route.
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`

## Outcome (Fill when done)
- Pending.

