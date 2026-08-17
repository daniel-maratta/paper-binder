# Implementation Guidance Gap Analysis

## Instruction-System Failure Analysis

### Missing Guidance

- There is no explicit repository rule for semantic naming precision. Nothing says a method named `Normalize` must perform real canonicalization rather than trimming.
- There is no explicit rule against hand-rolled string-to-enum parsing when .NET already provides an adequate primitive.
- There is no file-organization standard beyond broad layer boundaries. The repo does not say when one public type per file is expected, when bundling is acceptable, or when a multi-type file needs justification.
- There is no repository rule against one-off validators with shallow semantics at API boundaries.
- There is no targeted hotspot-review gate that asks whether code reads as deliberate and well-curated.

### Weak Guidance

- `docs/50-engineering/coding-standards.md` says "Keep naming explicit and domain-oriented" and "Prefer built-in platform capabilities first," but both are too abstract to prevent the specific patterns present in the codebase.
- The same document says comments should be rare and high-signal, but it does not define where local rationale is required even if architecture docs already exist elsewhere.
- Testing docs emphasize coverage and determinism, not test shape, test storytelling, or transcript-style repetition.

### Unenforced Guidance

- The repo has substantial execution and PR workflow guidance, but those workflows mostly enforce scope, docs propagation, validation commands, and release gates.
- There is no validator, checklist item, or critic-review section that explicitly inspects:
  - helper naming semantics
  - idiomatic .NET parsing and validation
  - multi-type file sprawl
  - mechanically repetitive patterns
- The coding standard is short and broad; the critic-review artifacts are long and procedural. The detailed machinery is attached to planning and release posture, not code craftsmanship.

### Agent Noncompliance

- Existing guidance to prefer built-in platform capabilities first was not followed consistently. The current code still contains manual enum parsing and local validators in hotspots such as:
  - `TenantRoleParser`
  - `PaperBinderRuntimeSettings`
  - `TryNormalizeEmail`
- Existing guidance to keep naming explicit did not prevent trim-only normalize helpers.
- Existing guidance to keep comments high-signal did not translate into local rationale at critical seams like middleware ordering.

### Code-Review Blind Spots

- The current review process is excellent at asking "is this scoped, tested, documented, and mergeable?" It is much weaker at asking "does this reflect senior engineering judgment at the code seam?"
- The critic-review artifacts in `docs/95-delivery/pr/` are detailed, but they are primarily plan and release reviews. They are not targeted hotspot reviews of the changed code.
- A change can pass the current process while still leaving a strong engineer with the impression that the code was generated and only lightly curated.

## What The Current Docs Likely Optimize For

The current instruction set strongly optimizes for:

- scope discipline
- tenant isolation and security boundaries
- documentation integrity
- release reproducibility
- task/PR traceability
- test execution evidence
- architecture clarity during targeted code review

What it does **not** optimize for strongly enough:

- naming precision
- idiomatic .NET usage
- restraint in helper creation
- file/type organization
- detection of template-like repetition
- targeted hotspot review of actual code
- consistency between the refinement of repo process and the refinement of local code

## What Guidance Is Missing Or Too Vague

### 1. Naming Semantics Standard

Missing standard:

- method and type names must match actual behavior, not intended behavior
- `Normalize` implies stable canonicalization, not trim/null coalescing
- `Validate` should not also mutate unless the mutation is explicit in the name

This would have prevented:

- `DocumentRules.TryNormalizeTitle`
- `BinderNameRules.TryNormalize`
- `TryNormalizeEmail`

### 2. Platform-First Parsing And Validation Standard

Missing standard:

- prefer `Enum.TryParse`, `Enum.IsDefined`, framework binders, and established BCL/ASP.NET primitives before custom parsing code
- custom string maps are acceptable only when the external contract intentionally differs from enum names

This would have prevented or constrained:

- `TenantRoleParser`
- `PaperBinderRuntimeSettings` audit mode parsing
- `BinderPolicyModeNames.TryParse`

### 3. File Organization Standard

Missing standard:

- default to one public type per file
- allow multi-type files only when the file still has one obvious responsibility
- interface files should not automatically absorb the entire command/result/error family

This would have prevented:

- the pre-`T-0050` aggregate document contract file
- the pre-`T-0050` aggregate binder contract file
- `ITenantProvisioningService.cs`
- `ITenantUserAdministrationService.cs`

### 4. Helper Introduction Standard

Missing standard:

- do not create a helper unless it protects a real invariant, improves correctness, or is used from multiple call sites
- do not extract one-off trimming/parsing logic into authoritative-looking helpers without a clear domain reason

