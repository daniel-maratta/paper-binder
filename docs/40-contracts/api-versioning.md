# API Versioning
Status: Current (v1)

This document defines how PaperBinder negotiates and evolves HTTP API versions.
This file is the PaperBinder-specific versioning policy for current `/api/*` behavior.

## Contract

- Versioning model: major-version negotiation for `/api/*` routes.
- Request header for `/api/*`: `X-Api-Version`.
- Current supported major version: `1`.
- If `X-Api-Version` is omitted, server defaults to `1` in v1.
- `/api/*` response header: `X-Api-Version` is always returned with the negotiated version.
- Non-API routes (SPA HTML/assets and health endpoints) do not participate in API version negotiation.

## Unsupported Versions

- If `X-Api-Version` is malformed or unsupported on `/api/*`, return `400 Bad Request`.
- Response body must be RFC 7807 ProblemDetails with:
  - `errorCode`: `API_VERSION_UNSUPPORTED`
  - `traceId`
  - `correlationId`
- `detail` should indicate supported versions.

## Evolution Rules

- Breaking API changes require a new major version.
- Non-breaking additions remain within the current major version.
- New major versions run in parallel for a defined deprecation window.
- Deprecation and sunset behavior should use standard HTTP headers when enabled:
  - `Deprecation`
  - `Sunset`

## Non-goals (v1)

- No per-endpoint version pinning differences.
- No media-type versioning.
- No query-string versioning.
