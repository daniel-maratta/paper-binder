# UX Notes
Status: V1

## Principles

- Minimize steps to a usable tenant.
- Prefer clear status messaging over clever interactions.
- Avoid modal-heavy flows.

## Provisioning UX

- Primary CTA is `Provision new demo tenant and log in`.
- User must complete challenge before provisioning request is submitted.
- Credentials are shown once after provisioning in a short-lived root-host handoff state.
- User is immediately signed in, then explicitly continues to the tenant host from that handoff state.
- On failure, show actionable error with retry guidance.

## Login UX

- Root login accepts existing demo credentials.
- Root login lives on `/login` and uses `Email`, password, and challenge proof.
- Root login requires challenge completion.
- Successful login redirects to the tenant subdomain using the server-provided `redirectUrl`.
- Expired tenant shows clear expired message.
- Invalid credentials, challenge failures, and rate limits show safe retry-oriented copy.

## Tenant Expiration UX

- Lease countdown is visible in tenant shell.
- Lease status reflects the latest authoritative `expiresAt`, extension count, and extend eligibility from the server.
- Extension action may be shown from lease eligibility alone; API authorization remains authoritative and non-admin attempts fail safely with display-safe access-denied feedback.
- Lease state refreshes on bootstrap, successful extend, route changes, focus or visibility regain, and a coarse periodic refresh rather than continuous polling.
- Tenant-host logout returns the browser to the configured root-host `/login`.
- Expired tenant host shows non-leaky error page.

## Tenant Host Product UX

- Tenant dashboard favors reviewer-useful summary content and quick links over a dashboard-specific aggregate API.
- Binder creation lives on `/app/binders`; document creation and binder-policy management live on binder detail.
- Document detail stays read-only in v1 and presents archived-state metadata without adding edit or replace affordances.
- Tenant-admin user management lives on `/app/users`; non-admin callers receive safe forbidden behavior rather than silent client-side gating.

## Accessibility Baseline

- Keyboard navigation for primary flows.
- Visible focus state.
- Semantic form and navigation markup.
- Browser-owned challenge wrapper markup provides label, helper/error association, keyboard reachability, and visible state messaging even though widget internals are third-party controlled.

## Alternatives Considered

- Email recovery workflow: rejected due to operational overhead.
- Auto-provision without credential display: rejected (poor return-user flow).
- Additional credential-gate step: rejected (unnecessary friction).
