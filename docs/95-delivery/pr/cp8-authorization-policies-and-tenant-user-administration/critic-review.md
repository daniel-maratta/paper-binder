# CP8 Critic Review: Authorization Policies And Tenant User Administration

Reviewer: Code Critic
Date: 2026-04-07
Reviewed artifact: CP8 implementation diff against `main`

## Verdict

Ship-ready. The implementation faithfully follows the locked plan and the pre-implementation critic corrections. No security, boundary, or contract-integrity blockers found. Six observations below, all severity Low or Info.

## Findings

### 1. Email validation in the endpoint is thin

`PaperBinderTenantUserEndpoints.TryNormalizeEmail` checks only for non-empty and length <= 256. It does not validate that the value looks like an email address. A caller can POST `email: "not-an-email"` and the user row is created with that string as both `email` and `user_name`. The DB `ux_users_normalized_email` unique constraint will catch duplicates but nothing catches structurally invalid addresses before persistence.

This is not a security issue -- the API is admin-only and the value never reaches an outbound email path in v1 -- but it may surprise a reviewer or produce confusing user records during demo. Consider adding a minimal format check (contains `@`, no whitespace) or noting in the contract docs that v1 does not validate email format.

Severity: Low

### 2. `CreateTenantUserRequest` record properties are non-nullable but accept JSON nulls at runtime

The `CreateTenantUserRequest(string Email, string Password, string Role)` record has non-nullable `string` properties. ASP.NET minimal APIs with `System.Text.Json` will deserialize JSON `null` as C# `null` for these properties. The endpoint handles this defensively (`request.Password ?? string.Empty`, `request.Role ?? string.Empty`, and the separate `TryNormalizeEmail` null check), so there is no runtime bug. But the mismatch between declared non-nullable types and actual runtime null-safety could mislead a future reader. An explicit `string?` declaration or a comment would make the intent clearer.

Severity: Info

### 3. Middleware ordering is correct and documented

The host-requirement middleware runs before CSRF and before authorization:
```
PreAuth -> HostRequirement -> CSRF -> Authorization
```
This matches the stated design ("gated from the resolved-host request context before CSRF and authorization run") and the diff confirms it. No issue.

Severity: Info (positive observation)

### 4. `TenantRoleParser` relocation from Infrastructure to Application is the right call

The old `TenantRoleParser` in `PaperBinder.Infrastructure.Tenancy` was deleted and replaced by `PaperBinder.Application.Tenancy.TenantRoleParser` with an added `TryParse` variant. The new location respects the dependency rule (Application should not depend on Infrastructure) and the new `TryParse` supports validation-path callers without exceptions. Good refactor.

Severity: Info (positive observation)

### 5. `for update` locking in `ChangeRoleAsync` is correct but has a minor redundancy

The role-change query issues `for update of ut` on the target user row, then separately queries `for update` on all admin rows when the target is being demoted from admin. Both locks are inside the same serializable transaction. The second query fetches all admin `user_id` values but only uses the count. A `select count(*)` with the same `for update` would be equivalent and slightly lighter. This is not a bug and is unlikely to matter at v1 scale, but it is a minor optimization opportunity.

Severity: Info

### 6. Integration test coverage is thorough

14 Docker-backed integration tests cover:
- tenant-scoped list (cross-tenant exclusion)
- non-admin denial
- wrong-host 404
- user creation with login round-trip
- email conflict
- invalid role
- invalid password
- CSRF missing and CSRF invalid (both POST paths)
- role change (same-tenant)
- cross-tenant role change denial
- last-admin protection
- full role-hierarchy probe matrix (admin/writer/reader x 4 policies)
- cross-tenant probe denial

The test plan from the implementation plan is fully covered. No gaps found.

Severity: Info (positive observation)

## Private-Boundary Scan

No references to `MagentaAI`, `magenta-ai`, `MappCore`, `mappcore`, or private sibling paths found in any changed or new file in the diff. `AGENTS.local.md` (which is `.gitignore`-excluded) is the only file in the repo mentioning private sibling names. Clean.

## Scope Lock Verification

| Criterion | Status |
| --- | --- |
| Matches CP8 checkpoint outcome | Pass |
| No CP9+ feature pull-forward | Pass |
| No `.RequireHost()` framework API usage | Pass |
| DI-scoped membership context (not HttpContext.Items/Features) | Pass |
| Atomic tenant-user creation without `UserManager.CreateAsync()` | Pass |
| CSRF middleware remains authoritative | Pass |
| Policy probes registered from integration-host hook only | Pass |
| No ad-hoc role checks in handlers | Pass |
| Docs propagated in same changeset | Pass |

## Documentation Integrity

| Doc area | Updated | Notes |
| --- | --- | --- |
| `docs/20-architecture/authn-authz.md` | Y | Named policies, membership context, host gating documented |
| `docs/20-architecture/identity-aspnet-core-identity.md` | Y | Atomic creation rationale documented |
| `docs/20-architecture/policy-authorization.md` | Y | Named policies, host gating, and role model sections added |
| `docs/20-architecture/tenancy-resolution.md` | Y | Membership context and host gating noted |
| `docs/30-security/tenant-isolation.md` | Y | Membership context and host enforcement noted |
| `docs/40-contracts/api-contract.md` | Y | Request/response examples, failure semantics, error codes, RBAC policy map updated |
| `docs/55-execution/checkpoint-status.md` | Y | CP7 done, CP8 active, follow-up noted |
| `docs/70-operations/runbook-local.md` | Y | Updated from CP7 to CP8 limits |
| `docs/80-testing/integration-tests.md` | Y | Four new test names added |
| `docs/05-taskboard/work-queue.md` | Y | T-0022 added to Recently Done |

No stale doc references or missing propagation found.

## Residual Risks

- **Frontend build blocked**: The `npm ci` EPERM file lock on `lightningcss-win32-x64-msvc` prevents the canonical frontend build path from completing. This is an environment issue, not a CP8 code issue, but it means the checkpoint cannot be fully validated until the lock is cleared. The PR description correctly discloses this.
- **Manual launch verification pending**: Checkpoint closeout requires VS Code and Visual Studio manual launch verification to be recorded. The PR description correctly marks this as pending.
- **Email format validation**: As noted in finding #1, structurally invalid emails can be persisted. Acceptable for v1 demo scope.

## Summary Table

| # | Finding | Severity | Action |
| --- | --- | --- | --- |
| 1 | Email validation is thin (no format check) | Low | Consider minimal format check or document as accepted |
| 2 | Non-nullable record props accept runtime nulls | Info | Consider `string?` or comment |
| 3 | Middleware ordering is correct | Info | None |
| 4 | TenantRoleParser relocation is correct | Info | None |
| 5 | `for update` admin count could use `count(*)` | Info | Optional optimization |
| 6 | Integration test coverage is thorough | Info | None |
