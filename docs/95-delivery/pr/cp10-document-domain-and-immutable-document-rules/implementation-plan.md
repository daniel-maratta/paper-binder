# CP10 Implementation Plan: Document Domain And Immutable Document Rules
Status: Current Plan

## Goal

Implement CP10 so the core document workflow lands on top of the shipped CP9 binder boundary without reopening tenancy or authorization design: tenant-scoped markdown documents can be created, listed, read, archived, and unarchived, while document content remains immutable and binder detail stops returning a placeholder-only `documents: []` payload.

## Scope

Included:
- document persistence schema and migration work for tenant-owned, binder-owned documents
- application/domain contracts and Dapper-backed services for document create/list/detail/archive/unarchive behavior
- tenant-host document endpoints, document-specific ProblemDetails mapping, and binder-detail document summary population
- immutable document rules, optional `SupersedesDocumentId` metadata, archive visibility semantics, and markdown pipeline contract sync
- tenant-scoped query/index strategy for document reads and writes
- unit and Docker-backed integration coverage for immutability, archive filtering, binder-policy enforcement, and tenant isolation
- synchronized product, architecture, contract, testing, execution, and delivery docs directly affected by CP10

Not included:
- in-place document editing, `PUT`/`PATCH` content endpoints, or mutable content revisions
- dedicated version-history browsing, diff UX, restore flows, or a separate "replace document" endpoint beyond create-with-optional-supersedes metadata
- file uploads, blob storage, preview pipelines, search indexing, or full-text search
- frontend routes, forms, rendering UI, or E2E browser flows (`CP12+` and `CP14+`)
- lease endpoints, worker cleanup, or tenant lifecycle behavior (`CP11`)
- new tenant roles, multi-role aggregation, user-specific ACLs, or policy-engine changes
- durable audit-log tables, audit-reporting UI, or cross-tenant/cross-binder sharing behavior

## Locked Design Decisions

CP10 design is stable at the checkpoint boundary. Implementation must not reopen these decisions without updating this plan and the affected canonical docs first.

- Reuse the existing named policies `BinderRead` and `BinderWrite`; CP10 does not add new v1 roles or bypass the CP8 policy boundary.
- Preserve the current authorization layering for binder-scoped documents: resolve immutable tenant context, enforce endpoint policy, then evaluate binder-local policy for the target binder.
- No `PUT`, `PATCH`, or other in-place document-content mutation path exists in v1.
- Archive/unarchive changes visibility metadata only and must never mutate `title`, `contentType`, `content`, `binderId`, or supersedes metadata on an existing row.
- `GET /api/documents` and binder-detail document summaries hide archived documents by default and include them only when the canonical contract explicitly says they should.
- `GET /api/documents?binderId=...` is explicit binder-targeted access. If the binder exists in the current tenant but binder-local policy denies access, return `403` with the existing `BINDER_POLICY_DENIED` contract rather than a silent empty list. Unfiltered `GET /api/documents` omits documents in binders the caller cannot access.
- The binder-detail response keeps the existing `documents` field name from CP9 and upgrades it to a concrete document-summary payload rather than renaming or nesting it differently.
- The document contract shape is locked before endpoint implementation:
  - `DocumentSummary` fields: `documentId`, `binderId`, `title`, `contentType`, `supersedesDocumentId`, `createdAt`, `archivedAt`.
  - `DocumentDetail` fields: `DocumentSummary` plus `content`.
  - `GET /api/documents` returns `{ documents: DocumentSummary[] }`.
  - `GET /api/binders/{binderId}` reuses `DocumentSummary[]` in the existing `documents` field.
  - Successful `GET /api/documents/{documentId}`, `POST /api/documents`, `POST /api/documents/{documentId}/archive`, and `POST /api/documents/{documentId}/unarchive` return `DocumentDetail`.
