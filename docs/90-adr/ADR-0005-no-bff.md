# ADR-0005: No Backend-for-Frontend Pattern

Status: Accepted

## Context

PaperBinder uses a React SPA with a single ASP.NET API. The system is a public demo and prioritizes simplicity.

## Decision

Do not implement a BFF pattern in V1. The SPA calls the API directly.

## Rationale

- Reduces deployment surface area and complexity
- Keeps API as the canonical interface
- Minimizes drift and duplicated logic

## Alternatives considered

- Separate BFF service: extra moving parts and operational overhead.
- BFF inside the same host: can blur boundaries and increases complexity without clear V1 value.

## Consequences

- API design discipline matters (consistent endpoints and error model).
- Frontend must handle composition with ordinary API calls.
