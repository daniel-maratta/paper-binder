# ADR-0004: Public Demo Deployment Topology

Status: Accepted

## Context

PaperBinder is hosted publicly as a demo at `lab.danielmaratta.com`. The system must be cheap to operate, simple to deploy, and credible to reviewers.

## Decision

Use a single-host deployment topology:
- Reverse proxy at the edge for TLS termination and host routing
- Single ASP.NET app serving SPA + API
- PostgreSQL on the same host
- Background cleanup job as in-process or separate container

## Rationale

- Minimizes operational complexity and cost
- Supports subdomain-based tenancy routing
- Provides realistic deployment credibility without full production commitments

## Alternatives considered

- Local-only deployment: reduces ops burden but loses public credibility.
- Full cloud-native stack (Kubernetes/managed services): too complex for the demo scope.
- Serverless: complicates tenancy and stateful DB semantics for minimal gain.

## Consequences

- Operational simplicity is high; scalability is intentionally limited.
- Abuse controls and rate limiting are important due to public exposure.
