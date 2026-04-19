# ADR-0011: Observability OpenTelemetry Baseline

Status: Accepted

## Context

CP16 closes the gap between the observability docs and the shipped runtime. Before CP16, PaperBinder documented OpenTelemetry correlation, but the runtime had no OpenTelemetry packages, no exporter wiring, and no locked metric vocabulary. The checkpoint needs a small real baseline that helps debug tenant/auth boundaries, worker cleanup, and representative database execution without widening into a vendor platform or a broad telemetry program.

## Decision

Use a minimal OpenTelemetry baseline for PaperBinder v1:

- runtime packages:
  - `OpenTelemetry.Extensions.Hosting`
  - `OpenTelemetry.Instrumentation.AspNetCore`
  - `OpenTelemetry.Exporter.Console`
  - `OpenTelemetry.Exporter.OpenTelemetryProtocol`
- API host instrumentation covers inbound ASP.NET Core requests and carries PaperBinder correlation tags only after those values are established safely.
- Worker host instrumentation creates cleanup-cycle spans and exports through the same baseline.
- Representative database connection and transaction seams are instrumented manually through a PaperBinder-owned `ActivitySource` instead of broad automatic database instrumentation.
- Development and Test default to console export.
- OTLP export is optional and activates only when `PAPERBINDER_OTEL_OTLP_ENDPOINT` is configured.
- Structured logs keep the stable fields `event_name`, `tenant_id`, `user_id`, `trace_id`, and `correlation_id`; impersonation-aware events may also include `actor_user_id`, `effective_user_id`, and `is_impersonated`.
- Metrics are locked to:
  - `paperbinder_security_denials_total` with labels `reason`, `surface`
  - `paperbinder_rate_limit_rejections_total` with labels `policy`, `surface`
  - `paperbinder_cleanup_cycles_total` with label `result`
  - `paperbinder_cleanup_tenants_total` with label `result`
- Metric labels must stay low-cardinality and must not use tenant ids, user ids, actor ids, effective ids, correlation ids, route parameters, or free-form strings.

## Why

- Makes the shipped observability docs true without introducing a vendor dependency.
- Covers the most reviewer-relevant seams: request boundaries, tenant/auth denial paths, representative database execution, and worker cleanup.
- Keeps telemetry reviewable by constraining both the instrumentation surface and the metric vocabulary.
- Preserves privacy by excluding secrets, credentials, connection strings, and raw tenant document content from traces, logs, and metrics.

## Consequences

- Positive: API, worker, and representative database paths now share one trace-correlation contract.
- Positive: local and test runs can verify telemetry through console output without external infrastructure.
- Positive: OTLP export can be enabled later without changing the core runtime contract.
- Negative: the repo now carries a sticky OpenTelemetry dependency set that future changes must keep consistent.
- Negative: this ADR does not add dashboards, alerting programs, tracing vendors, or distributed observability beyond the PaperBinder runtime itself.

## Alternatives considered

- No OpenTelemetry baseline in v1: rejected because it leaves the observability docs aspirational and weakens CP16 hardening.
- Vendor-specific observability SDK first: rejected because it adds a costly-to-reverse dependency and exceeds V1 scope.
- Broad automatic database instrumentation: rejected because a smaller PaperBinder-owned instrumentation seam is easier to review for privacy and cardinality.
