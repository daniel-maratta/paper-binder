# Engineering Credibility Audit

## Executive Summary

PaperBinder does not read as AI-generated because of one catastrophic defect. It reads that way because several small-to-medium code decisions stack in the same direction: hand-rolled parsing where the platform already has a better primitive, helper names that overclaim what they do, bulky multi-type files, repetitive result/mapping boilerplate, and tests that feel transcribed rather than shaped.

Two different problems are mixed together:

- Actual engineering issues:
  - repeated custom string and enum parsing
  - misleading or underspecified helper semantics
  - large files that mix validation, mapping, SQL, transport contracts, and local DTOs
  - shallow validators at API seams
- Presentation and reviewer-signal issues:
  - many files look mechanically assembled rather than deliberately shaped
  - important reasoning often lives in repo docs instead of at the code seam a reviewer is reading
- the repo's process surface is stronger than its code-craft surface, which makes the weak code decisions stand out more

The repository has real strengths: tenant scoping is explicit, the boundary model is coherent, and the release/process docs are disciplined. The trust problem is that the code-level judgment in several reviewer-hotspot files does not consistently match that standard.

## Top 10 Highest-Signal Findings

1. **Hand-rolled string and enum parsing is repeated in places where .NET already has stronger primitives**
   - Why it matters: this is one of the fastest ways to trigger "AI wrote this" skepticism in a senior .NET review. It suggests the author reached for first-available code rather than platform-native APIs and edge-case thinking.
   - Representative examples:
     - `src/PaperBinder.Application/Tenancy/TenantRoleParser.cs` uses a `switch` over `nameof(TenantRole.*)`.
     - `src/PaperBinder.Infrastructure/Configuration/PaperBinderRuntimeSettings.cs` parses `AuditRetentionMode` via a manual `switch`.
     - `src/PaperBinder.Application/Binders/BinderRules.cs` manually maps contract strings to `BinderPolicyMode`.
   - Risk: correctness risk, maintainability risk, reviewer-signal risk.

2. **"Normalize" helpers usually just trim strings or perform shallow cleanup**
   - Why it matters: misleading names are not cosmetic. They make callers assume stronger guarantees than the helper actually provides.
   - Representative examples:
     - `DocumentRules.TryNormalizeTitle` in `src/PaperBinder.Application/Documents/DocumentRules.cs`
     - `BinderNameRules.TryNormalize` in `src/PaperBinder.Application/Binders/BinderRules.cs`
     - `TryNormalizeEmail` in `src/PaperBinder.Api/PaperBinderTenantUserEndpoints.cs`
   - Risk: maintainability risk, reviewer-signal risk.

3. **Multi-type files are common in exactly the places reviewers expect deliberate boundaries**
   - Why it matters: packing interfaces, records, enums, failures, outcomes, and rule helpers into one file makes the codebase feel mechanically grouped by checkpoint or feature slice instead of by responsibility.
   - Representative examples:
     - `src/PaperBinder.Application/Documents/DocumentContracts.cs`
     - `src/PaperBinder.Application/Binders/BinderContracts.cs`
     - `src/PaperBinder.Application/Provisioning/ITenantProvisioningService.cs`
     - `src/PaperBinder.Application/Tenancy/ITenantUserAdministrationService.cs`
     - `src/PaperBinder.Infrastructure/Configuration/PaperBinderRuntimeSettings.cs`
   - Risk: maintainability risk, reviewer-signal risk.

4. **Large infrastructure services mix too many concerns**
   - Why it matters: a reviewer expects data-access classes to be opinionated but still navigable. These classes combine SQL, validation, authorization checks, logging, persistence DTOs, parsing, and result construction in one place.
   - Representative examples:
     - `src/PaperBinder.Infrastructure/Documents/DapperDocumentService.cs`
     - `src/PaperBinder.Infrastructure/Binders/DapperBinderService.cs`
     - `src/PaperBinder.Infrastructure/Tenancy/DapperTenantUserAdministrationService.cs`
   - Risk: maintainability risk, reviewer-signal risk.

5. **Endpoint files repeat validation, command construction, transport models, and failure plumbing locally**
   - Why it matters: the API surface is explicit, but the repetition makes it look assembled from a template rather than shaped around the domain. It also encourages local one-off validators.
   - Representative examples:
     - `src/PaperBinder.Api/PaperBinderTenantUserEndpoints.cs`
     - `src/PaperBinder.Api/PaperBinderBinderEndpoints.cs`
     - `src/PaperBinder.Api/PaperBinderDocumentEndpoints.cs`
   - Risk: maintainability risk, reviewer-signal risk.

