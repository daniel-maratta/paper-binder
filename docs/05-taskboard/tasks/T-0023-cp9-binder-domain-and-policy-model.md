# T-0023: CP9 Binder Domain And Policy Model

## Status
done

## Type
feature

## Priority
P0

## Owner
agent

## Created
2026-04-07

## Updated
2026-04-08

## Checkpoint
CP9

## Phase
Phase 3

## Summary
Implement CP9 so binders become the first tenant-scoped product entity, binder policy can narrow same-tenant access without weakening API-boundary authorization, and the repo ships synchronized schema, endpoints, tests, and canonical docs.

## Context
- CP8 shipped endpoint policy infrastructure, request-scoped tenant membership context, and tenant-host route gating.
- CP9 must stay within binder domain and policy scope only; document persistence, lease lifecycle, and frontend binder UI remain deferred.
- Locked design decisions require list omission semantics for disallowed restricted binders, non-unique binder names within a tenant, explicit `documents: []` on binder detail, and no durable audit-table expansion.

## Acceptance Criteria
- [x] `docs/40-contracts/api-contract.md` documents binder request/response examples, failure semantics, and stable binder `errorCode` values before endpoint behavior is considered complete
- [x] Binder schema and migration add `binders` plus tenant-scoped `binder_policies` with composite `(tenant_id, binder_id)` enforcement
- [x] `GET /api/binders`, `POST /api/binders`, `GET /api/binders/{binderId}`, `GET /api/binders/{binderId}/policy`, and `PUT /api/binders/{binderId}/policy` are live behind existing tenant-host/auth/CSRF boundaries
- [x] Binder list omission semantics for `restricted_roles` are enforced in SQL by construction
- [x] Binder detail returns an explicit empty `documents` collection until CP10
- [x] Binder-policy reads and writes use concrete `mode` + `allowedRoles` semantics and stable ProblemDetails mappings
- [x] Unit and Docker-backed integration coverage prove binder allow/deny, cross-tenant `404`, wrong-host `404`, CSRF enforcement, idempotent policy updates, and protocol headers
- [x] Canonical product, architecture, contracts, testing docs, taskboard, repo navigation, and delivery artifacts are updated in the same change set
- [x] Manual VS Code and Visual Studio launch verification is recorded in the CP9 PR artifact before checkpoint closeout

## Dependencies
- [T-0022](./T-0022-cp8-authorization-policies-and-tenant-user-administration.md)

## Blocked By
- (none)

## Review Gates
- Scope Lock: Locked to binder schema, binder endpoints, binder-policy model, Dapper persistence, tests, and synchronized docs only. No CP10+ document, lease, worker, or frontend pull-forward.
- Pre-PR Critique: Addressed before implementation start. Key constraints locked in: contract-first binder docs, list omission semantics, non-unique binder names, explicit empty `documents` collection, structured security logging without audit-table expansion, and composite `(tenant_id, binder_id)` FK enforcement.
- Post-Implementation Critique: Completed on `2026-04-08` with no blockers and no required code changes. The only deferred follow-up is a full endpoint round-trip test for `400 BINDER_NAME_INVALID`; CP9 keeps that deferred because binder-name normalization and ProblemDetails mapping already have unit coverage and the other binder validation paths already have Docker-backed integration coverage.
- Escalation Notes: Docker-backed CP9 integration verification required unsandboxed execution because the sandbox could not access the local Docker engine pipe.

## Current State
- `CP9` is implemented, validated, and manually verified on the current branch.
- Post-implementation critic review completed on `2026-04-08` with no blockers and no required code changes.
- Manual VS Code and Visual Studio launch verification is now recorded in the PR artifact, so the task is ready to close as `done`.

## Touch Points
- `src/PaperBinder.Api`
- `src/PaperBinder.Application`
- `src/PaperBinder.Infrastructure`
- `src/PaperBinder.Migrations`
- `tests/PaperBinder.UnitTests`
- `tests/PaperBinder.IntegrationTests`
- `docs/10-product`
- `docs/15-feature-definition`
- `docs/20-architecture`
- `docs/40-contracts`
- `docs/50-engineering`
- `docs/80-testing`
- `docs/95-delivery/pr`

## Next Action
- None for `CP9`. Next planned checkpoint is `CP10`.

## Validation Evidence
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release` passed
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require` passed
  - unit suite: 81 passed, 0 failed
  - non-Docker integration suite: 25 passed, 0 failed
  - Docker-backed integration suite: 50 passed, 0 failed
- `dotnet test tests/PaperBinder.UnitTests/PaperBinder.UnitTests.csproj -c Release --no-build --filter FullyQualifiedName~BinderDomainAndPolicyModelTests --logger "console;verbosity=minimal"` passed
  - 15 passed, 0 failed
- `dotnet test tests/PaperBinder.IntegrationTests/PaperBinder.IntegrationTests.csproj -c Release --no-build --filter FullyQualifiedName~BinderDomainAndPolicyModelIntegrationTests --logger "console;verbosity=minimal"` passed
  - 11 passed, 0 failed
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1` passed
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-launch-profiles.ps1` passed
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1` re-run after post-implementation closeout-artifact updates passed
- Manual verification recorded in the CP9 PR artifact on `2026-04-08`
  - VS Code launch passed
  - Visual Studio launch passed

## Decision Notes
- Binder names are not unique within a tenant in CP9.
- Binder detail returns `documents: []` until CP10; CP9 does not add document tables or summary queries.
- Binder-local `restricted_roles` is an exact-role allow-list layered after endpoint authorization, not a second hierarchy.
- Binder list omission semantics are enforced in SQL, not via broad reads plus in-memory filtering.
- Binder-policy writes emit structured security logs with `tenant_id`, `user_id`, and `event_name`; no new audit table is introduced in CP9.
- Post-implementation critic review found no blockers. The low-risk binder-name `400` endpoint round-trip test remains deferred until a future binder-touching checkpoint because current unit coverage already proves the validation and ProblemDetails mapping path.

## Validation Plan
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release`
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-launch-profiles.ps1`
- manual VS Code and Visual Studio launch verification recorded in the PR artifact before checkpoint closure

## Outcome
- CP9 adds tenant-scoped binder storage, binder-policy storage, Dapper-backed binder services, and binder endpoints while preserving the existing tenant-host/auth/CSRF/request-context boundary.
- CP9 ships stable binder ProblemDetails contracts, binder-specific error codes, SQL-enforced list omission semantics, and an explicit empty binder-detail `documents` collection until CP10.
- CP9 adds unit and Docker-backed integration coverage for binder success and denial paths and synchronizes the canonical docs, taskboard, repo navigation, and delivery artifacts in the same change set.
- CP9 closeout now includes recorded manual VS Code and Visual Studio launch verification, satisfying the remaining checkpoint closure requirement.

## Notes
Keep task docs stable. Put iterative discoveries in `../task-log/`.
Use the taskboard when execution state must persist across checkpoints, PRs, or sessions.
