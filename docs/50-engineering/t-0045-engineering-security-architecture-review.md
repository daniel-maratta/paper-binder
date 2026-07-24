# T-0045 Engineering, Security, And Architecture Review

Status: Review Complete — Remediation Not Started
Owner task: [T-0045](../05-taskboard/tasks/T-0045-v1-1-engineering-security-architecture-closeout.md)

## Purpose

This is the authoritative discovery record for T-0045: a first-line staff-level engineering,
security, and architecture review of the `v1.1.0` release candidate, performed after
[T-0044's baseline snapshot](../95-delivery/v1.1.0-baseline.md) and before `T-0041`
(accessibility QA) and `T-0043` (final acceptance/release close-out).

This document records findings, severities, evidence, false positives, and a recommended
remediation plan. **It does not remediate any findings.** No application code, test code, or
dependency versions were changed while producing this document. Remediation is intentionally
deferred to a separate execution pass so it can be planned, reviewed, and validated on its own
terms — see `docs/95-delivery/v1.1.0-baseline.md`'s own Non-Goals for the same discovery/
remediation separation principle applied to `T-0044`.

## Branch And Commit Reviewed

- Branch reviewed: `release/v1.1.0`
- Commit reviewed: `a29305c7d570bd83da2989e64ca93a4e2041cb8e` (tip of `release/v1.1.0` at review time; also the tip of the review/v1.1.0-engineering branch, the branch this document was written from)
- Review date: 2026-07-24
- This review builds on, and does not re-derive, `T-0044`'s validation evidence (build/test/docs/browser results) recorded in `docs/95-delivery/v1.1.0-baseline.md`. Where this review re-ran a check (dependency scans), that is noted explicitly below with its own date.

## Methodology

The review covered five focus areas mirroring T-0045's acceptance criteria: tenant isolation/
security boundaries, architecture/maintainability/dead-code, test-suite correctness, dependency
health, and documentation-vs-implementation drift. Each area was independently investigated by
direct code reading (file:line citations below), not by re-running the application or trusting
prior write-ups at face value — the existing `code-quality-review.md`/`code-quality-gap-analysis.md`
audit and the `T-0044` baseline's findings were each independently re-verified against current
code rather than assumed correct (see Finding F2 for a case where that re-verification mattered).
Live dependency/vulnerability scans (`npm audit`, `dotnet list package --vulnerable
--include-transitive`) were re-run fresh against this commit on 2026-07-24 rather than reusing
`T-0044`'s numbers.

## Executive Summary

PaperBinder's `v1.1.0` branch is in good release-engineering health. No Critical or High-severity
finding was identified anywhere in this review: no cross-tenant data access, no authentication or
authorization bypass, no CSRF gap, no exploitable XSS or SQL injection, and NuGet has zero known-
vulnerable packages. The single automated test failure recorded in the `T-0044` baseline
(`e2e/tenant-host.spec.ts`) is confirmed, independently, to be a stale test assertion against
intentional product behavior, not a product regression, and a concrete fix is recorded below (F4).

The real findings cluster into three themes, none release-blocking:

1. **A few places where documentation/comments describe the code incorrectly.** A prior
   code-quality audit doc is now partly stale (some items it flagged were already fixed by an
   intervening remediation batch, `batch-1a`, but the audit doc was never updated — F2). A
   security-relevant code comment claims a backend renderer is the XSS defense when that renderer
   is actually unreferenced dead code; the real (and safe) defense is the frontend's markdown
   renderer, which the comment doesn't mention (F1).
2. **One documented product behavior isn't reachable in the shipped UI.** Archive/unarchive is
   specified in `docs/15-feature-definition/FD-0001-binder-document-detail-and-archive-semantics.md`
   as required, user-visible, write-access behavior. The backend endpoints, domain rules, and tests
   all exist and pass, but the frontend has no button or control to trigger archive/unarchive (F3).
3. **A short list of small, well-understood, low-risk cleanup items** — one dead frontend
   component, one stale E2E assertion (fix already written below), a few duplicate small types, and
   a dependency-advisory triage decision that needs to be recorded, not urgently fixed.

**Recommendation:** `v1.1.0` is release-ready from an engineering/security standpoint once the
Medium-severity findings below receive an explicit disposition (fix or documented defer). None of
them require new architecture or a redesign; the largest is a UI-wiring product decision, not an
engineering risk.

## Release Readiness Assessment

| Dimension | Assessment |
|---|---|
| Tenant isolation | Strong. Enforced by construction at every sampled data-access path (parameterized SQL, `tenant_id` predicates on every tenant-owned query, no filter-after-fetch pattern found). Cross-tenant integration tests are substantively real — they attempt cross-tenant access and assert denial, not just same-tenant happy paths. |
| AuthN/AuthZ | Strong. Centralized ASP.NET Core policy system; no ad-hoc role checks found in Application/Api layers; the effective (impersonated) role, not the actor's original role, correctly drives authorization after "view as" starts. |
| CSRF/session | Strong. Full coverage on unsafe authenticated `/api/*` routes, constant-time comparison, correct cookie flags, session rotation on login and on impersonation start/stop. |
| XSS | Safe at runtime, but the documented mechanism is wrong (F1). |
| Architecture/layering | Clean. Domain/Application projects have zero ASP.NET Core/EF Core package references; DI lifetimes are correct; backend and frontend error-handling pipelines are each centralized and consistent — a genuine strength. |
| Code-craft hotspots | Partially remediated, and now accurately tracked by this document. Roughly half of the prior audit's Top-10 items are already fixed; the rest are already scheduled in an existing, owned remediation plan (Batches 1B–4). Nothing new and severe was found beyond what's already planned. |
| Test suite | Trustworthy. 142/142 backend unit, 32/32 non-Docker + 102/102 Docker-backed integration, 63/63 frontend, and 5/6 browser E2E all genuinely pass (`T-0044` baseline, re-confirmed by code reading here, not re-executed in this review). The one E2E failure is a confirmed stale assertion. |
| Dependencies | NuGet clean (re-scanned 2026-07-24: zero vulnerable packages across all 8 projects). npm has 7 advisories; only one (`react-router-dom`) is a shipped production dependency, and its fix is a major-version migration, not a patch. |

## Findings Index

| ID | Category | Severity | One-line summary | Disposition |
|---|---|---|---|---|
| F1 | Security / Docs | Medium | Documented XSS boundary (`HtmlEncodingMarkdownDocumentRenderer`) is dead code; real defense is the frontend renderer | Flagged — fix recommended |
| F2 | Docs Integrity | Medium | `code-quality-review.md` Top-10 items #1–2 (and part of #3) are stale; `batch-1a` already fixed them | Flagged — fix recommended |
| F3 | Architecture / Product Scope | Medium | Archive/unarchive documented as required user-visible behavior (FD-0001), backend-complete, but no frontend UI action exists | Flagged — **owner decision required** |
| F4 | Test Defect | Medium | Stale "Tenant admin" checkbox assertion in `e2e/tenant-host.spec.ts:59` | Fix identified below, not yet applied |
| F5 | Dependency | Medium | `react-router-dom` (production runtime dependency) sits in a vulnerable version range; fix is a major-version migration | **Owner decision required** — recommend durable defer to a dedicated task |
| F6 | Architecture | Low | Binder-rename endpoint (`PUT /api/binders/{binderId}`) has no frontend caller | Tracked, no canonical doc requires UI exposure |
| F7 | Architecture | Low | Three duplicate `{StatusCode,Title,Detail,ErrorCode}` problem-contract records | Tracked, cheap consolidation candidate |
| F8 | Process / Tooling | Low–Medium | No frontend lint / dead-export detection tooling; root cause that let `TenantImpersonationBanner` go dead unnoticed | Tracked |
| F9 | Dead Code / Product Decision | Low | `TenantImpersonationBanner` defined, never rendered | **Owner decision required** — recommend removal |
| F10 | Security | Low/Informational | Auth cookie `ExpireTimeSpan`/`SlidingExpiration` rely on framework default, not explicitly tuned | Tracked |
| F11 | Security | Low/Informational | No security headers shipped (CSP, `X-Content-Type-Options`, `Referrer-Policy`, etc.) | Confirmed intentional CP16 decision; cheap wins not yet added |
| F12 | Docs Drift | Low | `v1.1.0-baseline.md` says T-0039's branch is "not yet merged" — it has since merged (PR #44) | Self-resolving; baseline doc is a frozen point-in-time snapshot by design |
| F13 | Docs Drift | Low | `T-0024` test-coverage task frozen at stale counts (111/25/72/8 vs. current 142/32/102/63) | Tracked, historical-record note only |
| F14 | Technical Debt (rollup) | Low | Multi-type files, large Dapper services, endpoint repetition, transcript-style integration tests | Already tracked in the existing `code-quality-review.md` Batches 1B–4 plan; no new task needed |
| F15 | Code Quality | Informational | Pervasive null-forgiving (`!`) operator on Outcome records (28 occurrences) instead of a Result/discriminated-union type | Tracked, systematic not abusive |
| F16 | Naming | Informational | `PaperBinder*` prefix overuse in `src/PaperBinder.Api/` (47/61 files) | Tracked, zero functional risk |
| F17 | Future Drift | Informational | Hardcoded "© 2026 PaperBinder" copyright year, asserted literally in a test | Not a current defect; will drift 2027-01-01 |
| F18 | Dependency | Low | `vite`/`esbuild`/`postcss`/`@babel/core`/`undici` advisories are dev-tooling-only, not shipped to production | Legitimate to durably defer; should be labeled distinctly from F5 |
| F19 | Resolved | — | "Temporary password" browser-form-drift note (tracked since 2026-07-16) is already fixed by `T-0037`'s copy pass | **Resolved — close the tracking note, no further action** |
| F20 | Security (unverified hypothesis) | Low | "Add user" form combines an email input and a masked-password-type credential-display input in one `<form>`; plausible browser password-manager false trigger | Unconfirmed in a live browser; cheap to check |

## Detailed Findings

### Security

**F1 [Medium] — Documented XSS boundary is dead code, real defense is undocumented.**
`src/PaperBinder.Infrastructure/Documents/HtmlEncodingMarkdownDocumentRenderer.cs` (lines 1-16)
implements `IMarkdownDocumentRenderer` by HTML-encoding markdown via
`HtmlEncoder.Default.Encode(markdown)`. It is registered in DI at
`src/PaperBinder.Infrastructure/Persistence/PaperBinderPersistenceServiceCollectionExtensions.cs` (line 35),
and its own inline comment (line 12) states: `// CP10 establishes a centralized safe-rendering
boundary without introducing a markdown parser yet.` A full-repo search found **zero call sites**
for this type outside its own registration — it is never injected or invoked. The API returns the
raw markdown `Content` string directly (`PaperBinderDocumentContractModels.cs:9,29,55`).

The actual runtime XSS defense is the frontend's own hand-rolled markdown-to-JSX renderer in
`src/PaperBinder.Web/src/app/tenant-document-detail-route.tsx` (lines 34-237), which is safe: it never
uses `dangerouslySetInnerHTML` (confirmed zero occurrences repo-wide), relies on React's automatic
text-node escaping, and allowlists link `href` values to `http:`/`https:`/`mailto:`/same-app-relative
paths via `isSafeMarkdownHref` (lines 14-32), using the WHATWG `URL` parser's own protocol
resolution to reject `javascript:`/`data:`/`vbscript:` obfuscation attempts.

**No exploitable XSS was found.** This is a documentation/dead-code correction, not a live
vulnerability: the code comment and (by extension) `docs/30-security/threat-model-lite.md`'s XSS
mitigation description point at the wrong mechanism. A future engineer relying on the backend
renderer as "the" boundary would be wrong.
Recommended fix: delete the unused renderer/registration and correct the comment and threat-model
doc to describe the real (frontend) boundary — or, alternatively, wire the backend renderer into
an actual response path if a defense-in-depth argument is preferred. Removal is the lower-risk,
lower-maintenance option since the frontend boundary is already sufficient and tested.

**F10 [Low/Informational] — Cookie lifetime relies on framework default.**
`src/PaperBinder.Api/PaperBinderAuthenticationExtensions.cs` (lines 37-64) configures `HttpOnly=true`,
`SameSite=Lax`, and `Secure` correctly, but does not set `ExpireTimeSpan`/`SlidingExpiration`
explicitly — the app relies on ASP.NET Core Identity's framework default (14 days, sliding) for
the server-side ticket's absolute lifetime bound. `isPersistent: false` is used at sign-in
(`PaperBinderAuthEndpoints.cs:98-99,148-149`), which only controls whether the cookie itself
survives a browser restart, not the ticket's server-checked expiry. Reasonable for a demo app, but
an implicit rather than intentionally tuned bound.

**F11 [Low/Informational] — No security headers shipped.**
Confirmed via repo-wide search: no `Content-Security-Policy`, `X-Content-Type-Options`,
`X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, or `Strict-Transport-Security` header
is emitted anywhere in `src/` or the Caddy configs (`deploy/local/Caddyfile`, `deploy/prod/Caddyfile`,
`deploy/test/Caddyfile`). This matches `docs/95-delivery/pr/cp16-hardening-and-consistency-pass/critic-review.md`,
which records this as an explicit, reviewed CP16 scope decision (locked decision `B2`) — **not an
oversight**. Worth flagging for this closeout specifically because `X-Content-Type-Options: nosniff`
and a basic `Referrer-Policy` were both considered in that same decision and are near-zero-cost to
add; they were not shipped.

**F20 [Low, unverified — flagged for a cheap manual check, not a confirmed defect.]**
`src/PaperBinder.Web/src/app/tenant-users-route.tsx`'s "Add user" form contains both an
`<input type="email">` (line 680) and, after a successful submission, a masked
`<input type={sensitive && !isRevealed ? "password" : "text"}>` credential-display field
(`credential-display-field.tsx:104`) — inside the same `<form>` element (closing `</form>` at
`tenant-users-route.tsx:775`). An email input plus a password-type input in the same form is
exactly the heuristic browsers use to detect login/signup forms, which could plausibly trigger an
unwanted "save password?" prompt on a field that is actually read-only, post-creation display, not
credential entry. This was **not verified in a live browser** during this review — it's a code-
reading hypothesis, distinct from, and not to be confused with, the previously-tracked "Temporary
password" drift note, which is a different, already-resolved issue (see F19). Recommended action:
a two-minute manual check in Chrome/Firefox devtools; if confirmed, the fix is likely moving the
credential-display block outside the `<form>` element (it is not part of the form's submission
anyway).

**Confirmed correct, no findings** (independently re-verified against current code, not assumed
from prior docs):
- **Middleware order / tenant-context immutability**: `src/PaperBinder.Api/Program.Partial.cs` (lines 43-46)
  wires `UsePaperBinderHttpContract()` → `UsePaperBinderAuthentication()` → `UsePaperBinderTenancy()`
  → `UsePaperBinderApiProtection()` (host-kind gating → CSRF → authenticated-mutation rate limit →
  `UseAuthorization()`). Host resolution happens in `TenantResolutionMiddleware.InvokeAsync`
  (`TenantResolutionMiddleware.cs:40-53`), which rejects unknown/malformed hosts with `400` before
  any tenant-scoped logic runs. Tenant context (`EstablishTenant`) and membership context
  (`Establish`) are only set after authentication, actor security-stamp validation, membership
  lookup (403 if none), and expiry check (410 if expired) all succeed
  (`TenantResolutionMiddleware.cs:95-164`). `PaperBinderTenantRequestContext.EstablishTenant`/
  `EstablishSystem` throw `InvalidOperationException` on a second call
  (`PaperBinderTenantRequestContext.cs:36-42`), enforcing true single-establishment immutability at
  the type level. Every mapped route group carries an explicit `.RequirePaperBinderTenantHost()` or
  `.RequirePaperBinderSystemHost()`.
- **Tenant-scoped data access**: every tenant-owned-table query sampled across `BinderSql.cs`,
  `DapperBinderService.cs`, `DapperDocumentService.cs`, `DapperTenantMembershipLookupService.cs`,
  `DapperTenantLookupService.cs`, `TenantUserAdministrationSql.cs`,
  `DapperTenantUserAdministrationService.cs`, `DapperTenantLeaseService.cs`,
  `DapperTenantLeaseCleanupService.cs`, and `DapperTenantImpersonationAuditService.cs` includes
  `tenant_id` directly in its SQL `WHERE`/`USING` clause — no "filter after fetch" pattern found.
  All queries use Dapper `CommandDefinition` with parameterized placeholders; no string-concatenated
  SQL was found. System-context (multi-tenant) queries are limited to the documented cleanup-job
  case: `DapperTenantLeaseCleanupService.RunCleanupCycleAsync` (`:32`) selects candidate expired
  tenants globally, then purges each tenant's rows individually scoped by `tenant_id` in FK-safe
  order — `tenant_impersonation_audit_events` (`:146-154`), `documents`, `binder_policies`,
  `binders`, `user_tenants`, owned `users` rows, then the `tenants` row itself — with per-tenant
  purge failures isolated inside the loop (`:45-71`) so one bad tenant doesn't abort the cycle.
- **View-as / impersonation boundary**: target lookup is scoped to
  `FindMembershipAsync(targetUserId, tenant.TenantId, ...)` (`PaperBinderImpersonationService.cs:152-155`
  → `DapperTenantMembershipLookupService.cs:16-33`), so a cross-tenant user id returns
  `TargetUserNotFound` with no distinguishing information (cross-tenant existence is not
  discoverable). Tenant identity never changes — impersonation only swaps `effectiveUserId` via
  claims (`:187-190`); `TenantResolutionMiddleware` re-derives tenant purely from the host on every
  request, unaffected by impersonation claims. Audit rows always carry `tenant_id`
  (`DapperTenantImpersonationAuditService.cs:24-41`) and are purged with the rest of the tenant.
  Stop-impersonation re-authenticates as the original actor with a freshly rotated security stamp
  under row-level locking (`PaperBinderImpersonationService.cs:240-257,369-413`). Authorization
  after impersonation starts uses the **effective** (impersonated) role
  (`TenantMembershipAuthorizationHandler`, `PaperBinderAuthorization.cs:53-71`), matching
  `docs/20-architecture/policy-authorization.md`. The impersonation start/stop endpoints are mapped
  under the generic `AuthenticatedUser` policy with the `TenantAdmin`-to-start check performed
  inline via the shared `TenantRoleAuthorization` helper (not a raw ad-hoc comparison) — this is a
  documented, reviewed CP15 exception, not a violation of the "no ad-hoc role checks" rule.
- **CSRF**: `PaperBinderCsrfMiddleware.ShouldValidateRequest` (`PaperBinderCsrfMiddleware.cs:52-79`)
  requires validation for all authenticated unsafe `/api/*` requests; validation is constant-time
  (`CryptographicOperations.FixedTimeEquals`, `PaperBinderCsrfProtection.cs:20-33`); cookie flags
  (`PaperBinderCsrfCookieService.cs:28-40`) are `HttpOnly=false` (intentionally JS-readable),
  `SameSite=Lax`, `Secure` when the public URL is HTTPS. No unsafe endpoint bypasses CSRF
  unintentionally. The frontend correctly attaches `X-CSRF-TOKEN` only on unsafe methods
  (`src/PaperBinder.Web/src/api/client.ts` (lines 172-183, 380-385)).
- **Authorization policy consistency**: policies are centrally defined in
  `PaperBinderAuthorization.cs` and attached via `.RequireAuthorization(...)` on every mapped
  endpoint; the only role-comparison code outside that central definition is in the rule-evaluator
  abstractions themselves (`BinderPolicyEvaluator.cs:16`, `TenantRoleAuthorization.cs:10`,
  `TenantUserAdministrationRules.cs:11,18`), not scattered ad-hoc handler checks.
- **Host validation / spoofing**: `PaperBinderTenantHostResolution.Resolve`
  (`PaperBinderTenantHostResolution.cs:16-97`) validates against the actual `Host` header only,
  with strict single-label slug parsing; malformed/unknown hosts get `400` before any handler runs.
  No usage of `X-Forwarded-Host`/`X-Forwarded-Proto`/`UseForwardedHeaders()` was found anywhere in
  `src/` — the app trusts no forwarded-header override. Redirects are anchored to the configured
  `PAPERBINDER_PUBLIC_ROOT_URL`, not the raw request host (`PaperBinderTenantRedirectUrlBuilder.cs:5-26`).

### Architecture / Maintainability

**F2 [Medium] — Prior code-quality audit is now materially stale.**
`docs/50-engineering/code-quality-review.md` and `docs/50-engineering/code-quality-gap-analysis.md`
were written before a remediation pass (`batch-1a`, at a commit that is an ancestor of the current
branch tip — see `docs/50-engineering/batch-1a-summary.md`) that already fixed two of the audit's
own Top-10 items:
- Item #1 (hand-rolled enum/string parsing): `TenantRoleParser.cs:9-11` and
  `PaperBinderRuntimeSettings.cs:90-92` now use `Enum.TryParse` + `Enum.IsDefined` with an ordinal
  round-trip check, each with a rationale comment. `BinderPolicyModeNames.TryParseContractValue`
  (`BinderRules.cs:22-39`) remains a manual string map, but maps snake_case wire values to
  differently-cased enum members — the gap-analysis doc's own stated exception ("custom string
  maps are acceptable only when the external contract intentionally differs from enum names").
- Item #2 ("Normalize" helpers that just trim): renamed to `DocumentRules.TryTrimToValidTitle`
  (`DocumentRules.cs:10`), `BinderNameRules.TryTrimToValidName` (`BinderRules.cs:10`), and
  `PaperBinderTenantUserRequestValidation.TryTrimToValidEmailAddress`
  (`PaperBinderTenantUserRequestValidation.cs:7-17`) — the last of which now genuinely validates via
  `System.Net.Mail.MailAddress.TryCreate` with a round-trip check, a real improvement, not just a
  rename.
- Item #3 (multi-type files) is **partially** fixed: `ITenantUserAdministrationService.cs` is now a
  clean 20-line interface file with its command/result/failure family moved to
  `TenantUserAdministrationContracts.cs`. `DocumentContracts.cs` (116 lines/10 types),
  `BinderContracts.cs` (128 lines/12 types), `ITenantProvisioningService.cs` (129 lines: interface +
  outcome + 2 records + enum + a rules class), and `PaperBinderRuntimeSettings.cs` (437 lines/10
  types) remain unsplit.

The audit document's own text was never updated to strike these fixed items — its git history
shows only a later tone-softening edit, no content revision reflecting `batch-1a`. Per this repo's
own `docs/00-intent/documentation-integrity-contract.md`, this is a real documentation-integrity
gap: a reviewer reading only `code-quality-review.md` today draws wrong conclusions about current
code state.

Everything else in the prior audit's Top-10 was independently re-checked and found **still
accurate and unremediated**, with an existing owned remediation plan already recorded in the same
document (Batches 1B, 2, 3, 4): large Dapper services mixing concerns (`DapperDocumentService.cs`
865 lines, `DapperBinderService.cs` 508 lines, `DapperTenantUserAdministrationService.cs` 444
lines); endpoint repetition in `PaperBinderBinderEndpoints.cs`/`PaperBinderDocumentEndpoints.cs`
(tenant-user endpoints were fixed, these were not); transcript-style integration tests
(`BinderDomainAndPolicyModelIntegrationTests.cs` 697 lines/17 methods,
`DocumentDomainAndImmutableDocumentRulesIntegrationTests.cs` 904 lines/16 methods); middleware
order (`Program.Partial.cs`) still lacking local rationale comments; and checkpoint-flavored
comments (e.g. the F1 comment above). These are tracked under **F14** below and do not need a new
task — the existing Batch 1B–4 plan already owns them.

**F3 [Medium — owner decision required] — Archive/unarchive has no frontend UI.**
`docs/15-feature-definition/FD-0001-binder-document-detail-and-archive-semantics.md` (status
"Resolved — integrated into canonical documentation") states: *"Users with write access can
archive and unarchive documents."* The backend fully supports this — `POST
/api/documents/{documentId}/archive` and `/unarchive` (`PaperBinderDocumentEndpoints.cs:20-23`),
domain rules (`DocumentRules.ValidateArchiveTransition`), and failure kinds
(`DocumentFailureKind.AlreadyArchived`/`NotArchived`) all exist and are covered by tests. But
`src/PaperBinder.Web/src/api/client.ts` has no `archiveDocument`/`unarchiveDocument` method, and
`tenant-document-detail-route.tsx` (lines 417-455) only *displays* `archivedAt` — there is no
button or control to trigger the transition. **This is a genuine gap between a "Resolved" product
decision and shipped behavior**, not just unused code. Needs an explicit owner call: add the UI
before `v1.1.0` ships, or formally amend FD-0001 to defer the UI past `v1.1.0` with rationale.
(Binder rename has the identical structural gap — see F6 — but no canonical doc requires it to be
user-visible, so it's rated Low, not Medium.)

**F6 [Low] — Binder rename has no frontend caller.** `PUT /api/binders/{binderId}`
(`PaperBinderBinderEndpoints.cs:21`) is implemented, authorized, and tested, but no frontend UI or
API-client method calls it. No canonical doc requires this to be user-visible; tracked as debt, not
a gap.

**F7 [Low] — Three duplicate problem-contract records.** `PaperBinderApiProblem`
(`PaperBinderApiProblem.cs:3-7`), `TenantLeaseProblemContract`
(`PaperBinderTenantLeaseProblemMapping.cs:5-9`), and `TenantImpersonationProblemContract`
(`PaperBinderImpersonationProblemMapping.cs:18-22`) are structurally identical
`(int StatusCode, string Title, string Detail, string ErrorCode)` shapes, unified by nothing. A
concrete, cheap-to-fix instance of the "generated-looking repetition" pattern the existing audit
describes abstractly.

**F8 [Low–Medium] — No frontend lint / dead-export tooling.** `src/PaperBinder.Web/package.json`
has no ESLint dependency or lint script (only `tsc -b`, `vite build`, `vitest`, `playwright`).
`tsconfig.app.json`'s `noUnusedLocals`/`noUnusedParameters` catch unused *local* variables, not
unused *exported* modules — exactly the gap that let `TenantImpersonationBanner` (see F9) go dead
without detection. A scan of all other `app/*.tsx` and `components/ui/*.tsx` files found no other
orphaned components — this appears to be an isolated instance today, but the tooling gap that
allowed it will recur.

**F9 [Low — owner decision required] — `TenantImpersonationBanner` is dead code.**
`src/PaperBinder.Web/src/app/tenant-impersonation-banner.tsx` is fully implemented but has zero
importers anywhere in `src/` (confirmed by repo-wide search — only its own definition file
matches). The live "view as" UX (header account-label swap to "Viewing as" plus a "Stop view as"
control) already covers the functional need and is well-tested
(`tenant-shell.test.tsx:424-454,1079-1131`). The banner also duplicates a `formatRole()` helper
that already exists in `tenant-shell.tsx`. **Recommendation: remove it** rather than wire it up —
this is the T-0045 acceptance-criteria decision point explicitly called out in the task file, not
merely an FYI.

**F14 [Low, rollup — already tracked, not new] —** the still-open items from `code-quality-review.md`'s
Top-10 (multi-type files, large Dapper services, endpoint repetition, transcript-style tests,
uncommented middleware ordering, checkpoint-flavored comments) remain accurate and already have an
owned remediation plan (Batches 1B–4) in that same document. No new task is needed; this closeout
just confirms they're still current and still tracked.

**F15 [Informational] — Pervasive null-forgiving (`!`) operator on Outcome records.** 28
occurrences in `src/PaperBinder.Api` alone, almost all of the form `outcome.Failure!` /
`outcome.Document!` immediately after checking `outcome.Succeeded`. The invariant (Succeeded ⇒
payload non-null, else Failure non-null) is enforced only by convention via each Outcome record's
static factory methods (e.g. `DocumentCreateOutcome.Success`/`.Failed`,
`DocumentContracts.cs:84-116`), not by the type system. A `Result<TSuccess,TFailure>`-style
discriminated union would remove the need for `!` entirely. Systematic and consistent, not abusive
— the same root cause as F7's outcome-scaffolding duplication.

**F16 [Informational] — `PaperBinder*` prefix overuse.** 47 of 61 files in
`src/PaperBinder.Api/*.cs` are named `PaperBinder*.cs`. Zero functional risk, purely
browse-friction, applied consistently. The original audit's Top-10 arguably over-weighted this
relative to a staff bar; re-rated Low here.

**Confirmed clean, no findings** (independently verified, not assumed):
- Transaction/connection disposal is correct: `NpgsqlTransactionScopeRunner.cs:39-40` uses
  `await using` for both connection and transaction, with commit-or-rollback-then-rethrow and a
  rollback-failure path that logs rather than masking the original exception (`:57-73`).
- No `ConfigureAwait` anywhere in `src/` — a consistent, coherent convention for an ASP.NET Core
  host with no `SynchronizationContext` to protect, not an inconsistency.
- No commented-out code and no `TODO`/`FIXME`/`HACK` comments anywhere in `src/` (backend or
  frontend), checked recursively.
- `Nullable=enable` is set in every `.csproj` and appears genuinely respected; no unmanaged
  `#pragma warning disable` in hand-written code.
- Layering holds cleanly: `PaperBinder.Domain.csproj` has zero package/project references;
  `PaperBinder.Application.csproj` references only Domain; neither references
  `Microsoft.AspNetCore.*` or `Microsoft.EntityFrameworkCore.*` types anywhere. `Infrastructure` is
  the only project referencing Dapper/Npgsql/EF Core/Identity.Core.
- DI lifetimes are sound: no singleton captures a scoped dependency; no service is registered
  twice; stateless singletons (`ISqlConnectionFactory`, `ITransactionScopeRunner`,
  `IBinderPolicyEvaluator`, `IMarkdownDocumentRenderer`, `ISystemClock`) genuinely don't inject
  scoped services.
- Error-handling pipelines are centralized and consistent on both sides. Backend:
  `PaperBinderProblemDetails.WriteApiProblemAsync` (`PaperBinderProblemDetails.cs:11-58`) is used
  uniformly by every endpoint file, `UseExceptionHandler()` plus `AddProblemDetails(...)` catches
  anything unhandled with no leaked stack traces, and zero ad-hoc `catch (Exception` blocks exist
  in `src/PaperBinder.Api`. Frontend: `mapTenantHostError`/`mapRootHostError`
  (`tenant-host-errors.ts`, `root-host-errors.ts`) are single, exhaustive, centralized mappers that
  every route component uses rather than reimplementing error text. This is one of the
  stronger-engineered parts of the codebase.

### Test Correctness

**F4 [Medium, easy fix] — Stale E2E assertion, independently confirmed.**
`e2e/tenant-host.spec.ts:59` — `await page.getByLabel("Tenant admin").check();` — times out because
`tenant-binder-detail-route.tsx:31` intentionally filters `TenantAdmin` out of the selectable
binder-policy roles (`binderPolicySelectableRoleOptions = roleOptions.filter((role) => role !==
"TenantAdmin")`), and the panel copy (line 238) reads: *"Tenant admins always retain access. Select
any additional roles that can open this binder."* There is genuinely no such checkbox to check.

This was independently re-confirmed (not just re-stated from the `T-0044` baseline) via:
- The UI code itself, read in full.
- Backend domain-rule tests proving `TenantAdmin` is force-added server-side to any
  `restricted_roles` policy and always allowed regardless of `allowedRoles`
  (`BinderDomainAndPolicyModelTests.cs:15,107-154`) — the UI omission matches real, enforced
  backend behavior, not a rendering accident.
- Git history: the UI change landed in commit `eb78a48` ("fix(ui): refine reviewer workspace
  surfaces", 2026-07-21), which in the *same commit* correctly updated the Vitest suite
  (`tenant-shell.test.tsx`, now only checks "Binder read"). It did not touch the Playwright E2E
  spec, and a later, E2E-focused commit (`0586932`, 2026-07-23) still didn't catch it.

**Classification: test defect (stale test expectation).** Locking a tenant admin out of their own
tenant's binder would be a self-lockout foot-gun; the backend enforces the invariant
unconditionally, and the panel copy already communicates why no checkbox exists. This is
confirmed-correct product behavior, not a gap needing a new UI affordance.

**Concrete fix (not yet applied):** in `src/PaperBinder.Web/e2e/tenant-host.spec.ts`, replace line 59

```ts
await page.getByLabel("Tenant admin").check();
```

with an assertion on the copy that already communicates the same fact:

```ts
await expect(
  page.getByText("Tenant admins always retain access. Select any additional roles that can open this binder.")
).toBeVisible();
```

placed immediately after line 58 (`await page.getByLabel("Access mode").selectOption("restricted_roles");`)
and before the existing `await page.getByLabel("Binder read").check();` on line 60. No other change
is needed — the rest of the flow (Binder read is the only allowed role, the reader can subsequently
open the binder/document, and is still forbidden from `/app/users`) already correctly exercises the
intended behavior once the phantom checkbox interaction is removed.

**F13 [Low] — Stale coverage-count doc.**
`docs/05-taskboard/tasks/T-0024-track-remaining-test-coverage-gaps.md` is marked `done` with
validation evidence frozen at 2026-04-16 counts (111 unit/25 non-Docker/72 Docker/8 frontend). The
suite has since grown to 142/32/102/63 without `T-0024` being reopened or a successor gap-tracking
task created. Its own acceptance criteria (a specific `CHALLENGE_FAILED` gap) are still genuinely
closed — this is a stale point-in-time record, not a test defect. Worth a note so nobody mistakes
it for current state.

**F17 [Informational] — Hardcoded copyright year.** `tenant-shell.tsx:536` renders
`&copy; 2026 PaperBinder`; `tenant-shell.test.tsx:112` asserts the literal string. Correct today
(2026-07-24); both will go stale together on 2027-01-01. Not a current defect.

**Confirmed clean, no findings:**
- Only two `test.skip(...)` calls exist in the entire suite (both in `e2e/root-host.spec.ts:34,51`),
  both conditional defensive guards against a prior serial test failing to seed shared state, not
  blanket-disabled tests hiding a problem. No `.skip`/`xit`/`describe.skip`/`test.fixme` anywhere
  else in the frontend suite, and no `[Fact(Skip=...)]`/`[Theory(Skip=...)]` anywhere in the backend
  suite.
- Sampled high-risk test files (`tenant-shell.test.tsx` — 1228 lines, `app-router.test.tsx`,
  `tenant-host-errors.test.ts`) all exercise real production code against a stubbed API-client
  *interface* boundary and assert on real rendered DOM or real mapper output — legitimate
  boundary-level testing, not tautological self-mock testing. No misleadingly-named tests found.
- `docs/30-security/tenant-isolation.md` (line 39)'s claim ("Integration tests must prove no cross-tenant
  reads/writes") is **substantively true**, not just nominally true: real cross-tenant-attempt
  tests exist and were read in full —
  `BinderDomainAndPolicyModelIntegrationTests.cs:255-276` (cross-tenant binder read → 404),
  `DocumentDomainAndImmutableDocumentRulesIntegrationTests.cs:319-333,408-422` (cross-tenant
  document list/detail → 404),
  `AuthorizationPoliciesAndTenantUserAdministrationIntegrationTests.cs:41-77,663-672` (cross-tenant
  user-list omission and policy-probe denial), and
  `TenantImpersonationIntegrationTests.cs:106-136` (cross-tenant impersonation target → 404,
  proving cross-tenant user existence isn't discoverable). Each seeds two distinct tenants and
  asserts a hard denial, not same-tenant happy-path coverage mislabeled. This is a confirmed
  strength.

### Technical Debt

See F9 (dead `TenantImpersonationBanner`), F14 (rollup of already-tracked hotspot debt), F7 (duplicate
problem contracts), F15 (null-forgiving usage), F16 (naming prefix) above.

### Dependencies

Re-scanned fresh against commit `a29305c` on 2026-07-24 (not reused from the `T-0044` baseline,
which scanned on 2026-07-23 against a slightly earlier commit on the same content).

- `dotnet list PaperBinder.sln package --vulnerable --include-transitive` — **zero vulnerable
  packages** across all 8 .NET projects (`PaperBinder.Api`, `PaperBinder.Worker`,
  `PaperBinder.Domain`, `PaperBinder.Application`, `PaperBinder.Infrastructure`,
  `PaperBinder.Migrations`, `PaperBinder.UnitTests`, `PaperBinder.IntegrationTests`).
- `npm audit` (from `src/PaperBinder.Web`) — **7 vulnerabilities: 2 low, 5 high.**

**F5 [Medium — owner decision required] — `react-router-dom` (production dependency) in a
vulnerable range.** Installed `react-router-dom@7.13.2` (and its `react-router@7.13.2` dependency)
falls inside the vulnerable range `7.0.0-pre.0`–`7.14.1`, covering several high-severity advisories
(open redirect via backslash in `<Link>`/`useNavigate`, DoS via unbounded path expansion and
reflected input, a `turbo-stream` deserialization issue described as RCE-class, and others). This
is the one npm advisory that's genuinely release-relevant: `react-router-dom` is listed directly in
`package.json` `dependencies` (not `devDependencies`) and is shipped in the production browser
bundle.

The fix is **not a patch** — `npm audit fix --force --dry-run` shows the safe range starts at React
Router 8.x, a major-version migration, not a `7.x.y` bump. Several of the listed CVEs (RSC/SSR
hydration bypass, the `__manifest` endpoint DoS, single-fetch DoS) are specific to React Router's
"framework mode" (Remix-style server-side rendering), which this app does not use — PaperBinder is
a plain client-rendered SPA built with Vite, using `react-router-dom` in classic client-side mode.
This meaningfully narrows real exposure, though it does not eliminate it (the open-redirect CVE, in
particular, targets `<Link>`/`useNavigate` usage generally, which this app does use).

**Recommendation:** durably defer the full 7→8 migration to a dedicated follow-up task rather than
folding a major dependency migration into T-0045's "low-risk fixes only" scope — but do a quick,
targeted manual check of the open-redirect CVE's applicability to this app's actual `<Link>`/
`useNavigate` usage before shipping `v1.1.0`, since that's the one advisory in the list that isn't
obviously framework-mode-only.

**F18 [Low] — Remaining 6 advisories are dev-tooling-only, not shipped to production.** `vite`,
`esbuild`, `postcss`, and `@babel/core` are `devDependencies` (build-time only — never present in
the built `dist/` output); `undici` is a transitive dependency of the dev/build toolchain, not
listed directly in `package.json`. These account for 6 of the 7 advisories. Legitimate to durably
defer, but the release-facing record should say "1 production-relevant (F5), 6 dev-tooling-only" —
not an undifferentiated "7 advisories," since that materially overstates or understates risk
depending on how a reader interprets a flat count.

### Documentation Drift

See F1, F2, F3, F12, F13, F19 above — each of those findings is, in part or in whole, a
documentation-vs-implementation drift correction.

**F12 [Low, self-resolving].** `docs/95-delivery/v1.1.0-baseline.md` states the T-0039
responsive-QA branch is "not yet merged." It has since merged (PR #44, now the tip of
`release/v1.1.0`). The baseline doc is explicitly a dated point-in-time snapshot by its own design
(see its Purpose section) — this is not treated as a defect requiring an edit to that document; it
is noted here for whoever next reconciles cross-document state (likely `T-0043`).

## False Positives / Confirmed Intentional Behavior

These were investigated and found to be deliberate, already-reviewed decisions, not defects:

- Impersonation start/stop mapped under the generic `AuthenticatedUser` policy with `TenantAdmin`
  enforced inline in the service, using the centralized `TenantRoleAuthorization` helper — a
  documented CP15 decision, not an ad-hoc authorization bypass.
- No CSP or other security headers — an explicit, locked CP16 scope decision (see F11 for the
  narrower "cheap wins not taken" note within that same confirmed-intentional decision).
- `BinderPolicyModeNames.TryParseContractValue`'s manual string map — defensible per the repo's own
  stated exception for wire contracts that intentionally differ from enum casing.
- No `ConfigureAwait` anywhere in `src/` — a correct, coherent ASP.NET Core convention, not an
  inconsistency.
- The two `test.skip` guards in `e2e/root-host.spec.ts` — legitimate conditional skips protecting
  shared serial-test state, not suppressed failures.
- Absence of a "Tenant admin" checkbox in the binder-policy UI — correct, intentional, and
  server-enforced product behavior. The *test* (F4) was wrong, not the product.
- Cross-tenant isolation integration-test coverage — confirmed substantively real, a genuine
  strength, not a gap.

## Validation Summary

**Methodology:** this review combined direct code reading across three independent focus areas
(security/tenant-isolation/authz, architecture/dead-code/error-handling, test-suite correctness)
plus direct dependency and documentation verification, all performed against actual current code —
not by re-stating prior write-ups. Every finding above cites a specific file and line range that
was actually opened and read as part of this review.

**Test execution:** this review did not re-run the automated test suite; it relies on `T-0044`'s
freshly-executed results (142/142 unit, 32/32 non-Docker integration, 102/102 Docker integration,
63/63 frontend, browser E2E 3/3 root-host + 2/3 tenant-host) recorded in
`docs/95-delivery/v1.1.0-baseline.md`, since the code paths those tests exercise were not changed
by this review (no application or test code was modified). The one E2E failure was independently
re-diagnosed by code reading (F4) rather than re-executed, and the classification matches the
baseline's own tentative conclusion.

**Dependency scans:** re-run fresh in this review (`npm audit`, `dotnet list package --vulnerable
--include-transitive`), dated 2026-07-24, against commit `a29305c`. Results reported under
Dependencies above.

**Release confidence:** High. No Critical or High-severity finding exists anywhere in this review.
The Medium-severity findings (F1–F5) are all either small documentation/code corrections or
decisions that can be made quickly without new engineering work.

**Overall recommendation:** `v1.1.0` is release-ready pending an explicit disposition (fix, or
documented defer with rationale) on F1 through F5. None of them block release on their own merits;
they should each get a recorded decision before final close-out (`T-0043`) rather than ship silently
undecided.

## Recommended Remediation Plan

This section is a **plan**, not an execution log. No remediation has been performed as part of this
review or this document.

**Bundle A — small, low-risk, in-scope for a fresh T-0045 remediation pass** (matches T-0045's own
scope-lock: "discovery and low-risk fixes only"):
- F4: apply the identified E2E test fix (isolated, test-only change).
- F9: remove `TenantImpersonationBanner` and its duplicated `formatRole`.
- F1: correct the misleading renderer comment/threat-model doc language; delete the unused renderer
  (or wire it in, if a defense-in-depth argument is preferred — removal is the lower-risk default).
- F2: update `code-quality-review.md` to strike the items `batch-1a` already fixed.
- F19, F12, F13: taskboard/doc housekeeping — close the resolved item, note the point-in-time
  nature of the baseline and `T-0024` docs.
- F7: consolidate the three duplicate problem-contract records (small, mechanical).
- F5 / F18: record the dependency-advisory triage decision explicitly in the release-facing docs
  (1 production-relevant/deferred-with-rationale, 6 dev-tooling/deferred) rather than leaving an
  undifferentiated count.
- F20: a two-minute manual browser check; fix if confirmed (likely: move the credential-display
  block outside the `<form>`).

**Bundle B — needs its own task, outside T-0045's low-risk scope-lock:**
- F3 (archive/unarchive UI): a product feature addition, not a low-risk fix. Requires an explicit
  owner decision (build the UI, or formally amend FD-0001 to defer past `v1.1.0`) before it's
  assigned anywhere.
- F5 (React Router 7→8 migration): its own task with its own validation pass, once/if the owner
  decides not to durably defer it.
- F8 (add ESLint + dead-export detection): a small, standalone tooling task; prevents recurrence of
  F9-style drift.

**Not new work — already tracked:** F6, F14, F15, F16 roll into the existing Batch 1B–4 plan
already documented in `code-quality-review.md`. No new task should be created for these.

**Suggested commit structure for Bundle A**, each small and single-purpose:
1. `test(e2e): fix stale tenant-admin binder-policy assertion` — F4
2. `refactor(web): remove unused TenantImpersonationBanner` — F9
3. `fix(docs): correct XSS-boundary documentation and remove unused markdown renderer` — F1
4. `docs(engineering): reconcile code-quality-review.md with batch-1a fixes` — F2
5. `refactor(api): consolidate duplicate problem-contract records` — F7
6. `docs(taskboard): close resolved findings and record dependency triage` — F19, F12, F13, F5, F18

## Deferred Items / Owner Decisions Required

These require a decision from the repository owner before remediation can proceed — they are not
purely mechanical fixes:

1. **F3 — Archive/unarchive UI.** Build the frontend control, or amend FD-0001 to explicitly defer
   this past `v1.1.0` with rationale. Recorded here as unresolved; no default assumed.
2. **F5 — React Router 7→8 migration.** Recommend durable deferral to a dedicated task given the
   scope of a major-version migration, with a scoped manual check of the open-redirect CVE's
   applicability before shipping `v1.1.0`. Needs sign-off, not assumed accepted.
3. **F9 — `TenantImpersonationBanner` disposition.** Recommend removal (the live "view as" UX
   already covers the need). Needs explicit sign-off per T-0045's own acceptance criteria wording
   ("wired up, replaced, or removed").

## Related Documents

- [T-0045 task file](../05-taskboard/tasks/T-0045-v1-1-engineering-security-architecture-closeout.md)
- [`docs/95-delivery/v1.1.0-baseline.md`](../95-delivery/v1.1.0-baseline.md) — the `T-0044` baseline this review builds on
- [`docs/50-engineering/code-quality-review.md`](code-quality-review.md) — prior implementation audit (partially superseded by F2 above; not yet corrected)
- [`docs/50-engineering/code-quality-gap-analysis.md`](code-quality-gap-analysis.md)
- [`docs/50-engineering/batch-1a-summary.md`](batch-1a-summary.md) — the remediation pass that fixed part of the prior audit
- [`docs/30-security/tenant-isolation.md`](../30-security/tenant-isolation.md)
- [`docs/30-security/threat-model-lite.md`](../30-security/threat-model-lite.md)
- [`docs/15-feature-definition/FD-0001-binder-document-detail-and-archive-semantics.md`](../15-feature-definition/FD-0001-binder-document-detail-and-archive-semantics.md)
- [`docs/05-taskboard/tasks/T-0024-track-remaining-test-coverage-gaps.md`](../05-taskboard/tasks/T-0024-track-remaining-test-coverage-gaps.md)
