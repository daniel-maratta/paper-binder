# ADR-0012: GHCR Production Deployment And Public Indexing Policy

Status: Accepted

## Context

PaperBinder now has release-validation automation, but it does not yet have a canonical production deployment path.
The current public production and shared-test environments are still manually deployed from checked-out source with locally built images.
The repo needs a canonical production deployment contract that avoids host-local source checkouts as the long-term production artifact source.
The deployment path must stay simple, reproducible, and low-cost while avoiding host-local source checkouts as the production artifact source.

## Decision

Keep the single-host Docker Compose topology from ADR-0004, and add these environment policies:

- Production deployments use immutable, versioned OCI images published to GitHub Container Registry (GHCR).
- The deployable runtime set is the app host, worker, migrations executable, and any repo-owned proxy image required for wildcard-TLS termination.
- The production droplet deploys tagged GHCR images, not a mutable git checkout built in place on the host.
- Production runs on a dedicated public host rooted at the configured production base domain.
- The shared test environment remains separate at its own configured shared-test base domain.
- Production is indexable by default. The shared test host remains intentionally non-indexable via `robots.txt` and `X-Robots-Tag`.
- Release validation and production deployment stay separate. Tag validation may prepare a release artifact, but production rollout remains an owner-approved step.

## Why

- GHCR keeps the production artifact immutable and tied to a reviewed tag.
- Deploying images is faster, more repeatable, and easier to roll back than rebuilding from a host-local checkout.
- A separate production droplet avoids coupling reviewer-facing uptime to test traffic, test config churn, or test-only indexing policy.
- Indexable production behavior matches the purpose of a public hiring artifact, while the shared test host stays available for validation without attracting search traffic.

## Alternatives Considered

- Build from a git checkout on the production droplet: rejected because it weakens reproducibility and rollback discipline.
- Reuse the shared test droplet for production: rejected because it couples environments and raises deployment risk.
- Keep production non-indexable: rejected because the public production host is intended to be discoverable.

## Consequences

- Production deployment automation should build and publish GHCR images before any remote rollout step.
- The repo must eventually add explicit production deployment artifacts and workflows that reference GHCR rather than host-local source checkouts.
- Production and shared test now have intentionally different crawler behavior and hostname configuration, so docs and config examples must keep those environments distinct.
- This ADR defines the intended deployment contract. It does not mean the current live public hosts have already adopted the GHCR-backed production runtime.
