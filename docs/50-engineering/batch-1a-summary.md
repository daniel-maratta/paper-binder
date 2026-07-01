# Batch 1A Remediation Summary

## Intent

This pass is intentionally narrow. It targets the fastest implementation-quality losses identified in the implementation audit without reshaping stable tenancy, endpoint, or Dapper architecture.

## Scope

- Replace high-visibility hand-rolled enum parsing where the .NET platform already expresses the contract cleanly.
- Rename trim-only helpers so their names match their actual semantics.
- Tighten one shallow API-boundary validator in a high-traffic endpoint.
- Split one especially noisy multi-type application file by responsibility.
- Land repo-contract and PR-workflow guidance in the same batch so the same patterns do not reappear later.

## Changed Files

- `src/PaperBinder.Application/Tenancy/TenantRoleParser.cs`
- `src/PaperBinder.Infrastructure/Configuration/PaperBinderRuntimeSettings.cs`
- `src/PaperBinder.Application/Binders/BinderRules.cs`
- `src/PaperBinder.Application/Documents/DocumentRules.cs`
- `src/PaperBinder.Api/PaperBinderTenantUserEndpoints.cs`
- `src/PaperBinder.Infrastructure/Binders/DapperBinderService.cs`
- `src/PaperBinder.Infrastructure/Documents/DapperDocumentService.cs`
- `src/PaperBinder.Application/Tenancy/ITenantUserAdministrationService.cs`
- `src/PaperBinder.Application/Tenancy/TenantUserAdministrationContracts.cs`
- `AGENTS.md`
- `docs/50-engineering/coding-standards.md`
- `docs/55-execution/workflows/pr-workflow.md`
- `docs/50-engineering/README.md`
- `docs/ai-index.md`
- `docs/repo-map.json`

## Improvements Landed

- `TenantRoleParser` now uses `Enum.TryParse` plus `Enum.IsDefined` instead of a manual `nameof(...)` switch.
- `PaperBinderRuntimeSettings` now validates `AuditRetentionMode` with the platform enum parser instead of a hand-written branch map.
- `BinderNameRules`, `DocumentRules`, and the tenant-user email validator no longer use `Normalize` terminology for trim-only behavior.
- `BinderPolicyModeNames.TryParseContractValue` now states explicitly that it parses persisted/API contract values, not enum names.
- `ITenantUserAdministrationService.cs` now contains only the interface; the command/result/failure family moved into a focused contracts file.
- Repo guidance now treats helper semantics, platform-first parsing, boundary validators, and file responsibility as explicit quality gates.

## Behavior Notes

- Tenant-user role values are trimmed at the API boundary before they are passed into application services.
- Tenant-user email validation now uses `System.Net.Mail.MailAddress` and rejects inputs that do not round-trip as a plain address.
- Tenant-role and audit-retention parsing remain exact-case; this batch removes hand-rolled parsing without broadening the accepted contract.

## Deferred To Batch 1B

- Large Dapper service decomposition.
- Broad endpoint file reshaping.
- Transcript-style integration test cleanup.
- Broader multi-type file breakup across binder/document/provisioning contracts.
- Any architectural or public-contract changes beyond the narrow parser/validator/helper surface.

## Verification

- `dotnet build PaperBinder.sln -c Release --no-restore -p:SkipFrontendBuild=true -v minimal`
  - Passed.
- `dotnet test tests/PaperBinder.UnitTests/PaperBinder.UnitTests.csproj -c Release --no-build --filter "FullyQualifiedName~BinderDomainAndPolicyModelTests|FullyQualifiedName~DocumentDomainAndImmutableDocumentRulesTests|FullyQualifiedName~AuthorizationAndTenantUserAdministrationTests"`
  - Passed: 63 tests.
- `dotnet test tests/PaperBinder.IntegrationTests/PaperBinder.IntegrationTests.csproj -c Release --no-build --filter "FullyQualifiedName~RuntimeConfigurationTests"`
  - Passed: 11 tests.
- `dotnet test tests/PaperBinder.IntegrationTests/PaperBinder.IntegrationTests.csproj -c Release --no-build --filter "FullyQualifiedName~AuthorizationPoliciesAndTenantUserAdministrationIntegrationTests.Should_ReturnBadRequest_When_TenantUserEmailIsStructurallyInvalid|FullyQualifiedName~AuthorizationPoliciesAndTenantUserAdministrationIntegrationTests.Should_ReturnUnprocessableEntity_When_TenantUserRoleIsInvalid"`
  - Not completed: Docker/Testcontainers was unavailable in the current environment (`npipe://./pipe/docker_engine` could not be reached).
- `docs/repo-map.json` validation via PowerShell `ConvertFrom-Json`
  - Passed.
