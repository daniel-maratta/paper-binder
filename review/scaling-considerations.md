# Scaling Considerations (Reviewer Summary)

PaperBinder v1 is intentionally small, but the architecture leaves room for controlled scaling.

This is not a roadmap; it is a constraint-aware list of likely scale paths if demand justifies them.

## Current Baseline

- Single PostgreSQL database.
- API and worker as separate deployables.
- Client-rendered SPA with direct API calls.
- Strict tenant-scoped data access and authorization.

## Scaling Levers That Preserve Core Boundaries

- Horizontally scale API instances (stateless request handling).
- Scale worker processing cadence and throughput for lease cleanup.
- Add targeted indexes and query tuning for tenant-scoped access patterns.
- Introduce read replicas for read-heavy workloads when consistency requirements allow.
- Add bounded caching for stable, high-read responses with tenant-safe keys.

## Guardrails During Scaling

- Do not weaken tenant isolation for performance shortcuts.
- Keep tenant context server-authoritative and immutable per request.
- Preserve API-boundary authorization and policy semantics.
- Keep operational complexity proportional to observed need.

## Canonical References

- `docs/20-architecture/system-overview.md`
- `docs/20-architecture/deployment-topology.md`
- `docs/20-architecture/tenancy-model.md`
- `docs/20-architecture/worker-jobs.md`
- `docs/90-adr/ADR-0004-public-demo-deployment-topology.md`
