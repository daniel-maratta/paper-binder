# Tenant Lease for Demo Tenants

## Tenant Lease Contract (v1)

- Tenant `ExpiresAt` is set to provision time + 60 minutes.
- Expiry is authoritative server-side state.
- Expired tenants are hard-deleted (no grace period).
- Deletion SLA target is within 5 minutes of expiry (best effort).
- Canonical lease endpoints:
  - `GET /api/tenant/lease`
  - `POST /api/tenant/lease/extend`

## Extension Rules

- Extension endpoint may be called only when remaining lease is <= 10 minutes.
- Each extension adds +10 minutes to `ExpiresAt`.
- Maximum 3 extensions per tenant.
- Requests that violate extension rules are rejected with `409` conflict semantics.
- Expired-but-not-yet-purged tenants return `410`.
- Purged tenants return `404`.

## Security and Tenancy

- Extension operations require authenticated tenant membership.
- Tenant identity is resolved from host + membership, not client payload.
- Expired tenants are rejected for normal application access.
