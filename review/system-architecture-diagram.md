# System Architecture (Reviewer Summary)

This document provides a high-level architecture view for reviewers.

For canonical details, see `docs/20-architecture/system-overview.md` and related references at the end of this file.

Scope note: this file is topology-focused. Security trust/failure semantics live in `review/security-model-summary.md`.

## Runtime Topology

```text
[Browser SPA]
      |
      | HTTPS
      v
[ASP.NET Core API] ------> [PostgreSQL]
      ^                         ^
      |                         |
      +------ [Worker] ---------+
```

## Key Boundaries

- Frontend boundary: React SPA is client-rendered and calls API endpoints directly.
- API boundary: policy-based authorization happens at the API boundary before handler execution.
- Tenancy boundary: tenant context is resolved early from host plus membership and is immutable per request.
- Persistence boundary: tenant-owned queries are explicitly tenant-scoped; no filter-after-fetch for isolation.
- Worker boundary: lease cleanup runs in system context and must not impersonate end users.

## Intentional Exclusions (v1)

- No backend-for-frontend layer.
- No server-side rendering.
- No realtime push infrastructure.
- No cross-tenant data-sharing paths.

## Canonical References

- `docs/20-architecture/system-overview.md`
- `docs/20-architecture/boundaries.md`
- `docs/20-architecture/deployment-topology.md`
- `docs/20-architecture/frontend-spa.md`
- `docs/20-architecture/worker-jobs.md`
- `docs/90-adr/ADR-0019-no-bff.md`
- `docs/90-adr/ADR-0023-frontend-runtime-tooling-and-realtime-boundaries.md`
