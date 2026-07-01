# Batch 1A Acceptance Review

## Acceptance Verdict

Accept with minor follow-up.

Batch 1A materially improves the highest-signal quality hotspots identified in the audit. The parser changes are more idiomatic, the helper names are more honest, the tenant-user endpoint validator is less shallow, and the file split in tenancy improves browseability without broad churn.

This batch still has one follow-up item:

- the exact-case parsing contract is coherent but still implicit rather than locally justified

That issue does not justify reopening Batch 1A into a broader cleanup pass, but it is still worth closing so the parser contract reads as deliberate rather than merely implementation-defined.

## Per-File Review Notes

### `src/PaperBinder.Application/Tenancy/TenantRoleParser.cs`

- Semantic precision: improved. The file now clearly parses enum-backed role names instead of hand-maintaining a `nameof(...)` switch.
- Idiomatic .NET usage: improved. `Enum.TryParse` plus `Enum.IsDefined` is more platform-native than the prior branch table.
- Contract preservation: mostly preserved. The round-trip string check prevents numeric enum inputs from slipping through, which is correct for this string contract.
- Remaining concern: exact-case matching is now an implementation fact rather than an explicitly stated contract rule. The behavior is coherent with `role.ToString()` persistence and test usage, but the rationale for case sensitivity is still implicit.
- Churn: low and justified.
- Reviewer impact: favorable.

### `src/PaperBinder.Infrastructure/Configuration/PaperBinderRuntimeSettings.cs`

- Semantic precision: improved. The audit-retention parser now reads like validation of a defined enum contract rather than a custom string map.
- Idiomatic .NET usage: improved for the changed area.
- Contract preservation: preserved. The accepted values are still the canonical enum names, and the error message remains explicit.
- Remaining concern: as with tenant roles, exact-case acceptance is coherent but not documented as an intentional configuration contract.
- Churn: low in the touched lines. The rest of the large multi-type file remains a later-batch hotspot, but Batch 1A did not sprawl here.
- Reviewer impact: favorable, though the file still carries broader structural debt outside this batch.

### `src/PaperBinder.Application/Binders/BinderRules.cs`

- Semantic precision: improved. `TryTrimToValidName` is more accurate than `TryNormalize`, and `TryParseContractValue` correctly signals that binder policy strings are external contract values rather than enum names.
- Idiomatic .NET usage: slightly improved. The policy-mode parser remains custom, but here that is appropriate because the contract intentionally differs from enum member names.
- Contract preservation: preserved. Trimming around `inherit` and `restricted_roles` remains accepted behavior.
- Remaining concern: `ValidateAndNormalize` still bundles validation and canonicalization in one method name. That is acceptable here, but it is still a slightly broad verb pair rather than a razor-sharp boundary name.
- Churn: low and justified.
- Reviewer impact: clearly favorable.

### `src/PaperBinder.Application/Documents/DocumentRules.cs`

- Semantic precision: improved. `TryTrimToValidTitle` now matches actual behavior.
- Idiomatic .NET usage: neutral; this file did not need a platform-primitive shift beyond naming accuracy.
- Contract preservation: preserved.
- Remaining concern: none of significance in this batch. The helper is still shallow, but the name now advertises that accurately.
- Churn: minimal and justified.
- Reviewer impact: favorable.

### `src/PaperBinder.Api/PaperBinderTenantUserEndpoints.cs`

- Semantic precision: improved. The email helper no longer pretends to normalize beyond trimming, and the new name frames it as a structural validity check.
- Idiomatic .NET usage: improved. `MailAddress.TryCreate` is a better structural pre-check than the previous `@`-count heuristic.
- Contract preservation: preserved. The Docker-backed tenant-user integration slice now passes against the endpoint behavior changed in Batch 1A.
- Remaining concern: the file still uses local request/response records and local validation helpers, so it still reads somewhat template-shaped. Batch 1A did not need to solve that.
- Churn: moderate but still justified within Batch 1A because this was one of the explicit quality hotspots and the changes stayed on validation/boundary semantics.
- Reviewer impact: more favorable than before.

### `src/PaperBinder.Infrastructure/Binders/DapperBinderService.cs`

