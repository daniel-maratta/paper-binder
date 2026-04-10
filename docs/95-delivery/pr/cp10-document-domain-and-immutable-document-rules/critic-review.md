# CP10 Critic Review

Reviewer: Critic
Date: 2026-04-10
Revision: 3 (post-implementation review)
Input: `docs/95-delivery/pr/cp10-document-domain-and-immutable-document-rules/implementation-plan.md`, `docs/95-delivery/pr/cp10-document-domain-and-immutable-document-rules/critic-review.md` (revision 2), current diff, author notes
Gate: Post-Implementation (pre-merge)

---

## Verdict

**Ship-ready.** No blocking findings. The implementation matches all locked design decisions, enforces tenant isolation by SQL construction, has correct DB constraints, and is covered by 21 unit tests and 14 Docker-backed integration tests. The API contract is complete and accurate, and canonical docs are synchronized in the same change set.

Manual VS Code and Visual Studio launch verification remains outstanding as the only gating item before checkpoint closure; this is author-acknowledged and does not affect code correctness.

---

## Blocking Findings

None.

---

## Non-Blocking Findings

### N1. No explicit integration test for archive/unarchive binder-policy denial

The `Should_ReturnForbidden_When_DocumentBinderPolicyDeniesSameTenantCaller` test proves binder-policy denial on `GET /api/documents/{documentId}`. The `Should_ReturnForbidden_When_DocumentWriteTargetsBinderDeniedByBinderPolicy` test proves binder-policy denial on `POST /api/documents`. However, there is no integration test that proves `POST /api/documents/{documentId}/archive` or `POST /api/documents/{documentId}/unarchive` returns `403 BINDER_POLICY_DENIED` when the document's binder restricts the caller.

Risk is low because archive and unarchive share the same `GetDocumentAccessStateAsync` code path that is already tested through the detail endpoint. The missing test would confirm the end-to-end wiring rather than the logic itself.

### N2. No explicit integration test for binder-filtered document list success path

The binder-filtered list path (`GET /api/documents?binderId=...`) is tested at the integration level only for failure cases: `403 BINDER_POLICY_DENIED` and `404 BINDER_NOT_FOUND`. The unfiltered list and binder-detail tests exercise the shared `ListForBinderCoreAsync` SQL, but no integration test calls `GET /api/documents?binderId=X` where X is an accessible binder and asserts the returned document set.

Risk is low because the underlying SQL path is the same one exercised by binder detail, and the failure-case tests prove the access-check wiring is correct.

### N3. Overlength title validation covered only at unit level

The unit test `DocumentRules_Should_RejectOverlengthTitles` exercises the 200-character title limit. The integration test `Should_RejectDocumentCreate_When_RequestPayloadIsInvalid` covers whitespace-only titles but does not include an overlength title case. Adding an overlength case to the invalid-payload integration test would tighten the end-to-end proof but is not required since the validation rule itself is directly tested.

---

## Residual Risks

### R1. Manual launch verification not yet recorded

Manual VS Code and Visual Studio launch verification is still outstanding. This is acknowledged by the author and is a checkpoint-closure gating item, not a code-correctness issue.

### R2. `IMarkdownDocumentRenderer` is registered but not consumed in CP10 runtime paths

`HtmlEncodingMarkdownDocumentRenderer` is DI-registered as a singleton and implements a centralized rendering boundary, but no CP10 endpoint or service consumes it. This is consistent with the locked design decision that CP10 establishes the strategy boundary only. Future consumers should verify renderer behavior when wiring it in, and any richer markdown-parser dependency still requires an ADR.

### R3. `ListForBinderAsync` does not independently enforce binder-local policy

`IDocumentService.ListForBinderAsync` is an internal method that returns documents for a binder without checking binder-local policy. The single current call site (`GetBinderAsync` in binder endpoints) verifies binder access through `binderService.GetDetailAsync` before calling this method. If a future call site omits the access check, documents from restricted binders could be returned. The method signature takes `TenantContext` so tenant isolation is always enforced, but binder-local policy is the caller's responsibility.

---

## Post-Implementation Checklist Verification

