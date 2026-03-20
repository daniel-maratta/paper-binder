# FD-0001 - Binder Document Detail and Archive Semantics

## AI Summary

- Document content remains immutable after create.
- Document detail and binder detail contracts expose archive state explicitly.
- Archive hides documents from default lists without mutating document content.
- Supersedes chains remain valid regardless of archive/unarchive transitions.

## Status
Resolved — integrated into canonical documentation

## Canonical locations
- docs/40-contracts/api-contract.md
- docs/10-product/prd.md
- docs/10-product/user-stories.md
- docs/20-architecture/data-model.md

## Why this exists
Existing docs define immutable documents and allow archive visibility, but they do not fully define detail-read behavior or archive visibility defaults. Implementation and test work is blocked without a single contract for these semantics.

## Scope
This definition covers:
- Binder detail and document detail read contracts.
- Archive and unarchive state transitions.
- List visibility defaults for archived documents.

This definition does not cover:
- Full document version-history UX.
- In-place content editing.
- Cross-tenant document sharing.

## Decision
Documents remain immutable and archive is modeled as visibility state only.

Rules:
- `GET /api/binders/{binderId}` returns binder metadata and document summaries scoped to current tenant.
- `GET /api/documents/{documentId}` returns full immutable content plus archive metadata.
- Archived documents are excluded from default list responses.
- List endpoints may include archived documents only when `includeArchived=true` is explicitly requested.
- Archive/unarchive changes only archive metadata (`archivedAt` and related audit event) and must never mutate `title`, `contentType`, `content`, or supersedes links.

## User-visible behavior
- Binder and document lists hide archived documents by default.
- Document detail can show that a document is archived.
- Users with write access can archive and unarchive documents.
- Attempting write actions without policy authorization returns `403`.

## API / contract impact
Contract additions/clarifications:
- `GET /api/binders/{binderId}`
- `GET /api/documents/{documentId}`
- `GET /api/documents?binderId={binderId}&includeArchived={bool}` (default `false`)
- `POST /api/documents/{documentId}/archive`
- `POST /api/documents/{documentId}/unarchive`

ProblemDetails expectations:
- `404` for unknown/missing tenant-scoped binder/document.
- `403` for policy denial.
- `409` for invalid archive transition (for example archive already archived document).

## Domain / architecture impact
- Archive state is a mutable lifecycle attribute and not content mutation.
- Tenant-scoped repository queries must apply tenant predicates and archive filters by construction.
- Supersedes chain rules from immutable document ADR remain unchanged.
- Archive/unarchive transitions emit audit events.

## Security / ops impact
- All archive/detail access remains tenant-scoped and policy-gated.
- No tenant identifiers are accepted from client payload for scoping.
- Audit logs must capture archive/unarchive actor, timestamp, and document identity.

## Canonical updates required
- `docs/10-product/prd.md` (document detail/archive semantics section)
- `docs/10-product/user-stories.md` (document slice acceptance criteria)
- `docs/20-architecture/data-model.md` (archive state mutability note)
- `docs/40-contracts/api-contract.md` (detail/archive endpoints and errors)
- `docs/80-testing/e2e-tests.md` and `docs/80-testing/integration-tests.md` (archive visibility tests)

## Open questions
None.

## Resolution outcome
No new ADR required. This definition is aligned with ADR-0001 and existing v1 scope constraints.