- `SupersedesDocumentId` is optional and, when supplied, must reference a different document in the same tenant and same binder. Cross-tenant, cross-binder, self-referential, or unknown supersedes targets are invalid in CP10.
- Document title rules are locked to: trim surrounding whitespace and require 1-200 characters after trimming.
- Document content rules are locked to: `contentType` must be the exact contract value `markdown`; content must be non-whitespace and at most 50,000 characters; the stored value remains raw markdown, not rendered HTML.
- Runtime document query and mutation entrypoints must take `TenantContext` explicitly and apply tenant and binder predicates in SQL by construction.
- Do not "filter after fetch" for tenant scope, binder policy scope, or archive visibility.
- Markdown is the only supported document content type in v1; raw HTML is not a supported content format, and rendered output must be sanitized.
- All three document POST routes are unsafe cookie-authenticated endpoints and must be explicitly marked `CSRF required: Y` in the API contract and covered by rejection tests.
- Document-specific `errorCode` values are locked to `DOCUMENT_NOT_FOUND`, `DOCUMENT_TITLE_INVALID`, `DOCUMENT_CONTENT_REQUIRED`, `DOCUMENT_CONTENT_TOO_LARGE`, `DOCUMENT_CONTENT_TYPE_INVALID`, `DOCUMENT_BINDER_REQUIRED`, `DOCUMENT_SUPERSEDES_INVALID`, `DOCUMENT_ALREADY_ARCHIVED`, and `DOCUMENT_NOT_ARCHIVED`. Binder-local denial on document routes continues to use `BINDER_POLICY_DENIED`, and missing or wrong-tenant binder targets continue to use `BINDER_NOT_FOUND`.
- CP10 establishes a centralized markdown rendering/sanitization strategy boundary only. It does not add stored rendered HTML, a preview endpoint, or frontend rendering flows. If the chosen implementation requires a third-party markdown or sanitization dependency, the ADR must land in the same change set before that dependency is introduced.
- CP10 remains backend/domain/docs/testing work only. Do not pull forward worker, lease, frontend, search, or history-browser work.

No remaining blocking open decisions remain. Any future change to these locked decisions requires revising this plan and the affected canonical docs before implementation begins.

## Planned Work

1. Complete and review `docs/40-contracts/api-contract.md` as a blocking precondition before endpoint implementation: lock document request/response examples, `DocumentSummary` and `DocumentDetail` payloads, archive/unarchive success semantics, explicit `CSRF required: Y` annotations on all three document POST routes, stable document error codes, and locked `binderId` / `includeArchived` query behavior. Broad endpoint implementation does not begin until this contract update is complete and reviewed.
2. Align product and domain docs to the locked CP10 model, including `docs/10-product/prd.md`, `docs/10-product/user-stories.md`, `docs/10-product/domain-nouns.md`, and `docs/20-architecture/frontend-app-route-map.md`, with the concrete title/content limits and same-binder supersedes rule.
3. Add document persistence models, EF migration metadata, tenant-scoped indexes, and tenant-consistent foreign-key enforcement between documents and binders.
4. Add application/domain contracts for document summaries, detail reads, create commands, archive transitions, markdown-only content validation, same-binder supersedes validation, and immutable content rules.
5. Add Dapper-backed document persistence services and register them in the existing persistence composition root without weakening the CP9 binder service boundary.
6. Add tenant-host document endpoints plus document-specific ProblemDetails mapping, and update binder-detail endpoint mapping to return real document summaries instead of the CP9 placeholder array.
7. Add unit coverage for immutable-document rules, title/content/content-type/size validation, supersedes validation, archive-transition validation, binder-policy access evaluation where document handlers depend on it, and any markdown-pipeline validation that remains application-side.
8. Add Docker-backed integration coverage for document create/list/detail/archive/unarchive success and deny paths, explicit binder-filter `403` behavior, unfiltered omission semantics, binder-detail document summary population, cross-tenant protection, wrong-host protection, protocol headers, and CSRF enforcement on all unsafe document routes.
9. Tighten the test-host seeding seam as needed for deterministic document-order and archive-timestamp assertions: prefer explicit seeded timestamps first, and update shared test helpers in the same change set if the existing seam is insufficient.
10. Synchronize the remaining canonical docs, delivery artifact navigation, and repository metadata in the same change set.

