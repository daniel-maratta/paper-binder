# T-0035: Tenant-Host Failure Externalization And Trusted Expiry Recovery

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
Implement the trust-aware tenant-host failure policy from `ADR-0014` so public or otherwise untrusted callers learn as little as practical about tenant existence, while trusted authenticated tenant sessions still get explicit expired-workspace recovery.

## Context
- `ADR-0014` now defines the canonical split between public flattening and trusted expired-session clarity.
- The SPA already has a deliberate trusted expired-retained contract, but public tenant-host failure behavior still needs normalization.
- Both API ProblemDetails and non-API HTML fallback behavior must follow the same trust rule.

## Acceptance Criteria
- [ ] Public or otherwise untrusted tenant-host failures no longer over-signal the difference between unknown, forbidden, expired, and purged tenants.
- [ ] Trusted authenticated tenant-member sessions retain explicit expired-workspace recovery behavior.
- [ ] Tenant-host API ProblemDetails and tenant-host HTML fallback pages follow the same public-versus-trusted policy.
- [ ] Internal logs, traces, correlation IDs, and audit usefulness remain specific even when the public-facing behavior is flattened.
- [ ] The SPA’s trusted expired-workspace handling remains deliberate and driven by an explicit machine-readable contract rather than client inference alone.
- [ ] Integration, frontend, and browser coverage prove both the flattened public path and the explicit trusted recovery path.
- [ ] A follow-up topology note is recorded if wildcard DNS/certificate posture still needs later operational review to reduce passive tenant discovery.

## Dependencies
- [T-0033](./T-0033-phase-4-1-v1-1-presentation-realignment.md)
- `docs/90-adr/ADR-0014-tenant-host-failure-externalization-and-trusted-expiry-disclosure.md`
- `docs/20-architecture/tenancy-resolution.md`
- `docs/40-contracts/api-contract.md`

## Blocked By
- (none)

## Review Gates
- Scope Lock: Change only tenant-host failure externalization, trusted expired-session recovery, and their tests/docs. Do not widen this task into unrelated lifecycle endpoints or broad copy cleanup.
- Pre-PR Critique: Review the tenant-resolution seam, one HTML fallback seam, one SPA bootstrap mapping seam, and one integration test seam for security leakage and trust-boundary clarity.
- Escalation Notes: If the current deployment topology leaks materially more tenant-existence signal than the application contract intends, record it as an operations follow-up rather than silently widening this task.

## Current State
- Active. `T-0034` is now closed, the explicit policy remains documented, and this task is the next execution target for the `v1.1` queue.

## Touch Points
- `src/PaperBinder.Api/TenantResolutionMiddleware.cs`
- `src/PaperBinder.Api/PaperBinderProblemDetails.cs`
- `src/PaperBinder.Api/TenantHostFailurePage.cs`
- `src/PaperBinder.Web/src/api/client.ts`
- `src/PaperBinder.Web/src/app/tenant-shell.tsx`
- `tests/PaperBinder.IntegrationTests/`
- `src/PaperBinder.Web/src/app/*.test.tsx`
- `src/PaperBinder.Web/e2e/tenant-host.spec.ts`
- `docs/40-contracts/api-contract.md`

## Implementation Plan
- Use one behavior slice at a time:
  1. public API flattening
  2. public non-API fallback flattening
  3. trusted expired-session recovery confirmation
  4. browser/integration reconciliation
- Keep trusted-session explicitness separate from public concealment so the security boundary remains obvious in code and tests.

## Next Action
- Start with the public API path: add the narrowest failing integration test that proves untrusted tenant-host failures no longer disclose materially different public results.

## Validation Plan
- Targeted integration tests for tenant-host public versus trusted failure behavior
- Focused Vitest runs for tenant-shell bootstrap mapping
- Tenant-host browser flow validation for returning-to-an-expired-workspace behavior
- `scripts/validate-docs.ps1` after contract or ADR-linked docs change

## Outcome (Fill when done)
- Not started.

## Notes
Keep task docs stable. Put iterative discoveries in `../task-log/`.
Use the taskboard when execution state must persist across checkpoints, PRs, or sessions.