6. **Outcome/failure/problem-mapping patterns are repeated almost verbatim across slices**
   - Why it matters: explicit result types are defensible, but here the pattern repeats so mechanically that it reads more like generated scaffolding than hand-tuned API design.
   - Representative examples:
     - `DocumentCreateOutcome`, `DocumentListOutcome`, `DocumentDetailOutcome`
     - `BinderCreateOutcome`, `BinderDetailOutcome`, `BinderPolicyReadOutcome`, `BinderPolicyUpdateOutcome`
     - `PaperBinderDocumentProblemMapping`, `PaperBinderBinderProblemMapping`, `PaperBinderTenantUserProblemMapping`
   - Risk: maintainability risk, reviewer-signal risk.

7. **Integration tests are thorough but shaped like long scenario transcripts**
   - Why it matters: the tests prove behavior, but many of them are hard to skim, hard to diff, and repetitive in setup. A skeptical reviewer may read them as bulk-generated confidence theater rather than carefully chosen tests.
   - Representative examples:
     - `tests/PaperBinder.IntegrationTests/BinderDomainAndPolicyModelIntegrationTests.cs`
     - `tests/PaperBinder.IntegrationTests/DocumentDomainAndImmutableDocumentRulesIntegrationTests.cs`
   - Risk: maintainability risk, reviewer-signal risk.

8. **Security-critical code often depends on external documentation instead of local code cues**
   - Why it matters: this repo has strong architecture docs, but a reviewer opening the code wants the critical seams to explain themselves. Middleware order and boundary assumptions are not obvious from the code alone.
   - Representative examples:
     - `src/PaperBinder.Api/Program.Partial.cs`
     - the request-context requirements repeated via `GetRequiredTenant` and `GetRequiredMembership` helpers across endpoint files
   - Risk: maintainability risk, reviewer-signal risk.

9. **Internal naming is over-prefixed and low-signal in the API layer**
   - Why it matters: the namespace already supplies `PaperBinder`. Repeating it on almost every internal API type makes browsing slower and contributes to a generated-code feel.
   - Representative examples:
     - `src/PaperBinder.Api/` contains dozens of `PaperBinder*.cs` files for internal endpoint, middleware, and mapping types.
   - Risk: reviewer-signal risk.

10. **Comments are either sparse where "why" is needed or phrased in delivery/checkpoint language**
   - Why it matters: good comments justify a non-obvious choice. Here the most notable inline comment is tied to checkpoint history, while critical code paths often have no local rationale at all.
   - Representative examples:
     - `src/PaperBinder.Infrastructure/Documents/HtmlEncodingMarkdownDocumentRenderer.cs`
     - `src/PaperBinder.Api/Program.Partial.cs`
   - Risk: maintainability risk, reviewer-signal risk.

## Recurring Anti-Pattern Catalog

| Anti-pattern | Why it hurts trust | Concrete examples |
| --- | --- | --- |
| Trim-only "normalization" helpers | Overclaims semantics and hides weak invariants behind confident names | `DocumentRules.TryNormalizeTitle`, `BinderNameRules.TryNormalize`, `TryNormalizeEmail` |
| Fragile string-to-enum matching | Suggests platform primitives were skipped and contract semantics were not thought through deeply | `TenantRoleParser`, `PaperBinderRuntimeSettings` audit mode parsing, `BinderPolicyModeNames.TryParse` |
| Multi-type files without a clear exception rule | Makes the code feel bundled by implementation burst rather than stable ownership | `DocumentContracts.cs`, `BinderContracts.cs`, `ITenantProvisioningService.cs`, `ITenantUserAdministrationService.cs` |
| Generic result/failure scaffolding repeated per feature | Reads like codegen boilerplate and adds browse noise | `*Outcome`, `*Failure`, `*FailureKind`, problem mapping files |
| Large service classes with nested record/DTO types | Hides domain intent inside long files that mix concerns | `DapperDocumentService`, `DapperBinderService`, `DapperTenantUserAdministrationService` |
| Local transport models embedded in endpoint files | Couples route handlers, DTO shape, local validation, and mapping too tightly | `PaperBinderBinderEndpoints`, `PaperBinderDocumentEndpoints`, `PaperBinderTenantUserEndpoints` |
| Tests as full-flow transcripts | Behavior coverage is real, but the tests are verbose, repetitive, and hard to reason about in small diffs | large binder/document integration test classes |
| External-doc-first reasoning | Great for architecture packets, weaker for code skim credibility | `Program.Partial.cs` middleware order relies on docs rather than local rationale |

