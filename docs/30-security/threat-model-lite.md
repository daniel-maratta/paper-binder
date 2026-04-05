# Threat Model Lite

This is a lightweight threat model for v1. It documents primary risks and baseline mitigations.

## Assets

- Tenant-owned document and binder data.
- User credentials and identity membership data.
- Session cookies used for cross-subdomain authentication.

## Trust Boundaries

- Browser <-> App (HTTP boundary, untrusted client input).
- App <-> Database (trusted service-to-data boundary with strict query discipline).
- Background worker <-> Database (system-context boundary for lease-expiration operations).

## Top Threats and Mitigations

- IDOR / broken access control
  - Mitigations: policy-based auth at API boundary, tenant-scoped query predicates, integration tests for forbidden cross-tenant access.
- Cross-tenant data leakage
  - Mitigations: strict host validation, server-side tenant lookup, immutable request tenant context, mandatory `tenant_id` predicates, repository guardrails and test coverage.
- Host header spoofing / tenant confusion
  - Mitigations: configured root-domain validation, single-label tenant-host parsing, reject unknown tenant hosts before handlers run, require membership before tenant context establishment, and ignore client tenant hints for scoping.
- CSRF (cookie auth)
  - Mitigations: readable CSRF cookie plus `X-CSRF-TOKEN` validation on authenticated unsafe `/api/*`, `SameSite=Lax`, and parent-domain auth cookie scoping.
- XSS
  - Mitigations: output encoding, markdown sanitization, baseline Content Security Policy.
- Session fixation / hijack
  - Mitigations: secure cookie flags (`Secure`, `HttpOnly`, `SameSite`), auth session rotation on login boundary events, bounded session lifetime.

## Deferred Controls

- No distributed or multi-node rate-limiting implementation in v1.
- No advanced bot-scoring model beyond fixed challenge verification in v1.

## Non-Goals

- No formal STRIDE workshop in v1.
- No dedicated penetration test program in v1.
- No full quantitative risk model in v1.
