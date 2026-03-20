# ADR-0006: Bot Friction for Public Demo Entry

Status: Accepted

## Context

Public demo hosting invites automated traffic that can create noise and resource waste (excess provisioning, brute attempts, scraping).

A friction mechanism is required that is cheap and low complexity.

## Decision

Use an edge-friendly challenge as bot friction for pre-auth actions (provisioning / login surface).
Recommended approach: Cloudflare Turnstile (or equivalent) integrated into the root host flow.

Complement with:
- rate limiting on pre-auth endpoints
- strict limits on provisioning frequency per IP / per time window

## Rationale

- No email/SMTP required in V1
- Low cost and low implementation complexity
- Filters common bots before they create server-side work

## Alternatives considered

- Honeypot-only bot filtering: lower friction but weaker protection against automated abuse.
- Email magic links: higher friction for bots but adds SMTP integration, cost, and deliverability issues.
- No friction: unacceptable for a public demo due to abuse risk.

## Consequences

- Requires storing a small edge-challenge secret/config in server config.
- Must handle challenge failures gracefully and return clear UX messaging.