- Semantic precision: improved only through call-site alignment with `BinderRules`.
- Idiomatic .NET usage: unchanged except for the clearer parser/helper names it now calls.
- Contract preservation: preserved.
- Remaining concern: none in the changed lines. The service remains large, but Batch 1A did not start decomposing it.
- Churn: minimal and justified.
- Reviewer impact: neutral-to-positive. These edits do not worsen the file and do not represent scope creep.

### `src/PaperBinder.Infrastructure/Documents/DapperDocumentService.cs`

- Semantic precision: improved only through call-site alignment with `DocumentRules` and `BinderPolicyModeNames`.
- Idiomatic .NET usage: unchanged except for clearer called APIs.
- Contract preservation: preserved.
- Remaining concern: none in the changed lines. As with the binder service, the broader file remains a later-batch hotspot.
- Churn: minimal and justified.
- Reviewer impact: neutral-to-positive.

### `src/PaperBinder.Application/Tenancy/ITenantUserAdministrationService.cs`

- Semantic precision: improved at the file level. The interface file now contains the interface only.
- Idiomatic .NET usage: neutral.
- Contract preservation: preserved.
- Remaining concern: none. This is a meaningful browseability improvement rather than cosmetic splitting.
- Churn: justified.
- Reviewer impact: favorable.

### `src/PaperBinder.Application/Tenancy/TenantUserAdministrationContracts.cs`

- Semantic precision: acceptable. The file groups the command/result/failure family into one obvious responsibility.
- Idiomatic .NET usage: neutral.
- Contract preservation: preserved.
- Remaining concern: this is still a multi-type contracts file, but unlike the old interface file it has one coherent purpose, so it does not read as arbitrary dumping.
- Churn: justified.
- Reviewer impact: favorable.

### Repo-Contract Updates

#### `AGENTS.md`

- Improved. The new rules directly target the gaps the audit identified: code-level scrutiny, platform-first parsing, helper-name accuracy, and file responsibility.
- Remaining concern: none of substance for this batch.

#### `docs/50-engineering/coding-standards.md`

- Improved. This is the strongest process change in the batch because it turns vague guidance into copy-ready standards for parsing, helper semantics, validators, and file organization.
- Remaining concern: none of substance for this batch.

#### `docs/55-execution/workflows/pr-workflow.md`

- Improved. The PR checklist now includes the targeted hotspot review that the earlier process lacked.
- Remaining concern: the workflow now says the right thing; future reviews still need to actually use it.

## Contract-Risk Findings

1. Exact-case parsing is coherent but still implicit.
   - `TenantRoleParser` and `PaperBinderRuntimeSettings` now reject numeric enum inputs and mixed-case variants, which is good if the contract is "canonical symbolic names only."
   - The current code and tests behave consistently with that rule, but the contract is still justified indirectly by implementation and examples rather than by an explicit local rationale.

2. Binder policy parsing remains deliberately custom and that is correct.
   - `TryParseContractValue` is a real improvement because the contract strings (`inherit`, `restricted_roles`) intentionally differ from enum names.
   - This area now reads as deliberate rather than as overlooked platform support.

## Scope-Discipline Findings

- Batch 1A stayed narrow enough.
- The Dapper service changes were limited to call-site alignment for renamed helpers and the clearer contract parser name.
- There was no broad Dapper restructuring, no endpoint reshaping beyond the tenant-user validator hotspot, and no transcript-test cleanup creep.
- The tenancy file split was selective and justified rather than a sweeping one-type-per-file conversion.

## Remaining Implementation Issues

- `PaperBinderRuntimeSettings.cs` is still a loud multi-type file even though the parser fix was good.
- `PaperBinderTenantUserEndpoints.cs` still carries the general endpoint-file pattern the audit called out: route handlers, local DTOs, local validation, and mapping all in one place.
- The large Dapper services still read as bulkier than they should for easy hotspot review, even though Batch 1A did not worsen them.
- The exact-case parser contract would benefit from one short explicit rationale in code comments, tests, or contract docs.

## Recommended Next Action

Merge after one tiny corrective follow-up:

- add one short explicit rationale note, either in tests or nearby contract docs, stating that tenant-role and audit-retention strings intentionally accept canonical symbolic names only, with exact casing

The tenant-user Docker-backed integration slice now passes, so Batch 1A is in reasonable merge shape pending only that rationale note.

Batch 1B should stay focused on endpoint-file overgrowth and one deliberate Dapper-service decomposition rather than widening into test-structure cleanup.
