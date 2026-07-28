# T-0049 API Surface And Code-Shape Review

Status: Review complete
Date: 2026-07-28
Task: `T-0049`

## Purpose

Analyze the reviewer concern that parts of PaperBinder look over-ceremonial or generated-first, then define a patch-safe remediation plan.

This review is scoped to API surface ceremony and adjacent code-shape signals. It does not authorize broad refactoring during `T-0049`.

## Summary

The reviewer feedback is directionally correct, but it should not be read as a finding that the architecture is unsound. PaperBinder's explicit command/outcome/failure/problem-mapping style helps preserve tenant isolation, authorization, CSRF handling, validation, and stable problem responses. The issue is cumulative code shape: the same explicit pattern is repeated often enough that some files read as template-shaped rather than deliberately compressed.

The safe `v1.1.1` response is:

- keep the explicit security and contract boundaries
- avoid broad API abstraction in `T-0049`
- record the ceremony hotspots and distinguish them from maintainability hotspots
- route mechanical file splits and test-shape work through `T-0050` or later
- treat future cleanup as curation: remove visual/process weight only when it improves navigation without hiding invariants

No application code cleanup is recommended inside `T-0049` after this review. The smallest API helper extraction candidates touch several endpoint files and would need focused tests to prove no contract drift; that is better handled deliberately than rushed into the discovery task.

## What The Feedback Means

The concern is not "AI-assisted development is bad." The concern is that heavy process discipline can leave visible residue:

- repeated names and result shapes make code feel scaffolded
- long files make real behavior harder to review
- transcript-style tests make coverage harder to skim
- docs and product copy sometimes explain intent more than a user or maintainer needs

That matters for a hiring artifact because a senior reviewer often samples a few files and asks whether the local code is as refined as the architecture story. If they open only an endpoint file, a Dapper service, or a long route component, the code can look more ceremonial than the repo's stated narrow scope requires.

## Evidence Against Current Code

| Concern | Evidence | Interpretation |
| --- | --- | --- |
| Repeated endpoint ceremony | Five API endpoint files define local `GetRequiredTenant`, `GetRequiredMembership`, and/or `WriteFailureAsync` helpers with the same shape: `PaperBinderBinderEndpoints.cs`, `PaperBinderDocumentEndpoints.cs`, `PaperBinderImpersonationEndpoints.cs`, `PaperBinderTenantLeaseEndpoints.cs`, `PaperBinderTenantUserEndpoints.cs`. | Valid review signal. The repetition is behaviorally clear, but visually noisy. |
| Outcome/failure proliferation | `BinderContracts.cs` and `DocumentContracts.cs` each group summaries/details, commands, failure kinds, failures, and several outcome records in one public contract file. | Valid review signal. Explicit results are useful, but the grouping contributes to ceremony. |
| Large infrastructure services | `DapperDocumentService.cs` is 786 lines; `DapperBinderService.cs` and `DapperTenantUserAdministrationService.cs` are also among the largest infrastructure files. | Valid maintainability signal. The data access is tenant-scoped, but the file shape mixes SQL, transactions, mapping records, validation, and result construction. |
| Large frontend surfaces | `root-host.tsx` is 1314 lines; `tenant-shell.tsx` is 1017 lines. | Valid maintainability signal, but not an API-surface issue. Route/shell decomposition belongs to `T-0050` or later. |
| Transcript-style integration tests | `DocumentDomainAndImmutableDocumentRulesIntegrationTests.cs` is 761 lines; `AuthorizationPoliciesAndTenantUserAdministrationIntegrationTests.cs` is 728 lines; `BinderDomainAndPolicyModelIntegrationTests.cs` is 575 lines. | Valid test-shape signal. The coverage is valuable, but setup/assertion flow is hard to scan. |
| Internal `PaperBinder*` prefixes | Most API-layer internal helpers repeat the product name even though the namespace already supplies context. | Low-risk code-inspection signal. Rename churn could be broad; do it only when already touching a file. |

## What Should Stay

- Explicit tenant and membership retrieval at API seams. The boundary must remain obvious.
- Direct endpoint-to-application-service calls. Adding a mediator or generalized dispatcher would add more ceremony, not less.
- Typed domain/application failures where they protect problem-response consistency.
- Tenant-scoped SQL predicates in service methods. Do not hide tenant scoping behind generic query helpers.
- Integration coverage for tenant isolation, authorization, CSRF, and persistence behavior.

## Remediation Principles

1. Prefer local clarity over framework-like abstraction.
2. Remove ceremony only where the invariant remains as visible after the change.
3. Do not compress tenant, authorization, CSRF, or problem-response boundaries into magic helpers.
4. Split files by responsibility before introducing new abstractions.
5. Treat repeated code as a smell, not an automatic defect.
6. Keep tests behavior-rich, but make common setup and assertion intent easier to scan.
7. Rename or remove over-prefixed internal types opportunistically, not as a broad churn pass.

## Patch-Safe Remediation Plan

### T-0049 Disposition

Record this review and do not change application code in `T-0049`.

Rationale:

- The repeated endpoint helper candidates cross multiple API files.
- The helpers are adjacent to tenant/security boundaries.
- A rushed abstraction would risk hiding the exact seams reviewers should be able to inspect.
- The value of this task is discovery and prioritization.

### T-0050 Candidates

These are the safest next cleanup candidates for the maintainability checkpoint:

1. Split `DocumentContracts.cs` into responsibility-named files if the diff stays mechanical:
   - document read models
   - document commands/queries
   - document failures/outcomes
2. Split `BinderContracts.cs` on the same model if the document split is clean.
3. Move local Dapper record/mapper types out of `DapperDocumentService.cs` only if the split is mechanical and no SQL/control flow changes are needed.
4. Add shared test fixture/assertion helpers only where they shorten repeated setup without hiding the scenario's security purpose.

### Defer Beyond V1.1.1 Unless Already Touched

- Broad endpoint renames that remove `PaperBinder` prefixes.
- Generalized endpoint result pipelines.
- A shared "current tenant request" abstraction that would hide tenant/membership retrieval.
- Large frontend route/shell decomposition unless CP4 explicitly chooses it as the safest mechanical split.
- Full integration-test suite reshaping.

## Review Checklist For Future Changes

Use this checklist when a future change touches API, service, or test hotspots:

- Does this helper name precisely describe what it does?
- Is any parsing/validation custom when platform or domain primitives already cover the contract?
- Does the file contain more than one responsibility that could be split mechanically?
- Is repeated outcome/failure plumbing clarifying a boundary, or just repeating a template?
- Can a reviewer see tenant scope and authorization without jumping to a separate doc?
- Does a test read as a focused behavior proof rather than a transcript of every setup action?
- If a pattern appears three or more times, is explicit duplication still clearer than consolidation?

## Outcome

The reviewer statements describe a real code-shape risk, not a correctness failure. The recommended remediation is disciplined pruning: keep PaperBinder's explicit boundary model, reduce bulk through mechanical splits first, and avoid generalized abstractions unless they make a security or contract invariant easier to see.

