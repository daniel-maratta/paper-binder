# ADR-0014: Tenant-Host Failure Externalization And Trusted Expiry Disclosure

Status: Approved

## Date / Scope

- Date: 2026-07-15
- Scope: Tenant-host error disclosure, expired-tenant recovery, and subdomain-level trust posture for `v1.1`

## Decision

PaperBinder will split tenant-host failure behavior by trust level:

1. Public or otherwise untrusted callers must not receive tenant-host responses that deliberately confirm whether a tenant exists, is expired, is forbidden, or is merely absent.
   The public-facing API and HTML fallback paths should converge on a generic inaccessible-or-unavailable posture.

2. Trusted authenticated tenant sessions may receive an explicit expired-workspace recovery experience when the server can prove the caller already had legitimate access to that tenant.
   This path exists to support the legitimate "went AFK and came back after expiry" recovery case without turning the public surface into a tenant-enumeration oracle.

3. Internal precision must be preserved even when public responses are flattened.
   Server-side logs, audit records, and correlation-driven diagnostics should keep the precise internal reason so operators can distinguish not-found, forbidden, expired, and unexpected failures.

4. The SPA and tenant-host contracts should expose a deliberate machine-readable terminal state only for trusted expired-session recovery.
   The client should not infer that state indirectly from copy, countdown absence, or ad hoc HTTP-shape differences.

5. Any tenant-subdomain availability or bootstrap probing on unauthenticated paths must follow the same concealment posture.
   Public checks may say that a workspace is unavailable or inaccessible, but they must not act as an existence-check endpoint for tenant names.

## Rationale

PaperBinder has two competing requirements:

- legitimate users need a coherent recovery path when a timed demo tenant expires during or shortly after an authenticated session
- hostile or merely curious callers should learn as little as practical about which tenant hosts exist or what state they are in

The correct compromise is not "always generic" and not "always explicit."
It is a trust-aware split:

- generic for public or untrusted callers
- explicit only after prior legitimate access is already established

This aligns with common web-security guidance against user and account enumeration while still preserving usable recovery for authenticated sessions that the system can confidently classify as previously trusted.

It also keeps the security-sensitive truth on the server side, where PaperBinder can preserve precise diagnostics without exposing them as product copy or anonymous API behavior.

## Consequences

- Tenant-host controllers, middleware, and SPA bootstrap handling must distinguish public concealment from trusted expired-session disclosure intentionally.
- Public-facing copy should be written as generic unavailability language, not as tenant-state narration.
- API and non-API HTML fallback behavior should align on the same trust split instead of drifting independently.
- Correlation IDs remain useful, but they should support operator investigation rather than public tenant discovery.
- Browser or client-side tenant-slug checks must not become an existence oracle.

## Out Of Scope

This decision does not approve or introduce:

- changes to core tenancy resolution
- relaxed tenant isolation rules
- public tenant search or discovery features
- DNS or infrastructure automation changes beyond the app-level disclosure posture
- unrelated cleanup-agent or lifecycle endpoint work

## Follow-On Actions

1. Implement the trust-aware tenant-host failure policy in [T-0035](../05-taskboard/tasks/T-0035-tenant-host-failure-externalization-and-trusted-expiry-recovery.md).
2. Align tenant-host API responses, HTML fallback responses, and SPA terminal-state handling under the same policy.
3. Add targeted automated coverage for:
   - public concealment behavior
   - trusted expired-session recovery
   - non-enumerating tenant-subdomain/bootstrap checks
4. Reconcile public copy during [T-0036](../05-taskboard/tasks/T-0036-v1-1-docs-and-public-copy-reconciliation.md) so wording matches the approved disclosure posture.

## Sources

These sources informed the decision. The PaperBinder-specific trust split above is an application of them to this product's tenant-host model.

- OWASP Authentication Cheat Sheet:
  https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
  Guidance includes using generic authentication responses to avoid revealing whether a subject exists or why access failed.
- OWASP Forgot Password Cheat Sheet:
  https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html
  Guidance includes returning consistent messages and response timing for existent and non-existent accounts to reduce enumeration risk.
- OWASP Error Handling Cheat Sheet:
  https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html
  Guidance includes avoiding implementation-detail leakage in error responses.
- OWASP Subdomain Takeover Prevention Cheat Sheet:
  https://cheatsheetseries.owasp.org/cheatsheets/Subdomain_Takeover_Prevention_Cheat_Sheet.html
  Guidance treats subdomains as security-sensitive trust anchors that require deliberate ownership and exposure discipline.
