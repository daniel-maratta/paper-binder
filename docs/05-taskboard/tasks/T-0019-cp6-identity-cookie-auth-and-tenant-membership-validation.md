# T-0019: CP6 Identity, Cookie Auth, And Tenant Membership Validation

## Status
done

## Type
feature

## Priority
P0

## Owner
agent

## Created
2026-04-04

## Updated
2026-04-04

## Checkpoint
CP6

## Phase
Phase 2

## Summary
Implement the CP6 auth boundary: ASP.NET Core Identity with Dapper-backed runtime stores, parent-domain cookie auth, CSRF protection for authenticated unsafe API routes, root-host login, tenant-host logout, and membership-plus-expiry validation before tenant context is materialized for authenticated tenant-host requests.

## Context
- CP6 is the first checkpoint where authenticated user context becomes real and starts participating in tenant resolution.
- ADR-0007 still forbids EF Core runtime data access, so Identity integration must use Dapper-backed stores and keep Identity types out of application/domain code.
- CP6 intentionally stops short of challenge verification, rate limiting, provisioning, and named policy mapping; those remain CP7 and CP8 work.

## Acceptance Criteria
- [x] ASP.NET Core Identity managers are wired with Dapper-backed runtime stores and explicit password hashing strategy
- [x] `users` and `user_tenants` schema is added with one-membership-per-user enforced in the database
- [x] Root-host login and tenant-host logout issue and clear the auth/CSRF cookies with the documented host restrictions
- [x] Authenticated tenant-host requests require matching membership and active tenant state before tenant context is established
- [x] Unit and integration coverage prove login, logout, CSRF rejection, wrong-tenant denial, expired-tenant denial, and tenant-host health regression behavior
- [x] Canonical docs, taskboard, ADR, and CP6 PR artifact are synchronized in the same change set
- [x] Validation evidence is captured for build, tests, and docs validation

## Dependencies
- [T-0018](./T-0018-cp5-tenancy-resolution-and-immutable-tenant-context.md)

## Blocked By
- (none)

## Review Gates
- Scope Lock: Locked to CP6 only: Identity integration, cookie auth, CSRF, login/logout flow, membership/expiry validation, tests, and synchronized docs/delivery artifacts.
- Pre-PR Critique: Addressed before implementation start. Key design constraints locked in: keep `TenantContext` narrow, use a resolved-tenant lookup type with expiry, enforce one membership per user with a DB unique constraint, keep health endpoints anonymous on tenant hosts, and use explicit `PAPERBINDER_PUBLIC_ROOT_URL` instead of raw request scheme for redirect construction.
- Escalation Notes: Restore, Release build, and the full Release test suite required escalation because sandboxing blocked NuGet access and Docker-backed integration execution.

## Current State
- Completed and validated on the current branch. The checkpoint remains active at the ledger level pending PR/merge, but the scoped CP6 task work is done.

## Touch Points
- `src/PaperBinder.Api`
- `src/PaperBinder.Application`
- `src/PaperBinder.Infrastructure`
- `src/PaperBinder.Migrations`
- `src/PaperBinder.Web`
- `tests/PaperBinder.UnitTests`
- `tests/PaperBinder.IntegrationTests`
- `docs/20-architecture`
- `docs/30-security`
- `docs/40-contracts`
- `docs/55-execution`
- `docs/70-operations`
- `docs/80-testing`
- `docs/90-adr`
- `docs/95-delivery/pr`

## Next Action
- Use the CP6 PR artifact for reviewer handoff and keep the checkpoint active until merge.

## Validation Evidence
- `powershell -ExecutionPolicy Bypass -File .\scripts\restore.ps1` (passed with escalation)
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release` (passed)
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require` (passed: 44/44 unit tests, 23/23 non-Docker integration tests, 17/17 Docker-backed integration tests)
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1` (passed)

## Decision Notes
- `PAPERBINDER_PUBLIC_ROOT_URL` is the canonical redirect origin and must match the configured auth-cookie base domain.
- `TenantContext` remains a narrow tenant-identity record; expiry lives on the resolved-tenant host lookup result used before context establishment.
- ASP.NET Core Identity roles are not introduced in CP6; tenant roles remain authoritative in `user_tenants`.

## Validation Plan
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release`
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`

## Outcome (Fill when done)
- Added ASP.NET Core Identity managers with Dapper-backed runtime stores, the `users` and `user_tenants` schema, parent-domain cookie auth, and CSRF protection for authenticated unsafe API routes.
- Added root-host login, tenant-host logout, and tenant membership/expiry validation so authenticated tenant context is established only after the security boundary passes.
- Added unit and integration coverage for redirect construction, authenticated-user parsing, CSRF validation, login/logout, missing membership, wrong-tenant denial, expired-tenant denial, and tenant-host health behavior.
- Added ADR-0008 plus synchronized architecture, security, contract, operations, testing, taskboard, checkpoint, and delivery-doc updates to describe the shipped CP6 behavior and the explicit CP7 deferrals.

## Notes
Keep task docs stable. Put iterative discoveries in `../task-log/`.
Use the taskboard when execution state must persist across checkpoints, PRs, or sessions.
