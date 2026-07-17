# T-0035: Tenant-Host Failure Externalization And Trusted Expiry Recovery

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
2026-07-15

## Checkpoint
Cross-checkpoint

## Phase
Post-Phase 4.1

## Summary
Implement the trust-aware tenant-host failure policy from `ADR-0014` so public or otherwise untrusted callers learn as little as practical about tenant existence, while trusted authenticated tenant sessions still get explicit expired-workspace recovery.

## Context
- `ADR-0014` now defines the canonical split between public flattening and trusted expired-session clarity.
- The SPA already has a deliberate trusted expired-retained contract, but public tenant-host failure behavior still needed normalization.
- Both API ProblemDetails and non-API HTML fallback behavior needed to follow the same trust rule.

## Acceptance Criteria
- [x] Public or otherwise untrusted tenant-host failures no longer over-signal the difference between unknown, forbidden, expired, and purged tenants.
- [x] Trusted authenticated tenant-member sessions retain explicit expired-workspace recovery behavior.
- [x] Tenant-host API ProblemDetails and tenant-host HTML fallback pages follow the same public-versus-trusted policy.
- [x] Internal logs, traces, correlation IDs, and audit usefulness remain specific even when the public-facing behavior is flattened.
- [x] The SPA's trusted expired-workspace handling remains deliberate and driven by an explicit machine-readable contract rather than client inference alone.
- [x] Integration, frontend, and browser coverage prove both the flattened public path and the explicit trusted recovery path.
- [x] A follow-up topology note is recorded if wildcard DNS/certificate posture still needs later operational review to reduce passive tenant discovery.

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
- Historical slice outcome: this task originally flattened tenant-host API failures to `404 TENANT_HOST_UNAVAILABLE` for public or otherwise untrusted callers while retaining explicit `410 TENANT_EXPIRED` recovery for trusted same-tenant expired sessions.
- Current repo truth has since been superseded by later tenancy/lease reconciliation work; use the current canonical docs for active behavior, especially `docs/20-architecture/tenancy-resolution.md` and `docs/40-contracts/api-contract.md`.
- Targeted integration, frontend, and browser validation for the trust split completed on `2026-07-15`.

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
- Closed. `T-0036` remains the next queued `v1.1` slice unless the unrelated tenant-host users-route browser-form drift is promoted into its own follow-up.

## Validation Plan
- Targeted integration tests for tenant-host public versus trusted failure behavior
- Focused Vitest runs for tenant-shell bootstrap mapping
- Tenant-host browser flow validation for returning-to-an-expired-workspace behavior
- `scripts/validate-docs.ps1` after contract or ADR-linked docs change

## Outcome (Fill when done)
- Complete. At the time this slice closed, tenant-resolution preserved precise internal denial reasons while externalizing public or otherwise untrusted tenant-host API failures as `404 TENANT_HOST_UNAVAILABLE`.
- Complete. At the time this slice closed, the tenant-host HTML path followed the same trust split: generic unavailable fallback for public or otherwise untrusted callers and explicit expired-workspace recovery only for trusted same-tenant sessions.
- Complete. Targeted coverage passed on `2026-07-15` across Docker-backed integration tests, `tenant-shell` Vitest coverage, and scoped Playwright checks for the trusted-expired and generic-unavailable tenant-host browser states.

## Notes
Keep task docs stable. Put iterative discoveries in `../task-log/`.
Use the taskboard when execution state must persist across checkpoints, PRs, or sessions.
- Wildcard DNS or certificate issuance can still create passive tenant-discovery considerations outside the app response contract. The app-level trust split now flattens tenant-shaped host behavior, but production topology review remains an operations follow-up.
- The broader tenant-host browser spec still contains unrelated pre-existing failures around the users-route temporary-password field label. The two T-0035 browser assertions now pass independently and remain the authoritative validation for this task.
