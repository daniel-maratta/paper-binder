# T-0034: V1.1 API And Backend Carry-Forwards

## Status
active

## Type
feature

## Priority
P1

## Owner
agent

## Created
2026-07-15

## Updated
2026-07-15

## Checkpoint
Cross-checkpoint

## Phase
Post-Phase 4.1

## Summary
Complete the API and backend carry-forward work surfaced by the `v1.1` authenticated UI so server-authoritative lifecycle, admin-safety, password-generation, and cleanup behavior match the upgraded product surfaces.

## Context
- `T-0033` completed the presentation and authenticated-surface tranche, which exposed several backend seams that should not remain UI-only expectations.
- The temp UI backlog explicitly says the repo should now be at the API/backend carry-forward point.
- Tenant isolation, tenant-host lifecycle safety, and admin-authoritative behavior remain non-negotiable.

## Acceptance Criteria
- [x] Binder rename exists as a tenant-scoped, server-authoritative endpoint and supporting application/infrastructure slice.
- [x] Binder delete exists as a tenant-scoped, server-authoritative endpoint and supporting application/infrastructure slice.
- [x] Tenant-user delete exists with last-admin and owner-safety rules that keep the API authoritative.
- [x] Admin authority over binders cannot be removed accidentally through binder-policy or role-selection mistakes.
- [x] Document-title uniqueness is enforced in the backend contract when the product rule remains "unique within a binder unless superseding the same-title predecessor."
- [x] Any in-scope `v1.1.x` document edit or supersede follow-on operations are either implemented or explicitly ruled out in canon/taskboard docs before work starts.
- [x] Generated tenant-user passwords come from the server, not from client-side generation logic.
- [ ] Cleanup validation proves that active-lease tenants are never purged early and that the cleanup path still respects the intended expiry timing.
- [ ] Targeted automated coverage exists for every behavior-changing slice landed under this task.

## Dependencies
- [T-0033](./T-0033-phase-4-1-v1-1-presentation-realignment.md)
- `docs/40-contracts/api-contract.md`
- `docs/10-product/prd.md`
- `docs/10-product/user-stories.md`

## Blocked By
- (none)

## Review Gates
- Scope Lock: Stay inside existing PaperBinder product truth and server-authoritative lifecycle behavior. Do not widen into unsupported collaboration, document-versioning, or non-`v1` product scope.
- Pre-PR Critique: Review at least one touched endpoint seam, one service seam, one persistence seam, and one integration test file for naming precision, tenant scoping, and policy-authoritative behavior.
- Escalation Notes: If document edit or supersede operations prove out of scope for `v1.1.x`, close that decision explicitly in canon/taskboard docs instead of leaving a vague placeholder.

## Current State
- Active. Binder rename, binder delete, tenant-user delete, the binder admin-authority safeguard, document-title uniqueness, and server-generated tenant-user passwords are complete on this branch. The document follow-through decision is now closed: `v1.1.x` keeps read-only document detail plus `POST /api/documents` with optional same-binder `SupersedesDocumentId`, and does not add edit, replace, `PUT`, `PATCH`, or dedicated supersede endpoints. The remaining backend carry-forward is cleanup validation.

## Touch Points
- `src/PaperBinder.Api/`
- `src/PaperBinder.Application/`
- `src/PaperBinder.Infrastructure/`
- `tests/PaperBinder.IntegrationTests/`
- `docs/40-contracts/api-contract.md`
- `docs/10-product/prd.md`
- `docs/10-product/user-stories.md`

## Implementation Plan
- Use vertical-slice TDD for each behavior change.
- Prefer one cohesive sub-slice at a time:
  1. binder rename
  2. binder delete
  3. tenant-user delete
  4. admin-manageability safeguard
  5. document-title uniqueness contract
  6. password-generation authority
  7. cleanup-timing validation
- Reconcile contracts and docs in the same change set as each behavior slice.

## Next Action
- Finish cleanup validation for active-lease safety and intended expiry timing.

## Validation Plan
- Targeted `dotnet test` runs for each new integration slice
- Canonical backend validation through `scripts/test.ps1 -Configuration Release -DockerIntegrationMode Require`
- `scripts/validate-docs.ps1` after contract/taskboard updates

## Outcome (Fill when done)
- In progress. Seven backend carry-forward decisions/slices are complete; remaining work is limited to cleanup-validation follow-through.

## Notes
Keep task docs stable. Put iterative discoveries in `../task-log/`.
Use the taskboard when execution state must persist across checkpoints, PRs, or sessions.
