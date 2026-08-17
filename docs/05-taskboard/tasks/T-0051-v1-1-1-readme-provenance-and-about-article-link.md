# T-0051: V1.1.1 README Provenance And About Article Link

## Status
done

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
- Owner clarification on 2026-07-28: the flagship article should be hosted by PaperBinder itself, with sample PaperBinder article content in this checkpoint until final article copy is provided.

## Acceptance Criteria
- [x] `README.md` is polished without adding product scope or stale release claims.
- [x] Provenance wording remains factual and consistent with `PROJECT_ORIGIN.md`.
- [x] The About page links to the hosted flagship article instead of showing a placeholder state.
- [x] Frontend tests are updated if they currently assert the placeholder state.
- [x] Docs and focused frontend validation pass.

## Dependencies
- [T-0050](./T-0050-v1-1-1-maintainability-review.md)

## Blocked By
- (none)

## Review Gates
- Scope Lock: README polish and About article link only.
- Pre-PR Critique: Confirm provenance claims are source-backed and not over-marketed.
- Escalation Notes: Frontend tests may require approval.

## Current State
- Done. README provenance wording now matches `PROJECT_ORIGIN.md`, and the About page links to the PaperBinder-hosted flagship article route.

## Touch Points
- `README.md`
- `PROJECT_ORIGIN.md`
- `docs/10-product/information-architecture.md`
- `docs/20-architecture/frontend-app-route-map.md`
- `docs/20-architecture/frontend-spa.md`
- `docs/50-engineering/frontend-standards.md`
- `src/PaperBinder.Web/src/app/root-host.tsx`
- `src/PaperBinder.Web/src/app/root-host.test.tsx`

## Implementation Plan
- Reconcile README wording with `PROJECT_ORIGIN.md` and release docs.
- Host a PaperBinder flagship article route with sample content.
- Restore the About-page link to the hosted article and update tests.
- Run focused frontend/docs validation.

## Next Action
- Pull `T-0052` for final validation and hiring assessment review.

## Validation Evidence
- RED: `powershell -ExecutionPolicy Bypass -File .\scripts\test-frontend.ps1 -TestPath src/app/root-host.test.tsx` failed on 2026-07-28 before implementation because the About card still rendered `Coming Soon` and the article route fell through to not-found.
- GREEN: `powershell -ExecutionPolicy Bypass -File .\scripts\test-frontend.ps1 -TestPath src/app/root-host.test.tsx` passed on 2026-07-28 after implementation: 16/16 tests.
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release` - passed on 2026-07-28 with 0 warnings and 0 errors.
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1` - passed on 2026-07-28.

## Decision Notes
- Canonical author-site references must point to `https://danielmaratta.com`.
- The flagship article route is hosted on PaperBinder at `/articles/building-paperbinder-production-shaped-saas-demo`.

## Validation Plan
- Focused frontend tests for root-host About route.
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`

## Outcome (Fill when done)
- Done on 2026-07-28. Polished README provenance/status wording, aligned `PROJECT_ORIGIN.md`, added a PaperBinder-hosted flagship article route with sample article content, linked the About page article card to it, updated focused frontend tests, and propagated the new public route through current route/IA docs.
