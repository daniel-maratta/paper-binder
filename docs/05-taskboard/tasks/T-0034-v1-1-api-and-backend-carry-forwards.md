# T-0034: V1.1 API And Backend Carry-Forwards

## Status
done

## Type
feature

## Priority
P1

## Owner
agent

## Created
2026-07-15

## Updated
2026-07-17

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
- [x] Cleanup validation proves that active-lease tenants are never purged early and that the cleanup path still respects the intended expiry timing.
- [x] Targeted automated coverage exists for every behavior-changing slice landed under this task.

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
- Historical slice outcome: the `v1.1` backend carry-forwards landed and were validated before merge.
- Server-authoritative lifecycle endpoints, binder-policy admin-safety rules, backend document-title uniqueness, server-issued shown-once credentials, and lease-cleanup retention validation are now part of current repo truth.
- The remaining `v1.1` execution lane is `T-0037` final validation and close-out.

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
  6. password-generation authority and cleanup-timing validation
- Reconcile contracts and docs in the same change set as each behavior slice.

## Next Action
- Closed. Use `T-0037` for the remaining `v1.1` validation, audit, warning-review, and close-out work.

## Validation Plan
- Targeted `dotnet test` runs for each new integration slice
- Canonical backend validation through `scripts/test.ps1 -Configuration Release -DockerIntegrationMode Require`
- `scripts/validate-docs.ps1` after contract/taskboard updates

## Outcome (Fill when done)
- Complete. The authenticated-surface backend carry-forwards landed: tenant-scoped binder rename/delete, tenant-user delete, admin-manageability safeguards for binder policy state, and backend-authoritative document-title uniqueness.
- Complete. Tenant-user workspace passwords are now generated server-side and only disclosed as shown-once handoff values after the server creates the user.
- Complete. Integration coverage now proves active-lease tenants are not purged early, retained-expiry tenants remain in the `410` window until the intended cleanup threshold, and recent-activity retention still protects already-provisioned PaperBinder tenants.
- Complete. The slice was validated through the merged backend/frontend/integration change sets, including Docker-backed integration coverage and the broader release validation bundle that accompanied closure.

## Notes
Keep task docs stable. Put iterative discoveries in `../task-log/`.
Use the taskboard when execution state must persist across checkpoints, PRs, or sessions.
