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
  - Mitigations: the API returns raw markdown as plain text (no server-side HTML rendering); the frontend's markdown-to-JSX renderer (`tenant-document-detail-route.tsx`) never uses `dangerouslySetInnerHTML`, relies on React's automatic text-node escaping, and allowlists link `href` values to `http:`/`https:`/`mailto:`/same-app-relative paths. v1 does not ship a CSP or a parsed-markdown sanitizer pipeline.
- Clickjacking / MIME sniffing / referrer leakage
  - Mitigations: every response carries `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `X-Frame-Options: DENY` (`SecurityResponseHeadersMiddleware`, wired first in `UsePaperBinderHttpContract`). `Strict-Transport-Security` is emitted at the TLS-terminating reverse proxy (`deploy/test/Caddyfile`, `deploy/prod/Caddyfile`), not the app, since the app itself cannot reliably know the original request was HTTPS (no forwarded-header trust — see the Host header spoofing mitigation above). v1 still does not ship a CSP; see the XSS entry above for why (no parser to constrain, and a CSP needs its own per-route validation before it can be locked safely).
- Session fixation / hijack
  - Mitigations: secure cookie flags (`Secure`, `HttpOnly`, `SameSite`), auth session rotation on login boundary events, bounded session lifetime.

## Deferred Controls

- No distributed or multi-node rate-limiting implementation in v1.
- No advanced bot-scoring model beyond fixed challenge verification in v1.

## Non-Goals

- No formal STRIDE workshop in v1.
- No dedicated penetration test program in v1.
- No full quantitative risk model in v1.
