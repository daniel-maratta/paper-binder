# CP8 PR Description: Authorization Policies And Tenant User Administration
Status: Review Ready

## Checkpoint
- `CP8`: Authorization Policies And Tenant User Administration
- Task IDs: `T-0022`

## Summary
- Adds named API-boundary authorization policies plus a request-scoped tenant membership context so policy evaluation is explicit and tenant-boundary-aware.
- Adds resolved-host route gating from the existing request-host context so tenant-host-only and system-host-only endpoints return `404` on the wrong host before CSRF or authorization run.
- Adds `GET /api/tenant/users`, `POST /api/tenant/users`, and `POST /api/tenant/users/{userId}/role` with tenant-scoped Dapper persistence, last-admin protection, and stable ProblemDetails contracts.
- Updates canonical architecture, security, contract, testing, operations, taskboard, and checkpoint docs so the repo describes the shipped CP8 boundary instead of the earlier deferral state.

## Scope Boundaries
- Included:
  - request-scoped `IRequestTenantMembershipContext`
  - named policies `AuthenticatedUser`, `BinderRead`, `BinderWrite`, and `TenantAdmin`
  - resolved-host endpoint metadata plus middleware-backed host gating
  - tenant-user list/create/role endpoints
  - last-admin protection and stable ProblemDetails mappings for duplicate email, invalid role, invalid password, and unknown tenant-scoped role targets
  - structured security logs for tenant-user create and role-change success/failure paths
  - unit and Docker-backed integration coverage, plus synchronized docs/taskboard artifacts
- Not included:
  - lease endpoints or lease UI
  - binder/document endpoints or binder-policy domain work
  - frontend tenant-user management UI
  - audit persistence or audit-reporting UI
  - multi-role aggregation, invites, or password-reset flows

## Critic Review
- Scope-lock outcome: Passed both pre-implementation and post-implementation review. The final post-implementation verdict is ship-ready with no blockers.
- Findings summary:
  - Use a DI-scoped membership context rather than `HttpContext.Items` or `Features`.
  - Keep host gating on the existing resolved-host request context; do not introduce `.RequireHost()`.
  - Preserve atomic tenant-user creation by validating with Identity components but inserting `users` and `user_tenants` inside one Dapper transaction.
  - Keep the existing CSRF middleware authoritative for authenticated unsafe tenant-host `/api/*` routes.
  - Register test-only policy probes through the integration host hook only.
  - Post-review low/info follow-ups were addressed by adding a minimal structural email check and making the tenant-user request DTO string properties explicitly nullable.
- Unresolved risks or accepted gaps:
  - CP8 still inherits the deliberate v1 one-membership-per-user simplification.

## Risks And Rollout Notes
- Config or migration considerations:
  - No schema migration is required for CP8.
  - No new runtime configuration keys are introduced.
- Security or operational considerations:
  - Tenant-host/system-host route visibility is now explicit and enforced before CSRF/authorization, reducing wrong-host ambiguity on protected routes.
  - Tenant-user create and role-change failure paths now emit stable machine-readable `errorCode` values.
  - Tenant-user creation deliberately avoids `UserManager.CreateAsync()` so user-row plus membership-row persistence remains atomic with the current Dapper store design.

## Validation Evidence
- Commands run:
  - `powershell -ExecutionPolicy Bypass -File .\scripts\restore.ps1`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release`
  - `dotnet build PaperBinder.sln -c Release --no-restore -p:SkipFrontendBuild=true -v minimal`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require`
  - `dotnet test tests/PaperBinder.IntegrationTests/PaperBinder.IntegrationTests.csproj -c Release --no-build --filter FullyQualifiedName~AuthorizationPoliciesAndTenantUserAdministrationIntegrationTests --logger "console;verbosity=minimal"`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\validate-launch-profiles.ps1`
- Tests added/updated:
  - unit tests for policy hierarchy, membership-context establishment, invalid role parsing, tenant-user failure mapping, and last-admin guard rules
  - Docker-backed integration tests for tenant-user list/create/role flows, invalid email rejection, non-admin denial, wrong-host `404`, CSRF rejection, duplicate email, invalid role/password, last-admin protection, and test-only policy probes
- Launch profile verification:
  - `scripts/validate-launch-profiles.ps1` passed
- Manual verification:
  - VS Code launch passed
  - Visual Studio launch passed

Observed results:
- `powershell -ExecutionPolicy Bypass -File .\scripts\restore.ps1` passed, including `npm ci`.
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release` passed, including `npm run build`, Vite production bundle generation, and `dotnet build` for the full solution.
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require` passed with `66/66` unit tests, `25/25` non-Docker integration tests, and `39/39` Docker-backed integration tests.
- The focused CP8 Docker-backed integration slice passed `15/15`.

## Follow-Ups
- CP9 consumes the new `BinderRead` and `BinderWrite` policy infrastructure for binder endpoints.
- CP11 continues to own lease endpoints; CP8 intentionally does not pull them forward.