- [x] All five document endpoints return correct request/response shapes matching the locked contract.
- [x] `POST /api/documents` enforces CSRF, tenant scope, binder existence, `contentType` = `markdown`, trimmed title 1-200, non-whitespace content max 50,000, and immutability (no row mutation). Returns `201` with `DocumentDetail`.
- [x] `SupersedesDocumentId` validation enforces same-tenant, same-binder constraint and leaves the superseded document unchanged. DB FK and check constraints provide a second enforcement layer.
- [x] `GET /api/documents` default excludes archived; `includeArchived=true` includes them; unfiltered list omits restricted-binder documents via `binder_policies` JOIN; `binderId` filter returns `403 BINDER_POLICY_DENIED` for policy-denied binders and `404 BINDER_NOT_FOUND` for missing/wrong-tenant binders.
- [x] `GET /api/documents/{documentId}` enforces tenant scope, endpoint policy, and binder-local policy; wrong-tenant returns `404`; archived documents are accessible by direct ID. Contract note at line 435 explicitly documents this.
- [x] Archive/unarchive endpoints enforce `BinderWrite`, CSRF, return `DocumentDetail` on success, and return `409` for invalid transitions (`DOCUMENT_ALREADY_ARCHIVED` / `DOCUMENT_NOT_ARCHIVED`). `FOR UPDATE` lock prevents TOCTOU on archive transitions.
- [x] `GET /api/binders/{binderId}` returns concrete `DocumentSummary` items in `documents` with archived documents hidden by default.
- [x] Cross-tenant document IDs, wrong-host requests, and client-supplied tenant hints never succeed. All queries scope by `tenant_id` in SQL by construction.
- [x] All nine document-specific `errorCode` values appear in `docs/40-contracts/api-contract.md` and match `PaperBinderErrorCodes.cs` and `PaperBinderDocumentProblemMapping.cs`.
- [x] Nullable fields (`supersedesDocumentId`, `archivedAt`) are explicitly represented as `null` in contract examples.
- [x] Integration tests cover: create success, create validation failures (5 cases), list with archive filtering, `includeArchived=true`, binder-detail summary population, binder-filter `403`, binder-filter wrong-tenant `404`, write denied by binder policy, archived document detail by direct ID, read denied by binder policy, cross-tenant `404`, supersedes valid case, supersedes cross-binder and unknown invalid, superseded document unchanged, archive/unarchive success with immutability assertion, invalid archive transition `409`, CSRF rejection on all three unsafe routes, wrong-host `404`, and `X-Api-Version` / `X-Correlation-Id` on all document endpoints.
- [x] Unit tests cover: title normalization (valid/blank/overlength), content validation (required/overlength), content-type validation (exact match), archive-transition rules (all four combinations), document problem mapping (409/403), and document response mapping (nullable fields).
- [x] No filter-after-fetch patterns for tenant, binder, or archive visibility. All predicates applied in SQL.
- [x] Canonical docs updated in the same change set: product (`prd.md`, `domain-nouns.md`, `user-stories.md`), architecture (`data-model.md`, `frontend-app-route-map.md`, `policy-authorization.md`), security (`threat-model-lite.md`), contracts (`api-contract.md`, `api-style.md`), engineering (`data-access-standards.md`), testing (`test-strategy.md`, `integration-tests.md`), execution (`checkpoint-status.md`), and delivery artifacts.
- [x] `docs/ai-index.md` and `docs/repo-map.json` reflect new files and structural changes.
- [x] No references to private sibling repos, private paths, or proprietary workflow names in any committed artifact. Verified via case-insensitive grep.
- [x] Build, test (including Docker-backed integration), docs validation, and launch-profile validation all pass per author-reported evidence.
- [ ] Manual VS Code and Visual Studio launch verification recorded in the PR artifact. **Outstanding — required before checkpoint closure.**

---

## Required Fixes Before Merge

None. The three non-blocking findings (N1-N3) are thin-coverage observations that do not affect correctness or safety. They can be addressed opportunistically in future checkpoints if desired.

---

## Locked Decision Compliance

All locked decisions from the implementation plan are correctly implemented:

- Reuse `BinderRead`/`BinderWrite` policies; no new v1 roles. ✓
- Three-layer authorization preserved (tenant context, endpoint policy, binder-local policy). ✓
- No `PUT`/`PATCH` document content mutation in v1. ✓
- Archive/unarchive mutates `archived_at_utc` only; title, content, contentType, binderId, and supersedes metadata are never modified. ✓
- Archived documents hidden by default in list and binder-detail contexts; included only with `includeArchived=true`. ✓
- Binder-detail `documents` field name preserved from CP9 contract. ✓
- `DocumentSummary` and `DocumentDetail` field sets match the locked shapes. ✓
- `GET /api/documents?binderId=...` returns `403 BINDER_POLICY_DENIED` for policy-denied binders; unfiltered list omits restricted-binder documents. ✓
- `SupersedesDocumentId` enforces same-tenant, same-binder; DB FK and application-layer validation both enforce this. ✓
- Document title: trimmed, 1-200 characters. ✓
- Document content: non-whitespace markdown, max 50,000 characters, stored as raw markdown. ✓
- `contentType` must be exact value `markdown`. ✓
- CSRF required on all three document POST routes. ✓
- All nine document-specific `errorCode` values present; `BINDER_POLICY_DENIED` and `BINDER_NOT_FOUND` reused. ✓
- Markdown strategy boundary established; no third-party dependency introduced; no ADR required. ✓
- Runtime entrypoints take `TenantContext` explicitly; tenant and binder predicates applied in SQL by construction. ✓
- No filter-after-fetch for tenant, binder, or archive visibility scope. ✓
- CP10 remains backend/domain/docs/testing only; no worker, lease, or frontend work pulled forward. ✓

No conflicts with AGENTS.md hard invariants, ADR-0001, the data model doc, the data access standards, or the non-goals list.

---

## Schema And Migration Review

The migration `202604090001_AddDocumentsAndDocumentRules` creates the `documents` table with:

- PK on `id`. ✓
- Composite alternate keys `(tenant_id, id)` and `(tenant_id, binder_id, id)` supporting FK targets. ✓
- FK to `binders` via `(tenant_id, binder_id)` preventing cross-tenant binder linkage. ✓
- Self-referencing FK via `(tenant_id, binder_id, supersedes_document_id)` preventing cross-binder supersedes. ✓
- Check constraints: title not blank, content type `markdown`, content not blank, content length <= 50,000, supersedes not self. ✓
- Indexes aligned to documented query paths: tenant+created, tenant+binder+archived+created, tenant+binder+supersedes. ✓
- EF model in `PaperBinderDbContext` matches the migration. ✓
- DB snapshot updated. ✓
- Migration workflow test updated for new expected migration count. ✓

---

## Private-Boundary Scan

Case-insensitive grep for private sibling-repo names and path patterns returned no results in the paper-binder repository. No private-boundary leakage detected.
