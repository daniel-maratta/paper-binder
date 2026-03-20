# End-to-End Tests
Status: V1 (Minimal)

E2E tests validate high-value user-visible flows for the public demo.

## Scope

In scope:
- Provision -> login -> tenant redirect.
- Tenant navigation and document view.
- Logout/login cycle.
- Lease UI presence and extension path (when eligible).
- Network-level verification of API version and correlation headers on representative requests.

Out of scope:
- Load testing.
- Large browser matrix.

## Tooling

- Preferred: Playwright.
- Alternative: Cypress.

Use one tool and keep suite small/stable.

## Test Environments

- Required: local Compose environment.
- Optional: public demo smoke checks (throttled, limited).
- Do not depend on public demo for routine E2E coverage.

## Minimum Flow Set

1. Provision and auto-login on root host.
2. Redirect to tenant subdomain.
3. Navigate binders/documents and render content.
4. Logout and login again.
5. Validate lease UI and extension flow behavior.
   - verify lease indicator is shown
   - verify extension action eligibility matches lease rules
6. Intercept at least one `/api/*` call and assert request header `X-Api-Version` is present and response headers `X-Api-Version` and `X-Correlation-Id` are present.

## Challenge Handling in Tests

- In `PB_ENV=Test`, allow a test-only challenge bypass token/path.
- Never enable bypass behavior in production.

## Quality Gates

- Run E2E in CI when suite stability is acceptable.
- At minimum, run E2E on main after merge.

## Alternatives Considered

- Unit-only testing: rejected; misses end-to-end auth/routing behavior.
- Public-host-only E2E: rejected; flaky and noisy.
