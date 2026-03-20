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
  - Mitigations: mandatory `tenant_id` predicates, immutable request tenant context, repository guardrails and test coverage.
- CSRF (cookie auth)
  - Mitigations: anti-forgery tokens for state-changing browser flows, strict same-site strategy, origin checks for sensitive endpoints.
- XSS
  - Mitigations: output encoding, markdown sanitization, baseline Content Security Policy.
- Session fixation / hijack
  - Mitigations: secure cookie flags (`Secure`, `HttpOnly`, `SameSite`), auth session rotation on login boundary events, bounded session lifetime.

## Non-Goals

- No formal STRIDE workshop in v1.
- No dedicated penetration test program in v1.
- No full quantitative risk model in v1.