## Vertical-Slice TDD Plan

Public interfaces under test:
- `POST /api/documents`
- `GET /api/documents`
- `GET /api/documents/{documentId}`
- `POST /api/documents/{documentId}/archive`
- `POST /api/documents/{documentId}/unarchive`
- `GET /api/binders/{binderId}` for document-summary population
- new application contracts under `src/PaperBinder.Application/Documents/`

Planned `RED -> GREEN -> REFACTOR` slices:

1. `RED`: `Should_CreateDocument_AndReturnDetail_When_RequestIsValid`
   `GREEN`: add the minimal create path with tenant-scoped binder lookup, markdown-only content-type enforcement, and locked `DocumentDetail` response shape.
   `REFACTOR`: isolate create validation and response mapping so later slices do not duplicate them.
2. `RED`: `Should_RejectDocumentCreate_When_TitleContentTypeContentOrBinderIsInvalid`
   `GREEN`: enforce title rules, required binder/content rules, 50,000-character content limit, and stable validation `errorCode` values.
   `REFACTOR`: centralize document validation helpers so create and later mutation guards share the same rules.
3. `RED`: `Should_ListDocuments_AndPopulateBinderDetailSummaries_When_VisibleDocumentsExist`
   `GREEN`: add document summary queries, default archive filtering, and shared summary mapping for `/api/documents` and binder detail.
   `REFACTOR`: remove duplicate summary projection logic across list and binder-detail handlers.
4. `RED`: `Should_ReturnForbidden_When_BinderFilteredDocumentListTargetsRestrictedBinder`
   `GREEN`: enforce explicit binder-target `403 BINDER_POLICY_DENIED` behavior and unfiltered omission semantics in SQL.
   `REFACTOR`: consolidate binder-aware authorization query helpers without hiding tenant context.
5. `RED`: `Should_ReturnNotFound_When_DocumentIdBelongsToAnotherTenant`
   `GREEN`: enforce tenant-scoped detail/archive lookups and wrong-host or wrong-tenant failure behavior before any unscoped read occurs.
   `REFACTOR`: remove duplicated guard logic while keeping repository entrypoints explicitly tenant-scoped.
6. `RED`: `Should_ValidateSameBinderSupersedesConstraint_When_SupersedesDocumentIdIsProvided`
   `GREEN`: enforce same-tenant, same-binder supersedes validation and preserve the superseded row unchanged.
   `REFACTOR`: share supersedes validation across create-path queries and rule helpers.
7. `RED`: `Should_ArchiveAndUnarchiveDocument_WithoutMutatingContent`
   `GREEN`: add archive transitions, invalid-transition `409` behavior, and success responses that return the locked `DocumentDetail` shape with updated archive metadata.
   `REFACTOR`: centralize archive-transition rules and any structured event hooks.
8. `RED`: `Should_RejectUnsafeDocumentRoutes_When_CsrfTokenIsMissing`
   `GREEN`: verify create, archive, and unarchive remain covered by existing CSRF middleware and explicit contract annotations.
   `REFACTOR`: reduce CSRF test duplication across the three unsafe document routes.

## Acceptance Criteria