## Reviewer Hotspot Map

| Hotspot | What a reviewer is likely to inspect | Current impression |
| --- | --- | --- |
| `src/PaperBinder.Application/Binders/BinderRules.cs`, `src/PaperBinder.Application/Documents/DocumentRules.cs`, `src/PaperBinder.Application/Tenancy/TenantRoleParser.cs` | low-level rules and helper semantics | Fastest "AI smell" zone: trim-only normalize methods, manual parsers, weak naming precision |
| `src/PaperBinder.Api/Program.Partial.cs` | runtime composition and middleware order | Architecture is intentional, but local code does not explain why ordering matters |
| `src/PaperBinder.Api/*Endpoints.cs` | public API shape and request handling | Explicit but repetitive; looks template-driven and over-localized |
| `src/PaperBinder.Infrastructure/Documents/DapperDocumentService.cs`, `Binders/DapperBinderService.cs`, `Tenancy/DapperTenantUserAdministrationService.cs` | real backend judgment under load-bearing behavior | Strong tenant predicates, but file shape is bulky and mixes concerns |
| `src/PaperBinder.Application/*Contracts.cs` and `ITenantProvisioningService.cs` | type organization and slice cohesion | Many related types piled into one file without a clear rule for when that is acceptable |
| `tests/PaperBinder.IntegrationTests/*Binder*`, `*Document*` | test depth and engineering taste | Serious effort is visible, but the structure feels repetitive and hard to maintain |
| `docs/55-execution/` and `docs/95-delivery/pr/*/critic-review.md` | process maturity | Strong discipline, but also a contrast effect: the process language often looks more refined than the hotspot code |

## What Is Actually Fine And Should Not Be Churned

- Tenant scoping in data access is consistently explicit. The Dapper queries generally predicate on `tenant_id` correctly and do not read like accidental cross-tenant logic.
- The host-derived tenancy model is coherent. The repo's security and architecture docs align well with the runtime shape.
- Using ASP.NET Core Identity pieces inside `DapperTenantUserAdministrationService` is reasonable. The issue is surrounding code shape, not the underlying choice.
- Runtime configuration validation is worth keeping. The problem is the manual parsing style and file organization, not the existence of the validation boundary.
- ProblemDetails and host-gated endpoint behavior are worth preserving. Refactoring should target structure and naming, not contract churn.

## Prioritized Remediation Batches

### Batch 1: Trust Hotspot Cleanup

Scope:
- replace or tighten the custom enum/string parsers
- rename misleading normalize helpers
- remove or rename shallow validators that overstate guarantees
- split the most obvious multi-type hotspot files in `src/PaperBinder.Application/` and `src/PaperBinder.Api/`

Why first:
- this is the fastest reviewer-trust win
- it directly targets the files a skeptical senior engineer will open first
- it has relatively low behavioral risk if done carefully

### Batch 2: Service And Endpoint Shape Pass

Scope:
- break the largest Dapper services into smaller files or dedicated mapper/query helpers
- pull transport DTOs and local parsing/validation out of endpoint files when they have stable value outside a single handler
- reduce one-off helper logic at API seams

Why second:
- it improves browseability and cohesion after the naming/parsing hotspots are fixed
- it changes code shape more than behavior

### Batch 3: Test Structure Pass

Scope:
- extract shared request/setup helpers from the longest integration test classes
- shorten the largest transcript-style tests
- add focused unit tests for any parsing or normalization edge cases introduced during Batch 1

Why third:
- it preserves current coverage while making the trust story cleaner
- it is easier to do once the production code seams are less noisy

### Batch 4: Boilerplate And Comment Precision Pass

Scope:
- reduce unnecessary internal `PaperBinder` prefixes where namespaces already carry context
- consolidate obviously repetitive outcome/failure plumbing only where it improves clarity
- add sparse "why" comments at critical seams such as middleware ordering or intentionally conservative rendering

Why fourth:
- this should follow the structural cleanup so comments and naming reflect the final shape
- it is valuable, but less trust-restoring than fixing the earlier hotspots first
