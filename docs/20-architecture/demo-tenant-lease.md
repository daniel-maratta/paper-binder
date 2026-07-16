# Tenant Lease for Demo Tenants

## Tenant Lease Contract (v1)

- Tenant `ExpiresAt` is set to provision time + 60 minutes.
- Expiry is authoritative server-side state.
- Expired tenants fail closed for access immediately at expiry.
- Cleanup is eventual after expiry and may defer purge while recent authenticated tenant-host activity is still inside the configured retention window.
- Deletion SLA target is prompt best-effort cleanup after expiry rather than a fixed hard-threshold purge deadline.
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

## Browser Presentation

- The tenant shell always shows the current expiry timestamp, countdown, extension count, and extend affordance state from the latest authoritative lease snapshot.
- Countdown is presentation only; the browser never derives extension eligibility from local timer math.
- CP14 refreshes lease state on shell bootstrap, successful extend, route changes, focus/visibility return, and a coarse periodic refresh.
- The extend affordance may be visible based on lease eligibility alone; non-admin attempts must fail safely through the existing API policy boundary.

## Security and Tenancy

- `GET /api/tenant/lease` requires authenticated tenant membership.
- `POST /api/tenant/lease/extend` requires the existing `TenantAdmin` policy.
- Lease extension stays behind the existing cookie-authenticated CSRF boundary and a route-scoped rate limiter.
- Tenant identity is resolved from host + membership, not client payload.
- Expired tenants are rejected for normal application access.
