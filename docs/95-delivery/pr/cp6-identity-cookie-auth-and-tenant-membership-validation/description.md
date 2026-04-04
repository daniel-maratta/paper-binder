# CP6 PR Description: Identity, Cookie Auth, And Tenant Membership Validation
Status: Review Ready

## Checkpoint
- `CP6`: Identity, Authentication, And Membership Validation
- Task IDs: `T-0019`

## Summary
- Adds ASP.NET Core Identity managers with Dapper-backed runtime stores, plus the `users` and `user_tenants` schema needed for authenticated tenant access.
- Adds root-host login, tenant-host logout, parent-domain cookie auth, and CSRF protection for authenticated unsafe API routes.
- Reworks tenant-host resolution so authenticated tenant context is established only after membership and expiry validation, while known-tenant health routes remain anonymously accessible.
- Updates canonical architecture, security, contracts, testing, taskboard, ADR, and delivery docs so the repo reflects the live CP6 auth boundary and explicitly defers challenge/rate-limit work to CP7.

## Scope Boundaries
- Included:
  - ASP.NET Core Identity integration with Dapper runtime stores
  - parent-domain auth cookie configuration and Data Protection key persistence
  - root-host `POST /api/auth/login`
  - tenant-host `POST /api/auth/logout`
  - CSRF protection for authenticated unsafe `/api/*` routes
  - tenant membership and expiry validation before tenant context establishment
  - unit/integration coverage and synchronized docs/taskboard artifacts
- Not included:
  - challenge verification and root-login rate limiting
  - provisioning endpoint and seeded-demo provisioning flow
  - named authorization policy mapping or tenant-user administration endpoints

## Critic Review
- Scope-lock outcome: Passed before implementation. The CP6 design stayed locked to Identity, cookie auth, CSRF, membership/expiry validation, tests, and synchronized docs.
- Findings summary: Addressed pre-implementation review concerns by keeping `TenantContext` narrow, enforcing one membership per user in the DB, preserving anonymous tenant-host health checks, and using explicit public-root config for redirect construction.
- Unresolved risks or accepted gaps:
  - Root-host challenge verification and rate limiting remain deferred to CP7 by design.
  - The v1 one-membership-per-user simplification is intentional and will need explicit design work if multi-tenant users become in scope later.

## Risks And Rollout Notes
- Config or migration considerations:
  - Adds `users` and `user_tenants` schema via a new EF Core migration.
  - Adds backend runtime config `PAPERBINDER_PUBLIC_ROOT_URL`, which must match the configured parent-domain auth cookie host.
- Security or operational considerations:
  - Authenticated tenant-host requests now fail before feature handlers on missing membership or expired tenant state.
  - Authenticated unsafe `/api/*` routes now require a valid CSRF token.
  - Wrong-host access to host-specific auth endpoints still fails closed with `404`.

## Validation Evidence
- Commands run:
  - `powershell -ExecutionPolicy Bypass -File .\scripts\restore.ps1`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`
- Tests added/updated:
  - `tests/PaperBinder.UnitTests/HttpContractHelperTests.cs`
  - `tests/PaperBinder.IntegrationTests/AuthIntegrationTests.cs`
  - `tests/PaperBinder.IntegrationTests/HealthEndpointIntegrationTests.cs`
  - `tests/PaperBinder.IntegrationTests/TenantResolutionIntegrationTests.cs`
- Manual verification:
  - Confirmed the Release build now regenerates the reviewer-facing SPA placeholder copy with CP6 status and CP7 next-step messaging.
  - Confirmed the Docker-backed CP6 integration suite exercises login, logout, CSRF denial, membership denial, expired-tenant denial, and anonymous tenant-host health behavior against PostgreSQL.

## Follow-Ups
- `CP7` adds challenge verification, root-login rate limiting, and the first real provisioning surface.