- A migration adds tenant-owned document storage with binder-consistent relationships, indexes aligned to documented list/detail access paths, and constraints that prevent tenant-inconsistent document-to-binder linkage.
- `POST /api/documents` creates a document only inside the established request tenant and target binder, requires CSRF, enforces trimmed title length `1-200`, enforces non-whitespace markdown content with a maximum length of `50,000` characters, and never mutates an existing document row.
- If `SupersedesDocumentId` is supplied, the create flow validates that it references a different document in the same tenant and same binder, links the new row to the superseded row as metadata only, and leaves the superseded document unchanged.
- `GET /api/documents` returns only documents from the current tenant, supports optional binder filtering, excludes archived documents by default, includes archived documents only when `includeArchived=true` is explicitly requested, and omits documents in restricted binders when no explicit binder target is requested.
- `GET /api/documents?binderId=...` returns `403 BINDER_POLICY_DENIED` when the binder exists in the current tenant but binder-local policy denies the caller, and returns `404 BINDER_NOT_FOUND` for missing or wrong-tenant binders.
- `GET /api/documents/{documentId}` returns the locked `DocumentDetail` shape with full immutable content plus archive metadata only when tenant scope, endpoint policy, and binder-local policy all allow access; wrong-tenant or unknown IDs return `404`.
- `POST /api/documents/{documentId}/archive` and `POST /api/documents/{documentId}/unarchive` enforce `BinderWrite`, require CSRF, mutate archive metadata only, return the locked `DocumentDetail` shape on success, and return documented `409` failures for invalid archive transitions.
- `GET /api/binders/{binderId}` returns the existing binder metadata plus concrete `DocumentSummary` items in `documents`, with archived documents hidden by default and no field-name or envelope change from the CP9 contract.
- Cross-tenant document IDs, wrong-host requests, and client-supplied tenant hints never succeed or fall through to unscoped reads or writes.
- The final change set documents stable document request/response examples, failure semantics, explicit CSRF annotations on all unsafe document routes, and document-specific `errorCode` values in `docs/40-contracts/api-contract.md` before endpoint behavior is considered complete.
- The markdown pipeline is centralized and documented so future rendering uses sanitized output; CP10 does not add raw HTML support, secondary rendered-content storage, or a preview UI.
- The implementation ships without document edit endpoints, version-history endpoints, worker behavior, or frontend document screens.
- Canonical product, architecture, security, contract, testing, execution, and delivery docs are updated in the same change set as the implementation.

## Validation Plan

