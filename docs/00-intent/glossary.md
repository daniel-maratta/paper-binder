# Glossary
Status: Current

## Scope
- Define stable product and architecture terms used across docs.
- Keep terminology consistent across lanes.

## Non-goals
- No historical changelog of term meanings.
- No implementation-level API reference.

## Terms

### Tenant
The isolated demo environment and the actual security/data-scoping boundary in PaperBinder. Every tenant-owned row and query is scoped by `tenant_id`; tenant isolation is enforced by construction, not post-fetch filtering. See `docs/20-architecture/tenancy-model.md` and `docs/30-security/tenant-isolation.md`.

### Tenant context
The immutable, request-scoped value materialized on the server after the request host resolves to a tenant slug/id and (for authenticated routes) tenant membership is validated. Downstream code reads tenant scope from this context, never from client-supplied identifiers. See `docs/20-architecture/tenancy-resolution.md`.

### Tenant lease
The time-boxed lifecycle of a demo tenant: expires 60 minutes after provisioning, may be extended (up to 3 times, +15 minutes each) only when remaining lease is <= 10 minutes, and is hard-deleted by the worker after expiry (purge may defer briefly for recent authenticated activity). See `docs/20-architecture/demo-tenant-lease.md`.

### Workspace
The product-facing (UI/copy) term for a tenant. "Workspace name," "Workspace dashboard," and "Workspace ready" all refer to the same tenant that architecture and security docs call a tenant. Use "tenant" when writing about isolation/security/data-scoping; use "workspace" when writing about what a reviewer or demo user sees in the product.

### Binder
A named grouping of documents within a tenant. Binders carry an access policy (see Binder policy) and are the primary organizational unit a tenant user interacts with.

### Document
An immutable, DB-backed text record that belongs to a binder. Documents are never edited in place; a revision is created as a new document that supersedes the prior one via an explicit `supersedesDocumentId` chain (see `ADR-0001`). There is no file upload/binary storage path.

### View-as / Impersonation
A tenant-admin-only feature that lets an admin act as another user within the same tenant to verify RBAC/policy behavior. Impersonation is tenant-local only (no cross-tenant impersonation), server-controlled, and carried solely by the existing signed auth cookie/trusted server context — the browser never supplies impersonation identity. See `ADR-0002`.

### Actor user / Effective user
Two identities tracked on every request and threaded through command records: the actor is the real authenticated user who is logged in; the effective user is the identity the request is acting as (equal to the actor unless impersonation is active, in which case it is the impersonated user). Commands also carry an `IsImpersonated` flag so structured logs and audit rows stay accurate during impersonation instead of attributing everything to the actor.

### Caller role
An explicit `TenantRole` field carried by some command/query records (for example `BinderRenameCommand`, `DocumentCreateCommand`, `DocumentListQuery`). It is not an endpoint-level authorization check — that is already enforced at the API boundary before the application service runs. Caller role exists solely so the service can evaluate the binder-level policy layer (see Binder policy) for the specific binder/document in scope.

### Binder policy / restricted_roles
A second, binder-scoped authorization layer evaluated after endpoint-level policy has already passed. Mode `inherit` (default) means the endpoint policy alone governs access. Mode `restricted_roles` adds an explicit allow-list of roles for that specific binder; callers whose role isn't on the list are denied (or, for list endpoints, the binder/document is silently omitted rather than returning a denial marker). See `docs/20-architecture/policy-authorization.md`.

### Application service
PaperBinder's application-layer pattern: interfaces such as `IBinderService` and `IDocumentService`, invoked directly through DI from Minimal API endpoints. There is no mediator, dispatcher, or handler-pipeline abstraction (no MediatR or equivalent) — endpoints construct a command/query record and call the service method directly. See Command record / Query record / Outcome record, and `docs/50-engineering/tech-stack.md`.

### Command record / Query record / Outcome record
The three record shapes application services use. A command record (for example `BinderCreateCommand`) carries tenant context, actor/effective user identity, the impersonation flag, and the mutation payload. A query record (for example `DocumentListQuery`) exists only where a dedicated record clarifies filtering semantics; most reads instead take plain method parameters. An outcome record (for example `BinderCreateOutcome`) is the explicit success/failure result a service method returns, so endpoints handle failure by inspecting the outcome rather than catching exceptions.

### Historical artifact
A document retained in the repository for provenance and audit trail, not current product, architecture, release, or reviewer guidance. Historical artifacts (CP-era checkpoint PR records, resolved feature definitions, superseded presentation docs, etc.) are marked as such and point to whatever canonical document now supersedes them; start with current canonical docs, not historical artifacts, unless you specifically need provenance.

### ADR
Architecture Decision Record (`docs/90-adr/`). Records a decision that is expensive to reverse, along with its context and consequences. An approved ADR is binding unless a newer ADR explicitly supersedes it.
