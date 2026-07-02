# Batch 1C Summary

## Intent

This pass stays narrow. It improves one binder endpoint hotspot and one binder persistence hotspot without changing tenant scoping, public API contracts, or binder policy behavior.

## Scope

- Move binder API contract records and response mapping out of the endpoint file.
- Extract binder SQL ownership out of the Dapper binder service.
- Extract binder persistence row mapping and persisted-policy parsing into a dedicated binder persistence seam.
- Record the scope, verification, and acceptance review for this batch without widening into broader endpoint or Dapper cleanup.

## Changed Files

- `src/PaperBinder.Api/PaperBinderBinderEndpoints.cs`
- `src/PaperBinder.Api/PaperBinderBinderContractModels.cs`
- `src/PaperBinder.Infrastructure/Binders/DapperBinderService.cs`
- `src/PaperBinder.Infrastructure/Binders/BinderSql.cs`
- `src/PaperBinder.Infrastructure/Binders/BinderPersistenceRecords.cs`
- `docs/50-engineering/README.md`
- `docs/50-engineering/batch-1c-summary.md`
- `docs/50-engineering/batch-1c-acceptance-review.md`
- `docs/ai-index.md`
- `docs/repo-map.json`

## Why These Files

- `PaperBinderBinderEndpoints.cs` was the next endpoint hotspot after the tenant-user slice because it still mixed route wiring, DTO ownership, and response mapping in one file.
- `DapperBinderService.cs` was the next infrastructure hotspot because it still mixed SQL ownership, persisted row shapes, persisted-policy parsing, and service flow in one file.
- The binder pair is narrower and more reviewable than the corresponding document pair, which makes it the best next cleanup step after Batch 1B.

## Improvements Landed

- `PaperBinderBinderEndpoints` now focuses on route registration, boundary orchestration, and failure handling instead of also owning binder transport models and response mapping.
- `PaperBinderBinderContractModels` now holds the binder request and response contracts alongside focused response-mapping methods.
- `DapperBinderService` now delegates SQL text ownership to `BinderSql`.
- `BinderPersistenceRecords` now owns binder row materialization and persisted binder-policy parsing, which reduces skim noise inside the service flow.

## Behavior Notes

- No public binder route shape changed.
- No tenant scoping or authorization behavior changed.
- Binder policy contract strings remain `inherit` and `restricted_roles`.
- SQL behavior, locking semantics, and persisted binder-policy interpretation are unchanged in this batch.

## Deferred Beyond Batch 1C

- Broader endpoint cleanup outside the binder slice.
- Large document-service decomposition.
- Repeated outcome/failure/problem-mapping consolidation.
- Transcript-style integration test cleanup.
- Cross-slice naming or architectural cleanup beyond the selected binder hotspot pair.

## Verification

- `dotnet build PaperBinder.sln -c Release --no-restore -p:SkipFrontendBuild=true -v minimal`
  - Passed.
- `dotnet test tests/PaperBinder.UnitTests/PaperBinder.UnitTests.csproj -c Release --no-build --filter "FullyQualifiedName~BinderDomainAndPolicyModelTests"`
  - Passed: 20 tests.
- `dotnet test tests/PaperBinder.IntegrationTests/PaperBinder.IntegrationTests.csproj -c Release --no-build --filter "FullyQualifiedName~BinderDomainAndPolicyModelIntegrationTests"`
  - Passed: 11 tests.
- `docs/repo-map.json` validation via PowerShell `ConvertFrom-Json`
  - Passed.
