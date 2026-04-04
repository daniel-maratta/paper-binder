# CP5 PR Description: Tenancy Resolution And Immutable Tenant Context
Status: Review Ready

## Checkpoint
- `CP5`: Tenancy Resolution And Immutable Tenant Context
- Task IDs: `T-0018`

## Summary
- Adds host-derived tenant resolution to `PaperBinder.Api`, backed by Dapper tenant lookup and immutable request-scoped tenant context.
- Rejects invalid tenant hosts and unknown tenant hosts before tenant-scoped handling runs, while preserving loopback system-context behavior for local/debug execution.
- Adds unit and integration coverage for host parsing, request-context immutability, spoofed tenant hints, invalid hosts, and unknown tenants.
- Updates canonical tenancy, security, API-contract, testing, taskboard, and checkpoint-delivery artifacts so the repo describes the shipped CP5 boundary instead of an aspirational one.

## Scope Boundaries
- Included:
  - root-host and single-label tenant-host parsing/validation
  - Dapper-backed tenant lookup by slug
  - immutable request-scoped tenant context establishment
  - API ProblemDetails failures for invalid/unknown tenant hosts
  - reviewer-visible frontend placeholder refresh for CP5 status
  - unit/integration coverage and synchronized docs/taskboard artifacts
- Not included:
  - authentication, membership validation, or tenant-expiry enforcement from CP6 and later checkpoints
  - tenant-scoped domain endpoints such as lease, binders, documents, or user management
  - new public diagnostic endpoints; tenant-context probing remains test-host-only

## Critic Review
- Scope-lock outcome: Passed. The implementation stays inside CP5 boundaries: tenant host parsing, immutable request context, rejection behavior, tests, and synchronized docs.
- Findings summary: No blocker findings remained after Release build validation, the full Release test suite, and docs validation passed.
- Unresolved risks or accepted gaps:
  - Loopback hosts remain system-context only in Development/Test so local focused debugging continues to work; production host validation still depends on the configured public base domain.
  - Membership and expiry enforcement are intentionally deferred to later checkpoints, so CP5 establishes the host boundary but not the full post-auth authorization chain.

## Risks And Rollout Notes
- Config or migration considerations:
  - No schema changes or migrations were introduced.
  - No new backend config key was added; CP5 derives the trusted root/tenant base domain from the configured auth-cookie domain.
- Security or operational considerations:
  - Request host validation now rejects hosts outside the configured PaperBinder root/tenant pattern before tenant-scoped execution.
  - Unknown tenant hosts now fail closed even if the client supplies query-string or header tenant hints.
  - API-route host failures still preserve the CP4 protocol baseline: ProblemDetails, `X-Api-Version`, and `X-Correlation-Id`.

## Validation Evidence
- Commands run:
  - `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`
- Tests added/updated:
  - `tests/PaperBinder.UnitTests/TenantHostResolutionTests.cs`
  - `tests/PaperBinder.IntegrationTests/TenantResolutionIntegrationTests.cs`
  - `tests/PaperBinder.IntegrationTests/PaperBinderApplicationHost.cs`
- Manual verification:
  - Confirmed the Release build now regenerates reviewer-facing SPA assets with CP5 copy.
  - Confirmed API-route invalid/unknown host failures preserve the version/correlation header contract.
  - Confirmed Docker-backed integration coverage exercises real tenant lookup against PostgreSQL.

## Follow-Ups
- `CP6` is next: layer authenticated user identity and tenant membership validation onto the same host-derived request boundary.