- pre-implementation scope-lock check that `docs/40-contracts/api-contract.md` contains the locked document payloads, explicit CSRF annotations, and stable document error codes before broad endpoint implementation begins
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release`
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require`
- targeted unit tests for immutable-document validation, same-binder supersedes validation, title/content/content-type/size validation, archive-transition rules, binder-detail summary mapping, document-specific error-code mapping, and any markdown-pipeline guards that are implemented in-process
- targeted Docker-backed integration tests for document create/list/detail/archive/unarchive success paths, archived-default filtering, `includeArchived=true`, explicit binder-filter `403 BINDER_POLICY_DENIED`, missing-or-wrong-tenant binder `404 BINDER_NOT_FOUND`, binder-policy denial on document reads and writes, cross-tenant `404`, wrong-host `404`, invalid title/content/content-type/size validation failures, invalid supersedes validation failures, invalid archive-transition `409`, and `X-Api-Version` / `X-Correlation-Id` headers on document endpoints
- targeted integration coverage that proves binder detail populates `documents` with concrete `DocumentSummary` payloads instead of the CP9 placeholder empty array contract
- targeted integration tests that reject missing CSRF tokens on `POST /api/documents`, `POST /api/documents/{documentId}/archive`, and `POST /api/documents/{documentId}/unarchive`
- any timestamp-sensitive document-order or archive-timestamp assertions must use explicit seeded timestamps first; if existing test helpers are insufficient, tighten those helpers in the same change set rather than relying on raw `DateTimeOffset.UtcNow`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-launch-profiles.ps1`
- manual VS Code and Visual Studio launch verification recorded in the eventual CP10 PR artifact before checkpoint closeout

## Likely Touch Points

- `src/PaperBinder.Migrations/Migrations/`
- `src/PaperBinder.Infrastructure/Persistence/PaperBinderDbContext.cs`
- `src/PaperBinder.Infrastructure/Persistence/PaperBinderPersistenceServiceCollectionExtensions.cs`
- `src/PaperBinder.Infrastructure/Persistence/` with new document storage models
- `src/PaperBinder.Application/Documents/` as a new document-focused slice
- `src/PaperBinder.Infrastructure/Documents/` with Dapper-backed document persistence implementations
- `src/PaperBinder.Api/Program.Partial.cs`
- `src/PaperBinder.Api/PaperBinderBinderEndpoints.cs`
- `src/PaperBinder.Api/` with new document endpoints, document DTOs, and document ProblemDetails mapping
- `src/PaperBinder.Api/PaperBinderErrorCodes.cs`
- `tests/PaperBinder.UnitTests/`
- `tests/PaperBinder.IntegrationTests/`
- `tests/PaperBinder.IntegrationTests/TenantResolutionIntegrationTests.cs` for seeding/test-host helpers
- `docs/10-product/prd.md`
- `docs/10-product/domain-nouns.md`
- `docs/10-product/user-stories.md`
- `docs/20-architecture/data-model.md`
- `docs/20-architecture/policy-authorization.md`
- `docs/20-architecture/frontend-app-route-map.md`
- `docs/30-security/threat-model-lite.md`
- `docs/40-contracts/api-contract.md`
- `docs/40-contracts/api-style.md`
- `docs/50-engineering/data-access-standards.md`
- `docs/80-testing/test-strategy.md`
- `docs/80-testing/testing-standards.md`
- `docs/80-testing/integration-tests.md`
- `docs/80-testing/e2e-tests.md`
- `docs/95-delivery/pr/cp10-document-domain-and-immutable-document-rules/`
- `docs/ai-index.md`
- `docs/repo-map.json`

## Critic Review Resolution Log

- `B1` Accepted and resolved: added the `Vertical-Slice TDD Plan` section with public interfaces under test, planned `RED -> GREEN -> REFACTOR` slices, and the highest-value failing test that starts each slice.
- `B2` Accepted and resolved: binder-filter denial semantics, same-binder supersedes rules, and document summary/detail/archive response shapes are now locked in `Locked Design Decisions` instead of left as recommendations.
- `B3` Accepted and resolved: planned work item 1 now makes API contract completion and review a blocking precondition before broad endpoint implementation begins.
- `N1` Accepted and resolved: the plan now locks explicit `CSRF required: Y` contract annotations and validation coverage for `POST /api/documents`, `POST /api/documents/{documentId}/archive`, and `POST /api/documents/{documentId}/unarchive`.
- `N2` Accepted and resolved: document content is now locked to non-whitespace markdown with a maximum length of `50,000` characters.
- `N3` Accepted and resolved: document title validation is now locked to trimmed length `1-200`, matching the repo's existing binder-name posture.
- `N4` Accepted and resolved: CP10 now explicitly covers a centralized markdown strategy boundary only; preview UI, stored rendered HTML, and frontend rendering remain out of scope, while any required third-party dependency still triggers an ADR in the same change set.
- `N5` Accepted and resolved: document-specific `errorCode` values are now enumerated in `Locked Design Decisions`, with reuse of existing `BINDER_POLICY_DENIED` and `BINDER_NOT_FOUND` where appropriate.
- `N6` Accepted and resolved: planned work and validation now specify deterministic timestamp handling through explicit seeded timestamps first and shared test-helper tightening when the existing seam is insufficient.

No blocker findings remain at the scope-lock stage. Any future change to a locked decision requires revising this plan and the affected canonical docs before implementation begins.

## ADR Triggers And Boundary Risks

- ADR trigger: adding a third-party markdown parsing and sanitization dependency or locking a stored/rendered content pipeline that would be expensive to reverse.
- ADR trigger: changing binder-scoped authorization layering, allowing cross-binder supersedes by default, or otherwise weakening binder as the authorization grouping boundary.
- ADR trigger: introducing durable audit persistence, history tables, or a version-browser model beyond the current immutable-row approach.
- Boundary risk: renaming or reshaping binder-detail `documents` would break the CP9 contract that already shipped as `documents: []`.
- Boundary risk: implementing document lookup by broad `documentId` reads and only later checking tenant or binder policy would violate tenant-isolation rules and is not acceptable.
- Boundary risk: archive visibility must stay consistent across binder detail, document list, and document detail semantics; inconsistent defaults would create reviewer-visible contract drift.
- Boundary risk: pulling markdown work forward into preview UI, rendered-html storage, or frontend route work would break the requested CP10-only scope lock.
- Boundary risk: existing test seed helpers use real-clock defaults in some paths; CP10 tests that assert on ordering or archive timestamps may become flaky unless those seams are tightened as planned.