This would have prevented:

- trim-only normalize helpers
- local email validation logic in endpoint code

### 5. Test Readability Standard

Missing standard:

- long integration tests should justify why the scenario belongs in one file instead of shared helpers plus focused tests
- passing tests are not enough if the test body reads like repeated setup prose

This would have improved:

- the large binder and document integration test classes

## What Acceptance Criteria Are Missing

These are the quality gates the current workflow does not state explicitly enough:

- No misleading helper names. If a helper is named `Normalize`, it must perform real canonicalization beyond trimming/empty fallback.
- No fragile string-to-enum matching when platform-native parsing/validation exists.
- Split files by responsibility unless there is a deliberate, documented reason not to.
- Public APIs and helpers must use precise domain language, not convenience language.
- Do not add one-off validators at API boundaries when framework or domain primitives already exist, unless the helper is explicitly described as a minimal syntactic pre-check.
- Large files that mix more than one major responsibility need an explicit review note before merge.
- Comments in source code must justify decisions or invariants, not checkpoint history or obvious syntax.
- A targeted hotspot-review pass must sample hotspot code files, not only docs, plans, and validation output.

## Recommended Updates To The AI Instructions And Repo Contract

### Add To `docs/50-engineering/coding-standards.md`

Copy-ready policy text:

> **Naming Precision**
> Public and reusable helper names must match actual semantics. Do not use `Normalize` for trim-only or null-coalescing behavior. Do not use `Validate` for methods that also transform inputs unless the transformation is explicit in the name.

> **Platform-First Parsing**
> Prefer built-in .NET and ASP.NET Core parsing, binding, and validation primitives before writing custom parsers or validators. When an external string contract intentionally differs from enum member names, centralize the mapping and document that difference in code.

> **Helper Restraint**
> Do not introduce a helper that only trims input, forwards to a single BCL call, or wraps a one-off LINQ expression unless it protects a real invariant used in multiple places.

> **Type And File Organization**
> Default to one public type per file. Small exceptions are allowed for tightly bound request/response or failure/result pairs, but interface files should not automatically absorb their full command/result/error family.

> **Local Rationale At Critical Seams**
> Security-critical ordering, intentionally conservative rendering, and other non-obvious runtime decisions need a short local rationale comment even when the larger explanation exists in repo docs.

### Add To `docs/archive/v1/checkpoints/workflows/pr-workflow.md`

Copy-ready policy text:

> **Targeted Hotspot Review Gate**
> Before a PR is considered review ready, perform a hotspot skim of at least:
> - one rule/helper file
> - one endpoint or application-boundary file
> - one infrastructure/data-access file
> - one test file
>
> Record any findings about naming precision, idiomatic platform usage, file organization, helper quality, or mechanically repetitive patterns.

> **Generated-Looking Repetition**
> Repeated outcome/failure/mapping scaffolding is a review smell. If a change introduces the same pattern three or more times, either consolidate it or explain why explicit duplication is the clearer choice.

### Add To Root `AGENTS.md`

Copy-ready policy text:

> Implementation quality in hotspot files is a first-class constraint. Passing tests and matching architecture docs are necessary but not sufficient. Avoid misleading helper names, custom parsers where platform APIs exist, unnecessary local validators, unexplained multi-type files, and repetitive scaffolding without a clear payoff.

## Recommended Review Workflow Changes

### Add A Dedicated Post-Implementation Quality Pass

Run it after functional validation is green and before final merge/release handoff.

Focus files:

- one application rules/helper file
- one API endpoint file
- one infrastructure service
- one large test file

### Targeted Review Checklist

- Does any helper or type name overclaim what it does?
- Is any string or enum parsing custom without a clear contract reason?
- Does any API boundary perform shallow local validation that should be delegated or renamed?
- Does any file bundle too many public types or responsibilities?
- Does any large service mix SQL, validation, mapping, logging, and local DTOs in one place?
- Does repeated result/error/mapping scaffolding look deliberate or merely replicated?
- Do comments explain why a seam exists, or only what the code already says?
- If a senior .NET engineer skimmed only this file, would the code still look idiomatic?

### Change How Critic Reviews Sample Code

The current critic-review pattern should keep its scope/security rigor, but it should add a short mandatory code-skimming section:

- "Hotspot files opened"
- "Naming/idiom findings"
- "File organization findings"
- "Generated-pattern findings"

Without that section, the process will keep proving that the repo is organized while failing to show that hotspot code received direct quality scrutiny.
