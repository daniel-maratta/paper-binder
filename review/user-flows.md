# User Flows (Reviewer Summary)

This file highlights representative v1 flows for architecture review.

Detailed behavior is defined in `docs/10-product/user-stories.md` and `docs/20-architecture/frontend-app-route-map.md`.

## 1) Provision Demo Tenant and Enter Tenant Host

```text
Visitor on root host
  -> Complete challenge proof
  -> POST /api/provision
  -> Receive generated credentials + redirectUrl
  -> Authenticate
  -> Redirect to {tenant}.host/app
```

## 2) Create Binder and Add Immutable Document

```text
Authenticated tenant user
  -> POST /api/binders (requires BinderWrite)
  -> POST /api/documents (text content, tenant-scoped)
  -> GET /api/documents/{id} (read-only in v1)
```

## 3) Tenant User Administration

```text
Tenant admin
  -> GET /api/tenant/users
  -> POST /api/tenant/users
  -> POST /api/tenant/users/{userId}/role
```

## 4) Tenant-Local Impersonation

```text
Tenant admin
  -> POST /api/tenant/impersonation
  -> Effective experience downgrades to target user's permissions
  -> DELETE /api/tenant/impersonation
  -> Admin view recovers without a root-host login round-trip
```

## 5) Lease Extension Near Expiry

```text
Tenant admin reads lease state
  -> GET /api/tenant/lease
  -> If remaining <= 10 minutes and extension count < 3
     -> POST /api/tenant/lease/extend (+10 minutes)
  -> Else -> 409 conflict
```

## 6) Authenticated Rate-Limit Observation

```text
Authenticated tenant user
  -> Repeat unsafe tenant-host mutation
  -> Receive 429 RATE_LIMITED
  -> Observe Retry-After header
```

## 7) Spoofed-Host Rejection

```text
Client sends API request with an invalid or off-domain host
  -> Host validation rejects request before tenant-scoped execution
  -> API returns TENANT_HOST_INVALID or TENANT_NOT_FOUND
```

## 8) Expiry and Cleanup Behavior

```text
Lease reaches expiration
  -> App access returns 410 while not yet purged
  -> Worker hard-deletes tenant data
  -> Subsequent access returns 404
```

## Canonical References

- `docs/10-product/user-stories.md`
- `docs/20-architecture/frontend-app-route-map.md`
- `docs/20-architecture/demo-tenant-lease.md`
- `docs/40-contracts/api-contract.md`
