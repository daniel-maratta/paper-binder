# ADR-0010: Playwright Root-Host E2E Runtime

## Status
Accepted

## Context

CP13 requires the first browser-level automation for root-host provisioning and login.
The repo already ships Vitest + React Testing Library component coverage from CP12, but that stack does not prove:

- real browser cookie/session behavior across root-host and tenant-host redirects
- root-host challenge interaction through the actual UI seam
- end-to-end ProblemDetails handling for challenge, credential, and rate-limit failures

The checkpoint also requires the test-only challenge bypass contract under `PB_ENV=Test` to stay out of the default local/demo reviewer stack.

## Decision

Use Playwright for CP13 browser E2E coverage and run it through a dedicated repo-native entrypoint:

- frontend dependency: `@playwright/test`
- checked-in config: `src/PaperBinder.Web/playwright.config.ts`
- checked-in suite: `src/PaperBinder.Web/e2e/`
- explicit runtime command: `scripts/run-root-host-e2e.ps1`
- isolated runtime shape: `docker-compose.yml` plus `docker-compose.e2e.yml`, separate compose project name, direct app-host port `5081`, and `PB_ENV=Test` only inside that E2E runtime

## Why

- Playwright is already the preferred V1 browser-E2E tool in the frontend/testing docs.
- It covers real browser navigation, cookies, request interception, and cross-host redirect assertions without adding a second frontend architecture layer.
- The dedicated runtime keeps `PB_ENV=Test` and the mock challenge script out of `scripts/start-local.ps1`, `scripts/reviewer-full-stack.ps1`, and the default reviewer compose path.
- A repo-native PowerShell entrypoint gives one explicit closeout command for CP13 without overloading `scripts/validate-checkpoint.ps1`.

## Alternatives Considered

- Cypress: acceptable in principle, but not the preferred stack and not already aligned in the existing docs.
- Component-only coverage: rejected because it cannot prove browser redirect/cookie behavior or the `CHALLENGE_FAILED` gap at the correct boundary.
- Folding browser E2E into the default local/reviewer stack: rejected because it would leak `PB_ENV=Test` into non-test runtime paths.

## Consequences

- The repo now carries a sticky browser-E2E dependency and supporting config.
- CP13 closeout includes a separate required browser-E2E command in addition to `scripts/validate-checkpoint.ps1`.
- The E2E runtime intentionally differs from the reviewer stack: it uses a dedicated compose override and direct app-host port for deterministic automation, not the default proxy-backed reviewer path.
