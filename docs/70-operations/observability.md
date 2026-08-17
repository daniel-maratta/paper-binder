# Observability

## Baseline

- OpenTelemetry is the standard for tracing and telemetry correlation.
- API, worker, and representative database execution paths emit PaperBinder-owned trace activity in the current build.
- Development and Test export target: console.
- Optional export target: OTLP endpoint when `PAPERBINDER_OTEL_OTLP_ENDPOINT` is configured.
- Compose-managed container stdout/stderr logs use Docker's `local` logging driver with `max-size=10m` and `max-file=5` in the repo-owned Compose files.
- GoatCounter provides cookie-less aggregate usage analytics for the production public demo and workspace UI through PaperBinder-owned direct `/count` image requests ([ADR-0016](../90-adr/ADR-0016-goatcounter-usage-analytics.md)). It is controlled by the production-only frontend build flag `VITE_PAPERBINDER_ANALYTICS_ENABLED=true`, is separate from OpenTelemetry diagnostics, and does not require executing GoatCounter JavaScript in authenticated workspace pages.

## Correlation Contract

- Include `tenant_id`, `user_id`, `trace_id`, and `correlation_id` in logs/traces wherever available.
- Include `actor_user_id`, `effective_user_id`, and `is_impersonated` only where impersonation context exists.
- Accept client-supplied `X-Correlation-Id` when valid; otherwise generate one.
- Return `X-Correlation-Id` on every HTTP response (API and non-API routes).
- HTTP requests, application handlers, database calls, and worker jobs must preserve correlation.
- ProblemDetails responses must include `traceId` and `correlationId` extensions.
- Background jobs must create their own root spans per run and child spans for significant steps.

## Minimum Metrics

- `paperbinder_security_denials_total` with labels `reason`, `surface`
- `paperbinder_rate_limit_rejections_total` with labels `policy`, `surface`
- `paperbinder_cleanup_cycles_total` with label `result`
- `paperbinder_cleanup_tenants_total` with label `result`

## Privacy and Sampling

- No PII in logs/traces by default.
- Demo sampling strategy is always-on unless a measured reason requires change.
- Container logs are retained according to the Compose logging driver limits, plus any provider snapshots, backups, deployment logs, or external telemetry retention that the operator enables.
- Usage analytics paths must use explicit public route paths, tenant route templates, or approved low-cardinality public event names, and must not include tenant slugs, user ids, binder ids, document ids, user-provided names, document titles, document content, query strings, URL fragments, or form values.
- Usage analytics must remain disabled in local, E2E, and shared-test builds by setting or defaulting `VITE_PAPERBINDER_ANALYTICS_ENABLED=false`.
- GoatCounter individual pageview collection for the `paperbinder` site was manually verified disabled on 2026-08-17 and must remain disabled unless a future ADR and public legal update explicitly approve that wider analytics surface.

## Guardrails

- Instrumentation should remain minimal and explicit.
- Add new telemetry only when it improves diagnosability for security/tenant boundaries or operational incidents.
- Never emit secrets, credentials, connection strings, or raw tenant document content in traces, logs, or metrics.
- Metric labels must stay low-cardinality; do not use tenant ids, user ids, actor ids, effective ids, correlation ids, route parameters, or free-form strings as metric labels.
