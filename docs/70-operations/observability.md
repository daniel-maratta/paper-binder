# Observability

## Baseline

- OpenTelemetry is the standard for tracing and telemetry correlation.
- Development export target: console.
- Optional export target: OTLP endpoint when configured.

## Correlation Contract

- Include `tenant_id`, `user_id`, `trace_id`, and `correlation_id` in logs/traces wherever available.
- Accept client-supplied `X-Correlation-Id` when valid; otherwise generate one.
- Return `X-Correlation-Id` on every HTTP response (API and non-API routes).
- HTTP requests, application handlers, database calls, and worker jobs must preserve correlation.
- ProblemDetails responses must include `traceId` and `correlationId` extensions.
- Background jobs must create their own root spans per run and child spans for significant steps.

## Privacy and Sampling

- No PII in logs/traces by default.
- Demo sampling strategy is always-on unless a measured reason requires change.

## Guardrails

- Instrumentation should remain minimal and explicit.
- Add new telemetry only when it improves diagnosability for security/tenant boundaries or operational incidents.
