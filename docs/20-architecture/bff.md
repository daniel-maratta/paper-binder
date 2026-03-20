# Backend for Frontend (BFF)
Status: V1 (Non-goal)

PaperBinder does not implement a BFF pattern in V1.

## Decision

- React SPA calls the ASP.NET API directly.
- API remains the canonical client contract.

## Guardrails

- Do not introduce a second backend service for frontend composition.
- Do not duplicate domain rules in frontend-only aggregation endpoints.
- Any convenience endpoint must still follow API style and policy rules.

## Alternatives Considered

- Separate BFF service: rejected due to operational overhead.
- BFF inside same host: rejected as unnecessary complexity for V1.
