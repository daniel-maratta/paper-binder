# Batch 2 Summary

## Intent

This pass stays narrow. It reduces repeated API-layer problem contract scaffolding in one bounded CRUD slice and closes one remaining contract-organization inconsistency in the document endpoint.

## Scope

- Consolidate repeated internal API problem contract scaffolding across binder, document, and tenant-user problem mappings.
- Move the remaining document request/response contract ownership fully into the existing document contract file.
- Keep route behavior, `ProblemDetails` behavior, and public JSON contracts unchanged.

## Changed Files

- `src/PaperBinder.Api/PaperBinderApiProblem.cs`
- `src/PaperBinder.Api/PaperBinderBinderProblemMapping.cs`
- `src/PaperBinder.Api/PaperBinderDocumentProblemMapping.cs`
- `src/PaperBinder.Api/PaperBinderTenantUserProblemMapping.cs`
- `src/PaperBinder.Api/PaperBinderDocumentContractModels.cs`
- `src/PaperBinder.Api/PaperBinderDocumentEndpoints.cs`
- `docs/50-engineering/README.md`
- `docs/archive/v1-1/remediation/engineering-quality/batch-2-summary.md`
- `docs/archive/v1-1/remediation/engineering-quality/batch-2-acceptance-review.md`
- `docs/ai-index.md`
- `docs/repo-map.json`

## Why These Files

- Binder, document, and tenant-user problem mappings all used the same four-field internal problem contract shape for the same narrow purpose.
- The document endpoint was the one obvious contract-organization laggard after Batch 1B and 1C because binder and tenant-user had already moved DTO ownership into dedicated contract files.
- This slice is narrow enough to improve repetition and ownership without turning into app-wide result-model cleanup.

## Repeated Patterns Addressed

- Three feature-specific problem mapping files each declared a structurally identical internal problem contract record.
- `PaperBinderDocumentEndpoints.cs` still owned request/response contract types locally while adjacent CRUD endpoint files no longer did.

## Improvements Landed

- `PaperBinderApiProblem` now gives the bounded CRUD slice one shared internal problem contract shape without changing feature-specific failure mapping logic.
- Binder, document, and tenant-user problem mappings now return the shared API problem record instead of repeating identical local record definitions.
- `PaperBinderDocumentContractModels` now owns document request/response contract types and list-response mapping alongside the existing document response mapping.
- `PaperBinderDocumentEndpoints` now focuses a little more tightly on route wiring and boundary orchestration.

## Behavior Notes

- No public route shape changed.
- No `ProblemDetails` status-code, title, detail, or error-code behavior changed.
- No tenant scoping, authorization, or parsing behavior changed.
- No public JSON response or request shape changed.

## Deferred Beyond Batch 2

- App-wide problem-mapping consolidation outside this bounded CRUD slice.
- Transcript-style integration test cleanup.
- Further endpoint responsibility cleanup outside the selected slice.
- Broader outcome/failure model cleanup across the application layer.

## Verification

- `dotnet build PaperBinder.sln -c Release --no-restore -p:SkipFrontendBuild=true -v minimal`
  - Passed.
- `dotnet test tests/PaperBinder.UnitTests/PaperBinder.UnitTests.csproj -c Release --no-build --filter "FullyQualifiedName~BinderDomainAndPolicyModelTests|FullyQualifiedName~DocumentDomainAndImmutableDocumentRulesTests|FullyQualifiedName~AuthorizationAndTenantUserAdministrationTests"`
  - Passed: 63 tests.
- `dotnet test tests/PaperBinder.IntegrationTests/PaperBinder.IntegrationTests.csproj -c Release --no-build --filter "FullyQualifiedName~DocumentDomainAndImmutableDocumentRulesIntegrationTests"`
  - Passed: 14 tests.
- `docs/repo-map.json` validation via PowerShell `ConvertFrom-Json`
  - Passed.
