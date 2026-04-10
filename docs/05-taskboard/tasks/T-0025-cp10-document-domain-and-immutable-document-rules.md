# T-0025: CP10 Document Domain And Immutable Document Rules

## Status
done

## Type
feature

## Priority
P0

## Owner
agent

## Created
2026-04-09

## Updated
2026-04-10

## Checkpoint
CP10

## Phase
Phase 3

## Summary
Implement CP10 so tenant-scoped markdown documents can be created, listed, read, archived, and unarchived inside the shipped CP9 binder boundary while document content remains immutable and binder detail returns real document summaries.

## Context
- CP9 shipped binder storage, binder-local policy evaluation, and a placeholder binder-detail `documents` field.
- CP10 must stay bounded to backend/domain/docs/testing work only; no worker, lease, frontend, search, or history-browser pull-forward is allowed.
- Locked design decisions require contract-first document payloads, same-binder supersedes validation, archive visibility defaults, no in-place content mutation, and explicit CSRF coverage on all unsafe document routes.

## Acceptance Criteria
- [x] `docs/40-contracts/api-contract.md` documents document request/response examples, failure semantics, nullable summary/detail fields, and stable document `errorCode` values before endpoint behavior is considered complete
- [x] A migration adds tenant-owned `documents` storage with binder-consistent relationships, same-binder supersedes enforcement, and indexes aligned to the documented runtime query paths
- [x] `GET /api/documents`, `GET /api/documents/{documentId}`, `POST /api/documents`, `POST /api/documents/{documentId}/archive`, and `POST /api/documents/{documentId}/unarchive` are implemented behind existing tenant-host/auth/CSRF boundaries
- [x] Binder detail now returns concrete `DocumentSummary` items in `documents` with archived documents hidden by default
- [x] Document content remains immutable after create; archive/unarchive mutates visibility metadata only
- [x] Same-binder supersedes validation rejects wrong-binder, wrong-tenant, and unknown targets
- [x] Canonical product, architecture, contracts, security, engineering, testing, taskboard, repo navigation, and delivery artifacts are updated in the same change set
- [x] Docker-backed integration validation passes in the current environment
- [x] Manual VS Code and Visual Studio launch verification is recorded in the CP10 PR artifact before checkpoint closeout

## Dependencies
- [T-0023](./T-0023-cp9-binder-domain-and-policy-model.md)

## Blocked By
- (none)

## Review Gates
- Scope Lock: Passed via `docs/95-delivery/pr/cp10-document-domain-and-immutable-document-rules/critic-review.md` on `2026-04-09`; no blocking findings remain.
- Pre-PR Critique: Scope-locked. Contract-first document payloads, same-binder supersedes, archive semantics, CSRF coverage, and markdown strategy boundary are locked.
- Post-Implementation Critique: Completed via `docs/95-delivery/pr/cp10-document-domain-and-immutable-document-rules/critic-review.md` revision 3 on `2026-04-10`; no blockers and no required fixes remain. Non-blocking coverage observations `N1`-`N3` were deferred as low-risk follow-ups because they duplicate already-proven shared code paths or unit-covered validation rules.
- Escalation Notes: Docker-backed CP10 validation required unsandboxed execution because the sandbox cannot access the local Docker engine named pipe.

## Current State
- CP10 implementation is in place across schema, application contracts, Dapper runtime persistence, API endpoints, tests, and canonical docs.
- Binder detail no longer returns the CP9 placeholder-only `documents: []` response when visible documents exist.
- Automated build, unit, non-Docker integration, Docker-backed integration, docs validation, launch-profile validation, and targeted CP10 document validation all passed on `2026-04-09`.
- Post-implementation critic review completed on `2026-04-10` with a ship-ready verdict, no blocking findings, and no required code changes.
- Manual VS Code and Visual Studio launch verification completed on `2026-04-10`; the task is ready to close as `done`.

## Touch Points
- `src/PaperBinder.Api`
- `src/PaperBinder.Application`
- `src/PaperBinder.Infrastructure`
- `src/PaperBinder.Migrations`
- `tests/PaperBinder.UnitTests`
- `tests/PaperBinder.IntegrationTests`
- `docs/10-product`
- `docs/20-architecture`
- `docs/30-security`
- `docs/40-contracts`
- `docs/50-engineering`
- `docs/80-testing`
- `docs/95-delivery/pr`

## Next Action
- None for `CP10`. Next planned checkpoint is `CP11`.

## Validation Evidence
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release` passed
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require` passed
  - unit suite: 102 passed, 0 failed
  - non-Docker integration suite: 25 passed, 0 failed
  - Docker-backed integration suite: 64 passed, 0 failed
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1` passed
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1` re-run after closeout and critic-review artifact updates passed
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-launch-profiles.ps1` passed
- Manual verification recorded in the CP10 PR artifact on `2026-04-10`
  - VS Code launch passed
  - Visual Studio launch passed
- `dotnet test tests/PaperBinder.UnitTests/PaperBinder.UnitTests.csproj -c Release --no-build --filter FullyQualifiedName~DocumentDomainAndImmutableDocumentRulesTests --logger "console;verbosity=minimal"` passed
  - 21 passed, 0 failed
- `dotnet test tests/PaperBinder.IntegrationTests/PaperBinder.IntegrationTests.csproj -c Release --no-build --no-restore --filter FullyQualifiedName~DocumentDomainAndImmutableDocumentRulesIntegrationTests --logger "console;verbosity=minimal"` passed
  - 14 passed, 0 failed

## Decision Notes
- CP10 keeps the existing `BinderRead` / `BinderWrite` policy names and binder-local exact-role policy semantics from CP8/CP9.
- Unfiltered document list requests omit inaccessible restricted binders in SQL; explicit binder-filter list requests return `403 BINDER_POLICY_DENIED` for same-tenant policy denial.
- The markdown strategy boundary stays conservative in CP10: raw markdown is stored, rendered HTML is not persisted, and the centralized renderer currently HTML-encodes content instead of introducing a new markdown-parser dependency.
- Post-implementation critic findings `N1`-`N3` are deferred, not blockers:
  - archive/unarchive binder-policy denial lacks a dedicated end-to-end test, but the same `GetDocumentAccessStateAsync` deny path is already exercised by document detail and write denial integration coverage
  - binder-filtered list success lacks a dedicated end-to-end test, but binder detail already exercises the shared binder-scoped list SQL after access is granted
  - overlength title rejection lacks an integration-case assertion, but the rule itself is covered directly at unit level and the invalid-payload integration test already proves the endpoint validation path

## Validation Plan
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release`
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-launch-profiles.ps1`
- manual VS Code and Visual Studio launch verification recorded in the PR artifact before checkpoint closure

## Outcome
- CP10 adds tenant-scoped document storage, Dapper-backed document services, document endpoints, stable ProblemDetails mappings, and binder-detail summary population without reopening the tenant or authorization design.
- CP10 ships immutable document rules, same-binder supersedes validation, archive visibility semantics, and a centralized markdown rendering/sanitization boundary without adding edit/history/frontend scope.
- CP10 closeout is complete: automated validation, post-implementation critic review, launch-profile validation, and manual VS Code plus Visual Studio verification are all recorded as passing.

## Notes
Keep task docs stable. Put iterative discoveries in `../task-log/`.
Use the taskboard when execution state must persist across checkpoints, PRs, or sessions.
