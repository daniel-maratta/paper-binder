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

- `PAPERBINDER_LEASE_EXTENSION_MINUTES` is the single v1 setting for both the extension eligibility threshold and the extension amount.
- Extension endpoint may be called only when remaining lease is greater than `0` and less than or equal to `PAPERBINDER_LEASE_EXTENSION_MINUTES`.
- Each extension adds `PAPERBINDER_LEASE_EXTENSION_MINUTES` to `ExpiresAt`.
- Maximum 3 extensions per tenant.
- Requests that violate extension rules are rejected with `409 TENANT_LEASE_EXTENSION_WINDOW_NOT_OPEN` or `409 TENANT_LEASE_EXTENSION_LIMIT_REACHED`.
- Lease-extend throttling returns `429 RATE_LIMITED` with `Retry-After`.
- Expired-but-not-yet-purged tenants return `410`.
- Purged tenants return `404`.

## Security and Tenancy

- `GET /api/tenant/lease` requires authenticated tenant membership.
- `POST /api/tenant/lease/extend` requires the existing `TenantAdmin` policy.
- Lease extension stays behind the existing cookie-authenticated CSRF boundary and a route-scoped rate limiter.
- Tenant identity is resolved from host + membership, not client payload.
- Expired tenants are rejected for normal application access.
