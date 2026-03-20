# UX Notes
Status: V1

## Principles

- Minimize steps to a usable tenant.
- Prefer clear status messaging over clever interactions.
- Avoid modal-heavy flows.

## Provisioning UX

- Primary CTA is `Provision new demo tenant and log in`.
- User must complete challenge before provisioning request is submitted.
- Credentials are shown once after provisioning.
- User is immediately signed in and redirected to tenant host.
- On failure, show actionable error with retry guidance.

## Login UX

- Root login accepts existing demo credentials.
- Root login requires challenge completion.
- Successful login redirects to tenant subdomain.
- Expired tenant shows clear expired message.

## Tenant Expiration UX

- Lease countdown is visible in tenant shell.
- Extension action appears only when extension rules allow it.
- Expired tenant host shows non-leaky error page.

## Accessibility Baseline

- Keyboard navigation for primary flows.
- Visible focus state.
- Semantic form and navigation markup.

## Alternatives Considered

- Email recovery workflow: rejected due to operational overhead.
- Auto-provision without credential display: rejected (poor return-user flow).
- Additional credential-gate step: rejected (unnecessary friction).
