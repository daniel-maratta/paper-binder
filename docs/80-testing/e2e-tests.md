# End-to-End Tests
Status: V1 (Minimal)

E2E tests validate high-value user-visible flows for the public demo.
They start after the CP12 frontend foundation checkpoint; CP12 itself is limited to component and utility coverage.

## Scope

In scope:
- CP13 root-host provisioning and login flows.
- CP14 tenant-host dashboard, binder, document, user-management, lease, logout/login-cycle, forbidden, and expired flows.
- CP15 tenant-local impersonation start, downgraded effective experience, banner signaling, and stop-return behavior.
- Network-level verification of API version and correlation headers on representative requests.

Out of scope:
- Load testing.
- Large browser matrix.

## Tooling

- Component and utility test baseline before E2E: Vitest + React Testing Library + jsdom.
- Preferred: Playwright.
- Alternative: Cypress.

Use one tool and keep suite small/stable.

## Test Environments

- Required: isolated local E2E runtime invoked through a dedicated repo-native entrypoint.
- Canonical entrypoint: `powershell -ExecutionPolicy Bypass -File .\scripts\run-browser-e2e.ps1`.
- The E2E runtime must keep `PB_ENV=Test` out of `scripts/start-local.ps1`, `scripts/reviewer-full-stack.ps1`, and the default `docker-compose.yml` reviewer path.
- The test-only challenge fixture must remain owned by that isolated runtime and must not appear in the default frontend build output or committed app `wwwroot`.
- Optional: public demo smoke checks (throttled, limited).
- Do not depend on public demo for routine E2E coverage.

## Minimum Flow Set

1. CP13 root-host suite:
   - provision on `/` with the test-only challenge bypass token
   - show one-time credentials and continue to the tenant host using the server-provided redirect flow
   - log in on `/login` with existing credentials
   - cover deny paths for `CHALLENGE_FAILED`, `INVALID_CREDENTIALS`, and `RATE_LIMITED`
2. CP14 tenant-host expansion:
   - land on `/app`, render live dashboard content, and show lease banner state
   - create a binder on `/app/binders`, create a document from binder detail, and view the document on `/app/documents/:documentId`
   - create a tenant user and update binder policy as `TenantAdmin`
   - log out to the root host and log back in as a lower-privilege user in the same tenant
   - confirm safe forbidden behavior on an admin-only route
   - validate lease UI and extension behavior when eligible
   - validate expired-tenant behavior through deterministic isolated setup rather than waiting for wall-clock lease decay
3. CP15 impersonation expansion:
   - create a same-tenant non-admin user from `/app/users`
   - start view-as from `/app/users`
   - prove the shell banner is visible and the effective user sees the restricted experience
   - stop impersonation from the tenant shell and verify the admin route recovers without a root-host login round-trip
4. Intercept at least one `/api/*` call and assert request header `X-Api-Version` is present and response header `X-Correlation-Id` is present.

## Challenge Handling in Tests

- In `PB_ENV=Test`, allow a test-only challenge bypass token/path.
- Never enable bypass behavior in production.

## Quality Gates

- Run E2E in CI when suite stability is acceptable.
- At minimum, run E2E on main after merge.
- Browser-surface checkpoint closeout requires `powershell -ExecutionPolicy Bypass -File .\scripts\run-browser-e2e.ps1` as a separate required gate; the browser suite now owns root-host, tenant-host, and impersonation flows and is not bundled into `scripts/validate-checkpoint.ps1`.

## Alternatives Considered

- Unit-only testing: rejected; misses end-to-end auth/routing behavior.
- Public-host-only E2E: rejected; flaky and noisy.
