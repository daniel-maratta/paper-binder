# Tech Stack (Canonical Baseline)
Status: V1 (Authoritative)

## AI Summary

- This is the canonical default stack for implementation decisions.
- Code agents and contributors must consult this document before implementing.
- Tech changes require explicit permission first, then an ADR, then synchronized doc updates.
- Stack entries are extracted from existing canonical docs and ADRs.

## Purpose

Define the full PaperBinder V1 technology baseline and governance rules for changing it.
This file is the PaperBinder-specific stack lock for the public demo system.

This document is implementation-governing and should be treated as required reading before adding or changing frameworks, libraries, infrastructure tools, or integration patterns.

## Governing Principles

1. Default-first principle
   - The stack below is the default implementation baseline for the repository.
   - Before implementing any feature, consult this file and relevant lane docs/ADRs.

2. Permission-then-ADR principle
   - If a code agent or contributor needs to change, replace, or add significant technology, they must request explicit approval first.
   - If approved, they must create an ADR and propagate updates to canonical docs in the same change set.

3. Conservative dependency principle
   - Prefer built-in platform capabilities first; justify third-party additions clearly.

## Canonical V1 Stack

### Backend Application

- ASP.NET Core (API host and worker runtime)
- ASP.NET Core Identity (authentication and identity management)
- Policy-based authorization at API boundary
- Internal CQRS dispatcher, not MediatR

### Frontend Application

- React SPA
- Vite (frontend build tool)
- TypeScript
- Tailwind CSS
- Radix UI primitives
- React Router for client-side SPA routing only
- No framework mode / no route-module server loaders/actions in V1
- No BFF pattern in V1 (ADR-0005)
- No SignalR/realtime push channels in V1
- Baseline forms: native controlled/uncontrolled React with lightweight validation
- `react-hook-form` + `zod` are not baseline dependencies in V1
- Node version pinned by repo `.nvmrc`
- npm pinned by `package.json` `packageManager` and `engines`

Frontend UI stack lock-in is defined by this stack baseline plus the PaperBinder product UI contracts.

### Data and Persistence

- PostgreSQL (single shared database with tenant scoping)
- Dapper for runtime queries/commands
- EF Core for migrations/tooling only (no EF runtime query path)

### API and Protocol Contracts

- RFC 7807 ProblemDetails for error payloads
- API version negotiation via `X-Api-Version` on `/api/*` routes
- Request/response correlation via `X-Correlation-Id`
- Cookie-based cross-subdomain authentication only in V1 (no JWT)

### Security and Abuse Controls

- Server-resolved tenancy from host + membership
- Cloudflare Turnstile (or equivalent challenge) on root-host pre-auth actions
- ASP.NET Core rate limiting middleware (preferred posture in security docs)
- CSRF protections required for unsafe methods with cookie auth

### Observability

- OpenTelemetry for tracing/telemetry
- Console exporter in development
- Optional OTLP exporter when configured
- Correlation fields in logs/traces: tenant/user/trace/correlation identifiers

### Operations and Deployment

- Docker Engine + Docker Compose
- Caddy reverse proxy
- Cloudflare DNS (DNS-only mode)
- DigitalOcean droplet (or equivalent single VM)
- Tailscale for administrative SSH access
- UFW host firewall

### Testing and Quality

- `dotnet test` for unit/integration test execution
- PostgreSQL test container for integration tests
- Playwright preferred for E2E (Cypress acceptable alternative)
- Environment-gated test challenge bypass (`PB_ENV=Test`) only

### AI Subsystem (Optional, V1-bounded)

- Application-layer AI orchestration boundary
- Provider abstraction contract (`IAiProvider`) with infrastructure adapters
- Provider portability target includes OpenAI/Azure OpenAI/future providers
- No vector database requirement in V1

## Explicitly Out of Stack (V1)

- JWT-based auth flows
- Dedicated BFF service/layer
- SignalR/realtime push channels
- MediatR dependency
- Kubernetes/multi-region orchestration
- Redis/distributed limiter requirement
- Paid observability platform requirement

## Change Workflow for Stack Updates

1. Identify required stack change and reason.
2. Request explicit approval before implementation.
3. If approved, create/update ADR with context, decision, and consequences.
4. Update this file and all impacted canonical docs in the same change set.
5. Update `docs/ai-index.md`, `docs/repo-map.json`, lane guides, and `CHANGELOG.md`.

## Source Documents

- `README.md`
- `docs/10-product/prd.md`
- `docs/20-architecture/system-overview.md`
- `docs/20-architecture/frontend-spa.md`
- `docs/20-architecture/deployment-topology.md`
- `docs/30-security/rate-limiting-abuse.md`
- `docs/40-contracts/api-contract.md`
- `docs/70-operations/deployment.md`
- `docs/70-operations/observability.md`
- `docs/80-testing/e2e-tests.md`
- `docs/80-testing/integration-tests.md`
- `docs/60-ai/ai-subsystem-overview.md`
- `docs/60-ai/ai-architecture.md`
- `docs/90-adr/ADR-0005-no-bff.md`
