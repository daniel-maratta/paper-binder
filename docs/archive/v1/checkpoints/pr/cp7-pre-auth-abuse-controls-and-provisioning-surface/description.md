# CP7 PR Description: Pre-Auth Abuse Controls And Provisioning Surface
Status: Review Ready

## Checkpoint
- `CP7`: Pre-Auth Abuse Controls And Provisioning Surface
- Task IDs: `T-0020`

## Summary
- Adds root-host-only pre-auth abuse controls for `POST /api/auth/login` and new `POST /api/provision`: shared per-IP rate limiting, server-side challenge verification, and stable ProblemDetails failures.
- Adds a transactional provisioning service that creates the tenant, owner user, membership, lease state, and authenticated session in one all-or-nothing flow.
- Keeps CP7 owner-only: provisioning seeds the tenant, owner user, membership, lease, and session only; binder/document sample data remains deferred to CP9/CP10.
- Updates canonical architecture, security, contracts, testing, taskboard, operations, and delivery docs so the repo reflects the live CP7 boundary and corrects earlier provisioning wording that implied seeded documents.

## Scope Boundaries
- Included:
  - `IChallengeVerificationService` with a Turnstile-backed implementation registered via `AddHttpClient<IChallengeVerificationService, TurnstileChallengeVerificationService>()`
  - test-only challenge bypass gated by `PB_ENV=Test` and a fixed bypass token
  - shared root-host pre-auth rate limiting for login and provision routes
  - structured warning/error logs for challenge failures, throttling, and provisioning rejection paths
  - root-host `POST /api/provision`
  - transactional tenant, owner user, and membership creation
  - generated one-time credentials plus authenticated session establishment on successful provisioning
  - stable ProblemDetails error codes for challenge, rate-limit, and tenant-name failures
  - unit/integration coverage and synchronized docs/taskboard artifacts
- Not included:
  - binder or document sample-data seeding
  - named authorization policies or tenant-user administration endpoints
  - lease extension, binder, or document domain work from later checkpoints
  - distributed/multi-node rate limiting or advanced bot-scoring infrastructure

## Critic Review
- Scope-lock outcome: Passed pre-implementation review. The design stayed locked to abuse controls, provisioning, tests, and synchronized documentation without pulling forward CP8-CP10 scope.
- Findings summary:
  - Use `PB_ENV` as a test-only process-environment gate at the challenge verification boundary; do not add it to typed runtime settings.
  - Keep provisioning owner-only for CP7 and correct docs that currently imply seeded documents at provisioning time.
  - Keep provisioning transactional and application-layered via `ITenantProvisioningService`.
  - Use semantic insert order `tenant -> user -> membership` inside one Dapper transaction.
  - Keep the existing login request contract unchanged; `LoginRequest.ChallengeToken` already exists from CP6 and CP7 changes behavior only.
  - Register Turnstile verification through `IHttpClientFactory` using `AddHttpClient`, not a raw `HttpClient`.
- Unresolved risks or accepted gaps:
  - Login and provision intentionally share one pre-auth rate-limit budget in V1. This is stricter than separate budgets and may be revisited later if observed traffic warrants it.
  - The non-bypass Turnstile branch is load-bearing on unit tests; integration tests will not call the real Turnstile service.
  - Slug normalization caps at `63` characters as an application validation rule even though the current DB column allows `80`; no migration is planned.

## Risks And Rollout Notes
- Config or migration considerations:
  - No schema migration is required for challenge verification or rate limiting.
  - Existing runtime keys remain authoritative:
    - `PAPERBINDER_CHALLENGE_SITE_KEY`
    - `PAPERBINDER_CHALLENGE_SECRET_KEY`
    - `PAPERBINDER_RATE_LIMIT_PREAUTH_PER_MINUTE`
  - `PB_ENV` remains test-only and is read directly from process environment, not from `PaperBinderRuntimeSettings`.
- Security or operational considerations:
  - Root-host login and provisioning now fail fast on missing/failed challenge proof and on pre-auth throttling.
  - Challenge verification remains anti-abuse friction only; it is not treated as authentication.
  - Provisioning is all-or-nothing: no partial tenant/user state may survive a failed provisioning attempt.
  - Successful provisioning must mirror the existing login session flow exactly: `SignOutAsync()`, `SignInAsync()`, then `csrfCookieService.IssueToken(context)`.

## Validation Evidence
- Executed commands:
  - `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\validate-launch-profiles.ps1`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\reviewer-full-stack.ps1 -NoBrowser`
- Added/updated tests:
  - unit tests for challenge bypass gating, non-bypass verifier delegation, slug normalization, invalid-name rejection, password generation shape, and auth/provision host-policy rules
  - Docker-backed integration tests for missing challenge rejection on login and provision
  - Docker-backed integration tests for fixed test-token success with `PB_ENV=Test`
  - Docker-backed integration tests for `429` behavior on login and provision with a low pre-auth limit
  - Docker-backed integration test proving tenant-host `POST /api/provision` is rejected with `404`
  - Docker-backed integration tests for successful provisioning, session establishment, and tenant-context validation on the returned tenant host
  - Docker-backed integration tests for duplicate-name conflict with rollback verification
  - non-Docker integration tests for `.env` plus `.env.example` local-bootstrap fallback and worker-host composition validity
- Launch profile verification:
  - `scripts/validate-launch-profiles.ps1` passed
  - headless command-equivalent verification passed for `Reviewer Full Stack`, `API Only`, `UI Only`, `Worker Only`, `App + Worker (Process)`, and `Launch Frontend Dev Server`
  - `Launch Frontend Dev Server` required outside-sandbox execution because the sandbox blocked Vite/esbuild child-process startup with `spawn EPERM`
- Manual verification:
  - VS Code launch verification passed for `Reviewer Full Stack`, `App + Worker (Process)`, `API Only`, `UI Only`, `Worker Only`, and `Launch Frontend Dev Server`
  - Visual Studio launch verification passed for `Reviewer Full Stack`, `App + Worker (Process)`, `API Only`, `UI Only`, and `Worker Only`
  - browser-root-host provisioning/login UI remains a later frontend checkpoint; this closeout verifies the checked-in launch surfaces and backend/runtime entrypoints

## Follow-Ups
- `CP8` adds named authorization policies and tenant-user administration.
- `CP9` and `CP10` extend provisioning seed logic only when binder/document domain models exist.
- If shared pre-auth rate limiting proves too restrictive in practice, split login and provision into separate budgets in a later checkpoint or hardening pass.
