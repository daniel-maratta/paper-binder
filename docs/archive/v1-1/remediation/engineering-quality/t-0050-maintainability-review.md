# T-0050 Maintainability Review

Status: Review complete
Date: 2026-07-28
Task: `T-0050`

## Purpose

Review maintainability hotspots identified by `T-0049` and apply only safe mechanical splits with low behavioral risk.

This checkpoint is not a broad refactor. It preserves endpoint behavior, tenant isolation, authorization, CSRF handling, SQL predicates, public API contracts, and application-service semantics.

## Summary

The safest beneficial cleanup was splitting the two pre-`T-0050` aggregate application contract files for documents and binders.

Both files held read models, command/query records, failures, enums, and outcome records. The split improves scanability and aligns with the repository rule that public types should be split by responsibility unless a multi-type file has a clear reason to stay together.

No runtime logic moved. Public type names, namespaces, record parameters, enum members, and static outcome factory methods were preserved.

## Mechanical Split Applied

Document application contracts now live in responsibility-named files:

- `src/PaperBinder.Application/Documents/DocumentModels.cs`
- `src/PaperBinder.Application/Documents/DocumentCommands.cs`
- `src/PaperBinder.Application/Documents/DocumentFailures.cs`
- `src/PaperBinder.Application/Documents/DocumentOutcomes.cs`

Binder application contracts now live in responsibility-named files:

- `src/PaperBinder.Application/Binders/BinderModels.cs`
- `src/PaperBinder.Application/Binders/BinderCommands.cs`
- `src/PaperBinder.Application/Binders/BinderFailures.cs`
- `src/PaperBinder.Application/Binders/BinderOutcomes.cs`

## Deferred Hotspots

| Hotspot | Disposition | Reason |
| --- | --- | --- |
| `DapperDocumentService.cs` local record/mapper extraction | Deferred | A mechanical type move is possible, but the file's highest-risk complexity is SQL and transaction flow. Splitting it inside this patch would add review surface near tenant-scoped persistence without a proportional v1.1.1 payoff. |
| `DapperBinderService.cs` / `DapperTenantUserAdministrationService.cs` | Deferred | Same concern as document persistence: meaningful cleanup requires deliberate seams around SQL, mapping, logging, and result construction, not a cosmetic move. |
| Endpoint helper consolidation | Deferred | Tenant and membership retrieval must remain visible at API seams. Generalizing repeated helpers risks hiding boundary checks and belongs outside this patch unless paired with targeted endpoint tests. |
| `root-host.tsx` and `tenant-shell.tsx` decomposition | Deferred | These are real frontend maintainability hotspots, but route/shell decomposition is not a tiny mechanical split and needs browser regression coverage. |
| Long integration-test reshaping | Deferred | Coverage is valuable and security-oriented. Helper extraction should happen only when it shortens repeated setup without obscuring tenant/authz intent. |

## Review Result

`T-0050` lands one narrow maintainability improvement and records the rest as intentional deferrals. This keeps CP4 aligned with the v1.1.1 patch scope: reduce obvious application-layer file sprawl without changing behavior or hiding security boundaries.
