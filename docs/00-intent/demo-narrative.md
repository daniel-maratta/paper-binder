# Demo Narrative
Status: V1

This document describes the public demo flow shown to reviewers.

## Goals

- Show a real deployed multi-tenant system with subdomain isolation.
- Keep user effort low (single login experience).
- Add lightweight anti-bot friction before provisioning.

## User Flow

1. User visits `https://paperbinder.danielmaratta.com/`.
2. Landing page presents PaperBinder as a product-first public experience and offers `Start Demo` plus secondary supporting context.
3. User enters the dedicated demo-entry flow on `/start-demo`.
4. User completes an anti-bot challenge before provisioning or direct login.
5. Demo-entry page offers:
   - `Start demo workspace`
   - `Log in` for existing credentials.
6. Provisioning flow:
   - Create tenant and initial demo user.
   - Display credentials once.
   - Continue to `https://{tenant}.paperbinder.danielmaratta.com/` using the server-provided redirect after sign-in.
7. Tenant flow:
   - Access binders and DB-backed text documents.
   - View lease countdown and extension action (when eligible).
8. Expiration flow:
   - Expired tenant becomes inaccessible and is cleaned up.
   - Tenant host shows a safe expired/not-found experience.

## Explicit Expectations

- Public demo only, not a commercial SaaS product.
- Users should not upload sensitive information.
- Availability is best-effort.

## Alternatives Considered

- Email magic link access: rejected due to SMTP and delivery overhead.
- Honeypot-only filtering: rejected due to weak resistance to scripted abuse.
- No friction: rejected due to public endpoint abuse risk.
