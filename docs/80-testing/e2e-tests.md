# End-to-End Tests
Status: V1 (Minimal)

E2E tests validate high-value user-visible flows for the public demo.
They start after the CP12 frontend foundation checkpoint; CP12 itself is limited to component and utility coverage.

## Scope

In scope:
- CP13 root-host provisioning and login flows.
- Tenant navigation, document view, logout/login cycle, and lease interaction once CP14 ships those browser features.
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
- The E2E runtime must keep `PB_ENV=Test` out of `scripts/start-local.ps1`, `scripts/reviewer-full-stack.ps1`, and the default `docker-compose.yml` reviewer path.
- Optional: public demo smoke checks (throttled, limited).
- Do not depend on public demo for routine E2E coverage.

## Minimum Flow Set

1. CP13 root-host suite:
   - provision on `/` with the test-only challenge bypass token
   - show one-time credentials and continue to the tenant host using the server-provided redirect flow
   - log in on `/login` with existing credentials
   - cover deny paths for `CHALLENGE_FAILED`, `INVALID_CREDENTIALS`, and `RATE_LIMITED`
2. CP14 tenant-host expansion:
   - navigate binders/documents and render content
   - logout and login again
   - validate lease UI and extension flow behavior when eligible
3. Intercept at least one `/api/*` call and assert request header `X-Api-Version` is present and response header `X-Correlation-Id` is present.

## Challenge Handling in Tests

- In `PB_ENV=Test`, allow a test-only challenge bypass token/path.
- Never enable bypass behavior in production.

## Quality Gates

- Run E2E in CI when suite stability is acceptable.
- At minimum, run E2E on main after merge.
- CP13 closeout requires `powershell -ExecutionPolicy Bypass -File .\scripts\run-root-host-e2e.ps1` as a separate required gate; the browser suite is not bundled into `scripts/validate-checkpoint.ps1`.

## Alternatives Considered

- Unit-only testing: rejected; misses end-to-end auth/routing behavior.
- Public-host-only E2E: rejected; flaky and noisy.
