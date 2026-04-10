# CP10 PR Description: Document Domain And Immutable Document Rules
Status: Review Ready

## Checkpoint
- `CP10`: Document Domain And Immutable Document Rules
- Task IDs: `T-0025`

## Summary
- Adds tenant-scoped `documents` schema, migration metadata, and Dapper-backed document services so markdown documents can be created, listed, read, archived, and unarchived inside the existing CP9 binder boundary.
- Adds `GET /api/documents`, `GET /api/documents/{documentId}`, `POST /api/documents`, `POST /api/documents/{documentId}/archive`, and `POST /api/documents/{documentId}/unarchive` with stable document ProblemDetails contracts, same-binder supersedes validation, archive visibility semantics, and CSRF enforcement on all unsafe document routes.
- Updates binder detail so `GET /api/binders/{binderId}` now returns concrete `DocumentSummary` items in `documents` instead of the CP9 placeholder-only payload.
- Synchronizes canonical product, architecture, security, contracts, engineering, testing, taskboard, repo navigation, and delivery docs with the shipped CP10 behavior.

## Scope Boundaries
- Included:
  - document schema, migration, runtime Dapper persistence, and tenant-scoped indexes
  - document create/list/detail/archive/unarchive endpoints
  - stable document ProblemDetails mappings and document-specific `errorCode` values
  - same-binder supersedes validation and immutable archive-transition rules
  - binder-detail document-summary population
  - unit tests plus Docker-backed document integration coverage
  - synchronized checkpoint, taskboard, repo navigation, and PR artifacts
- Not included:
  - document edit endpoints, version-history browsing, restore flows, or diff views
  - frontend document routes, forms, rendering UI, or E2E browser work
  - lease endpoints, worker cleanup, or tenant lifecycle changes
  - search indexing, file uploads, blob storage, or raw HTML content support
  - new tenant roles, ACL models, or policy-engine redesign

## Critic Review
- Scope-lock outcome: passed via `critic-review.md` on `2026-04-09`; no blocking findings remain.
- Post-implementation outcome: completed via `critic-review.md` revision 3 on `2026-04-10`; ship-ready verdict, no blockers, and no required fixes before merge.
- Locked design points implemented here:
  - reuse existing `BinderRead` / `BinderWrite` policies without new v1 roles
  - immutable document content with archive/unarchive mutating visibility metadata only
  - explicit binder-filter `403 BINDER_POLICY_DENIED` semantics and unfiltered omission semantics
  - same-tenant, same-binder-only `SupersedesDocumentId`
  - binder detail keeps the existing `documents` field name and upgrades it to concrete `DocumentSummary[]`
  - centralized markdown rendering/sanitization boundary without pulling preview UI or stored rendered HTML forward

## Risks And Rollout Notes
- Config or migration considerations:
  - adds one schema migration: `202604090001_AddDocumentsAndDocumentRules`
  - adds no new runtime configuration keys
- Security or operational considerations:
  - archived documents remain directly readable by document id; archive is a list-visibility concern, not an access-control denial
  - the centralized markdown renderer is intentionally conservative and HTML-encodes stored markdown until a future rendering-focused checkpoint introduces a richer parser/sanitizer story
  - Docker-backed validation required unsandboxed execution because the sandbox denies access to the local Docker named pipe
- Checkpoint closure considerations:
  - manual VS Code and Visual Studio launch verification completed on `2026-04-10`
  - post-implementation critic review is complete; CP10 closeout evidence is now complete

## Validation Evidence
- Commands run:
  - `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1` (re-run after closeout and critic-review artifact updates)
  - `powershell -ExecutionPolicy Bypass -File .\scripts\validate-launch-profiles.ps1`
  - `dotnet test tests/PaperBinder.UnitTests/PaperBinder.UnitTests.csproj -c Release --no-build --no-restore --filter FullyQualifiedName~DocumentDomainAndImmutableDocumentRulesTests --logger "console;verbosity=minimal"`
  - `dotnet test tests/PaperBinder.IntegrationTests/PaperBinder.IntegrationTests.csproj -c Release --no-build --no-restore --filter FullyQualifiedName~DocumentDomainAndImmutableDocumentRulesIntegrationTests --logger "console;verbosity=minimal"`
- Results:
  - `scripts/build.ps1`: passed; frontend production build succeeded and `dotnet build PaperBinder.sln -c Release --no-restore -p:SkipFrontendBuild=true` completed with 0 warnings and 0 errors
  - `scripts/test.ps1 -DockerIntegrationMode Require`: passed; unit suite 102/102, non-Docker integration suite 25/25, Docker-backed integration suite 64/64
  - `scripts/validate-docs.ps1`: passed
  - `scripts/validate-docs.ps1` re-run after closeout and critic-review artifact updates: passed
  - `scripts/validate-launch-profiles.ps1`: passed
  - targeted document unit tests: passed; 21/21
  - targeted document integration tests: passed; 14/14
  - manual verification: VS Code launch passed on `2026-04-10`; Visual Studio launch passed on `2026-04-10`
- Remaining required validation:
  - none

## Author Notes For Critic
- Changed files:
  - backend/domain: new document contracts, rules, markdown-renderer boundary, Dapper service, API endpoints, binder-detail mapping, error codes, and DI registration
  - persistence: new `documents` storage model, EF model changes, migration, and snapshot update including the self-reference FK index
  - tests: document unit tests, Docker-backed document integration tests, shared document seed helper, binder-detail summary assertions, and migration workflow expectation updates for the CP10 migration count
  - docs/artifacts: product, architecture, security, contracts, engineering, testing, taskboard, checkpoint ledger, repo navigation, and this PR artifact
- Validation results:
  - `scripts/build.ps1`: passed
  - `scripts/test.ps1 -DockerIntegrationMode Require`: passed (`102` unit, `25` non-Docker integration, `64` Docker-backed integration)
  - `scripts/validate-docs.ps1`: passed
  - `scripts/validate-docs.ps1` re-run after closeout and critic-review artifact updates: passed
  - `scripts/validate-launch-profiles.ps1`: passed
  - targeted CP10 unit tests: `21/21` passed
  - targeted CP10 Docker-backed integration tests: `14/14` passed
- Intentional implementation choice:
  - kept markdown scope bounded by introducing a centralized safe-rendering boundary that HTML-encodes stored markdown instead of adding a third-party parser/sanitizer dependency and ADR in CP10
- Intentional deviations:
  - none from the locked CP10 design decisions
- Residual risks:
  - `IMarkdownDocumentRenderer` is intentionally registered but not yet consumed in CP10 runtime paths because this checkpoint only establishes the rendering boundary
  - `IDocumentService.ListForBinderAsync` relies on the caller to have already enforced binder-local policy; the current binder-detail call site does so correctly, but future callers must preserve that precondition

## Follow-Ups
- Deferred non-blocking critic findings:
  - `N1`: no dedicated archive/unarchive binder-policy denial integration test; deferred because document detail and create/write denial already exercise the shared access-check path end to end
  - `N2`: no dedicated binder-filter success integration test; deferred because binder detail already exercises the shared binder-scoped list SQL after access is granted
  - `N3`: no overlength-title case in the invalid-payload integration test; deferred because the 200-character rule is already unit-covered and the endpoint validation path is exercised by the other invalid-payload cases
