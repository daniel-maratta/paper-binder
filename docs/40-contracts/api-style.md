# API Style
Status: V1

This document defines API conventions for consistent behavior across endpoints.
This file is the PaperBinder-specific binding for route, tenancy, and behavior details.

## Scope

In scope:
- Route conventions and HTTP semantics.
- Error model conventions.
- Tenancy/auth expectations at API boundary.
- API versioning conventions.
- PaperBinder endpoint semantics and routing constraints.

Out of scope:
- SDK generation.
- HATEOAS.
- Formal OpenAPI governance in V1.

## Tenancy Rules

- Tenant scope is resolved server-side from host/subdomain + membership.
- API routes must not include tenant identifiers.
- Request body/query/header tenant identifiers are not trusted for scoping.

## Authentication and Authorization

- Pre-auth endpoints are root-host only.
- Tenant endpoints require authentication and policy authorization.
- Challenge checks are anti-abuse friction, not an auth substitute, and they remain CP7 work in the current build.

## Route Conventions

- HTTP API endpoints use the `/api/*` prefix.
- Prefer noun-based resources:
  - `/api/binders`
  - `/api/documents`
- Pre-auth API routes also remain under `/api/*`:
  - `/api/provision`
  - `/api/auth/login`
- Allow action routes only when resource semantics require it:
  - `/api/tenant/lease/extend`
- Use stable IDs for resource identifiers.

## HTTP Semantics

- `GET`: safe and idempotent.
- `POST`: create or action.
- `DELETE`: delete where supported.
- V1 document content is immutable (no content update endpoint).

## API Versioning

- Canonical versioning contract: `docs/40-contracts/api-versioning.md`.
- Version negotiation applies to `/api/*` routes only.
- Request header on `/api/*`: `X-Api-Version`.
- In v1, omitted version defaults to `1`.
- Unsupported/malformed versions on `/api/*` return `400` ProblemDetails with stable error code `API_VERSION_UNSUPPORTED`.
- `/api/*` responses include the negotiated version in `X-Api-Version`.
- Invalid-version error responses still emit `X-Api-Version: 1`.
- Unmatched `/api/*` routes return `404` ProblemDetails rather than falling through to SPA fallback behavior.
- Non-API routes (SPA HTML/assets and health endpoints) do not participate in API version negotiation.

## Non-API Operational Endpoints

- Operational endpoints are outside `/api/*` and therefore outside API version negotiation.
- Health endpoints:
  - `/health/live`
  - `/health/ready`
- Health endpoints are anonymous and must not leak dependency internals or service version metadata.

## Error Model

- Use RFC 7807 ProblemDetails.
- Include standard fields (`type`, `title`, `status`, `detail`, `instance`).
- Optional extensions:
  - `errorCode`
  - `traceId`
  - `correlationId`

## Rate Limiting Semantics

- Return `429` with ProblemDetails.
- Include `Retry-After` when applicable.

## Correlation Headers

- Request header: `X-Correlation-Id` (optional client-supplied correlation token).
- Client values are reused only when they are single visible ASCII tokens with no whitespace/control characters and length `1-64`; otherwise the server generates a replacement correlation ID.
- Response header: `X-Correlation-Id` (always present).
- ProblemDetails payloads must include both `traceId` and `correlationId`.

## Alternatives Considered

- Tenant identifiers in routes: rejected; conflicts with tenancy model.
- GraphQL in V1: rejected; unnecessary complexity for current scope.
- Query-string versioning: rejected; header-based version negotiation is the canonical contract.
