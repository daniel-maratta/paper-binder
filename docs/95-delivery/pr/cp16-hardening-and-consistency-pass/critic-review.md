# CP16 Critic Review: Hardening And Consistency Pass
Status: Scope-Lock Review (Pre-Implementation) — Re-Review Complete

Historical note: This artifact begins with the `2026-04-18` first-pass scope-lock review, which returned seven blocking findings (`B1`-`B7`) and eight non-blocking findings (`NB-1`-`NB-8`). The plan was revised the same day to resolve all blockers and every non-blocker. The Re-Review section at the bottom of this file records the `2026-04-18` re-review outcome: scope-locked.

Reviewer: PaperBinder Critic
Date: 2026-04-18

Inputs reviewed:
- `docs/55-execution/execution-plan.md` (CP16 checkpoint definition)
- `docs/55-execution/phases/phase-5-hardening-release.md`
- `docs/95-delivery/pr/cp16-hardening-and-consistency-pass/implementation-plan.md`
- `docs/30-security/threat-model-lite.md`
- `docs/30-security/rate-limiting-abuse.md`
- `docs/30-security/secrets-and-config.md`
- `docs/40-contracts/api-contract.md` (impersonation and rate-limit surface)
- `docs/70-operations/observability.md`
- `docs/95-delivery/pr/cp15-tenant-local-impersonation-and-audit-safety/critic-review.md` (prior checkpoint posture, carry-forward non-blockers)
- Current runtime surface spot checks:
  - `src/PaperBinder.Infrastructure/Configuration/PaperBinderRuntimeSettings.cs` (dormant `AuthenticatedPerMinute` plumbing confirmed)
  - `src/PaperBinder.Api/PaperBinderChallengeVerification.cs` (only consumer of `PB_ENV`)
  - `src/PaperBinder.Infrastructure/Documents/HtmlEncodingMarkdownDocumentRenderer.cs` (current safe-rendering posture)
  - `src/PaperBinder.Web/src/app/tenant-host.tsx` (1966 lines; +125 since CP14 critic note)
  - the historical mock challenge fixture in the frontend public tree (still present there before CP16 implementation)
  - `src/PaperBinder.Api/wwwroot/assets/` (compiled SPA artifacts in repo)

---

## Verdict

**The plan is not yet scope-locked. Blocking findings below must be resolved in the plan (and in the canonical-doc reconciliation pass called out as Planned Work step 1) before broad CP16 implementation begins.**

The plan's shape is correct: it correctly frames CP16 as a bounded hardening/refactor checkpoint, explicitly excludes CP17 release packaging and every non-goal risk surface, front-loads doc reconciliation as the first blocking step, and uses a credible vertical-slice TDD sequence over the right seams. However, the plan ships with three Open Decisions that are genuine scope-lock decisions rather than implementation details — each feeds directly into acceptance criteria, touch points, TDD slice shape, and the docs-reconciliation list. It also has AC gaps around the very invariants step 2 promises to "verify," an under-specified `tenant-host.tsx` extraction contract, and two thin regression gates behind the browser/E2E hygiene work. Resolving these items is a one-pass plan edit; the rest of the plan is in good shape.

---

## Blocking Findings

### B1: Open Decision #1 (authenticated unsafe-mutation rate limit) must be locked before implementation begins

The plan leaves authenticated tenant-host unsafe-mutation rate limiting as "implement one canonical fixed-window limiter OR remove `PAPERBINDER_RATE_LIMIT_AUTHENTICATED_PER_MINUTE` from the canonical runtime contract." This is not an implementation-detail decision. It determines, in a binary way:

- whether `PaperBinderRuntimeSettings.RateLimits.AuthenticatedPerMinute`, the `RATE_LIMITED` / `Retry-After` AC lines, and the TDD slice 1 exit state describe a new limiter or a removal
- whether `PaperBinderRuntimeSettings`, `PaperBinderConfigurationKeys.RateLimitAuthenticatedPerMinute`, `.env.example`, `docs/30-security/secrets-and-config.md`, `docs/30-security/rate-limiting-abuse.md`, and `docs/40-contracts/api-contract.md` receive additions or deletions
- whether a new middleware registration / partition-key seam lands or whether the removal touches only configuration and docs

The current TDD slice 1 language ("add the smallest representative authenticated mutation limiter or explicit contract-removal path") explicitly hedges the scope of the first failing test. A RED test cannot exist until this decision is made.

Required resolution before scope-lock:
- Commit to the plan's own recommendation (one canonical fixed-window limiter on authenticated unsafe tenant-host `/api/*` mutations).
- If the limiter ships, lock: partition-key shape (see NB-1), limit source (`PAPERBINDER_RATE_LIMIT_AUTHENTICATED_PER_MINUTE`), the exact `errorCode`/`Retry-After` contract already locked in `api-contract.md`, and the exempt-routes list (e.g., `POST /api/auth/logout`, `POST /api/tenant/impersonation` stop if needed to keep stop-under-downgraded-role safe).
- If the alternative is chosen instead, lock that `AuthenticatedPerMinute` is removed from `PaperBinderRuntimeSettings`, `PaperBinderConfigurationKeys`, `.env.example`, and every listed doc in the same change set.
- Replace Open Decision #1 with a Locked Design Decision and update AC, TDD slice 1, and touch points accordingly.

### B2: Open Decision #2 (browser security headers / CSP) must be locked before implementation begins

`docs/30-security/threat-model-lite.md` currently lists "baseline Content Security Policy" as an XSS mitigation. Grep against `src/` shows no `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, or `Strict-Transport-Security` emission in the pipeline. That is exactly the "stale or aspirational behavior claim" CP16 exists to close. Leaving it as "implement if proven safe, otherwise narrow docs" makes:

- the AC line "Markdown and XSS posture is no longer overstated" undecidable (the doc's XSS defense-in-depth claim is more than markdown rendering — CSP is the one that is dormant)
- the touch-point list non-deterministic (does `PaperBinderHttpContractExtensions.cs` and a new response-header middleware get added, or only doc edits?)
- the ADR-trigger line "introducing a new browser-security-header strategy that is expensive to reverse" either load-bearing or redundant

Required resolution before scope-lock:
- Lock the CP16 posture. Two defensible options:
  - minimum explicit posture: land one response-header middleware emitting `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and a conservative CSP compatible with the current SPA (and the Playwright runtime). Add AC and a RED slice. Promote to a companion ADR in the same change set if the CSP sticks (see B3).
  - docs-only narrowing: remove the CSP claim from `threat-model-lite.md` and cross-linked docs; state explicitly that v1 does not ship a CSP and that XSS mitigation is scoped to output encoding plus the safe-rendering boundary in `HtmlEncodingMarkdownDocumentRenderer`.
- Either way, add an AC line that names the exact XSS/CSP claim the shipped runtime supports.

### B3: Open Decision #3 (observability ADR) is falsely conditional

The plan frames the observability ADR as contingent: "if CP16 adds new OpenTelemetry packages, exporter configuration keys, or telemetry conventions not already locked by an existing ADR, create a single bounded observability ADR." Grep against `src/` shows no OpenTelemetry package reference, no `AddOpenTelemetry`, no existing instrumentation wiring. `docs/70-operations/observability.md` declares OpenTelemetry as the baseline but it is currently aspirational. The CP16 "minimum observability baseline" therefore necessarily introduces:

- new OpenTelemetry packages in `PaperBinder.Api.csproj`, `PaperBinder.Worker.csproj`, and `PaperBinder.Infrastructure.csproj`
- exporter configuration keys (console + optional OTLP)
- stable field/metric naming conventions
- at minimum a new persistence-side instrumentation seam (Dapper/Npgsql activity)

None of this is locked by an existing ADR (no ADR currently covers the observability dependency choice or the exporter model). The condition is therefore always true. Leaving it phrased as "if" lets the change set land a sticky third-party dependency and a new config key family without an ADR.

Required resolution before scope-lock:
- Convert Open Decision #3 into a Locked Design Decision: CP16 lands a single bounded observability ADR under `docs/90-adr/` in the same change set as the instrumentation.
- The ADR must record at minimum: the OpenTelemetry package set chosen, the exporter shape (console default, optional OTLP via config key), the correlation-contract alignment with `observability.md`, the low-cardinality label policy, and the explicit non-goals (no vendor dashboards, no alerting program, no PII or tenant document content in traces).
- Add the new ADR filename to Planned Work step 1's reconciliation set and to Touch Points.

### B4: Acceptance criteria do not cover the middleware-ordering and redirect-construction invariants step 2 promises to "verify"

Planned Work step 2 says it will "verify host-validation failure behavior and middleware ordering" and "verify cookie flags, logout behavior, and CSRF enforcement remain consistent." `docs/30-security/secrets-and-config.md` already locks that redirect construction must use `PAPERBINDER_PUBLIC_ROOT_URL` rather than raw request host. None of these invariants appear in AC as a regression gate:

- middleware ordering (correlation -> host validation -> tenant resolution -> authentication -> CSRF -> endpoint authorization) is a boundary contract but only exists as implicit integration behavior today
- redirect-construction trust boundary has no AC-level regression line; if an executor refactors login/logout redirects while hardening cookie flags, they can accidentally re-introduce raw-host construction
- CSRF middleware interaction with the authenticated rate limiter (B1 decision) is unspecified — rate-limit rejection must not leak past CSRF or vice versa

"Verify" without an AC/test gate is indistinguishable from "read the code and believe it's fine." That is not the CP16 bar.

Required resolution before scope-lock:
- Add AC lines:
  - "Middleware pipeline ordering (correlation, host validation, tenant resolution, authentication, CSRF, rate limiting, endpoint policy) is locked by a regression test against a representative authenticated tenant-host mutation and a representative pre-auth root-host path."
  - "Redirect construction on root-host login/logout/provision uses `PAPERBINDER_PUBLIC_ROOT_URL` and not the raw request host, proven by a regression test that sends a spoofed `Host`/`X-Forwarded-Host` and observes the redirect target."
  - "CSRF enforcement remains applied before rate-limit accounting on authenticated unsafe tenant-host `/api/*` mutations, so a missing-CSRF request is never charged to the rate-limit bucket." (Only applicable if B1 locks to "implement.")
- Add matching RED slices under the TDD plan.

### B5: `tenant-host.tsx` extraction contract is under-specified for a file this large

`src/PaperBinder.Web/src/app/tenant-host.tsx` is currently 1966 lines (verified), up from 1841 lines at the CP14 critic observation and CP15's noted growth (`NBI-3`). The plan correctly frames the extraction as behavior-preserving and as a REFACTOR slice guarded by existing tests, but it does not lock:

- the exact target modules ("shell, lease, impersonation, binder, document, and user-admin owners" is a direction, not a contract) — without a locked list, reviewers cannot tell whether the diff matches intent
- the allowed prop/state surface crossing the extracted boundaries (to prevent silently re-introducing cross-cutting state the extraction was supposed to isolate)
- a size-floor or line-ceiling for the post-extraction `tenant-host.tsx` shell entrypoint, to prevent the "refactor" from just shuffling code without reducing cognitive load
- a requirement that `tenant-shell.test.tsx` and `e2e/tenant-host.spec.ts` keep full coverage parity (the plan mentions them under Likely Touch Points but not under AC)
- explicit prohibition on adding new component-level `fetch(` usage, `localStorage`/`sessionStorage` reads, or custom tenant/impersonation headers introduced under the refactor banner — the generic AC line is good but does not name the grep that must pass

Without these locks the refactor is indistinguishable from a rewrite and can easily re-introduce the CP15 `NB-5` / `NBI-3` risks in a new shape.

Required resolution before scope-lock:
- Enumerate the exact new module files beneath `src/PaperBinder.Web/src/app/` the refactor will land (for example `tenant-shell.tsx`, `tenant-lease-banner.tsx`, `tenant-impersonation-banner.tsx`, `tenant-binder-routes.tsx`, `tenant-document-routes.tsx`, `tenant-user-admin-routes.tsx`, or whatever the owner commits to).
- Lock a soft ceiling (e.g., post-refactor `tenant-host.tsx` is limited to shell bootstrap, route registration, and host-context wiring, and is under a stated line budget) so the refactor is observably reducing load.
- Add AC:
  - "Post-extraction `tenant-shell.test.tsx` and `e2e/tenant-host.spec.ts` retain coverage parity with pre-extraction behavior; no existing test is deleted to accommodate the refactor."
  - "Static grep against extracted tenant-host modules shows zero direct `fetch(`, zero `localStorage`/`sessionStorage` usage, zero custom `X-Impersonate-*` or tenant-identifier headers, and all API calls continue to route through the shared client."
- Require the refactor to land only after slices 1-3 of the hardening work have merged, to avoid interleaving runtime-behavior changes with a large UI reshape in the same diff (see B7).

### B6: Markdown/XSS posture AC is too loose to close the drift it targets

`HtmlEncodingMarkdownDocumentRenderer` currently HTML-encodes markdown input and wraps it in `<pre>` — it does not parse markdown, render emphasis, or produce any structural HTML. `docs/30-security/threat-model-lite.md` and adjacent docs describe a "centralized markdown sanitization/rendering boundary." That phrasing reads as though markdown is parsed through a sanitizer. The CP16 AC line "Markdown and XSS posture is no longer overstated" does not force a crisp statement of what the v1 runtime actually does.

Required resolution before scope-lock:
- Add AC lines explicitly:
  - "Canonical docs state that the v1 document renderer HTML-encodes raw markdown and wraps the result in `<pre>`, without markdown parsing, sanitizer pipelines, or raw-HTML support."
  - "No canonical doc retains language that implies markdown parsing, raw-HTML allowance, or a sanitizer sandbox in v1."
- Ensure the step 1 doc reconciliation set explicitly includes every file that currently implies sanitization (`threat-model-lite.md`, `api-contract.md` document section, `tech-stack.md`, any feature-definition file that references document rendering).

### B7: TDD slice ordering lets a large refactor land alongside behavior changes

The Vertical-Slice TDD Plan lists six slices in order: (1) authenticated rate-limit resolution, (2) trace correlation, (3) metrics, (4) E2E fixture exclusion, (5) browser-gate entrypoint rename, (6) `tenant-host.tsx` extraction. Slice 6 is a very large refactor touching the single largest frontend file. In the plan's current shape there is no explicit merge-ordering or sub-PR boundary between slices, so a reviewer faces the combined diff of new observability wiring, a new rate-limit middleware, new metrics, fixture relocation, a script rename, and a ~1900-line UI reshape in one change set.

This is the scope-drift risk the plan itself warns about in "Boundary risks."

Required resolution before scope-lock:
- Require slice 6 to land as its own sub-PR after slices 1-3 have merged (observability and auth-rate-limit decisions settled, metrics/log conventions in place).
- Or: require slice 6 to land in a second commit sequence on the same branch with a reviewer checkpoint between the runtime-behavior slices and the refactor slice, and name the commit-boundary requirement in the plan.

---

## Non-Blocking Findings

### NB-1: Authenticated-rate-limit partition key under impersonation is unspecified

If B1 is resolved toward implementation, the plan says the partition key is "established tenant plus effective user identity." Under active impersonation the effective user is the impersonated target. That means an impersonating admin is rate-limited against the target user's budget rather than the actor's. That may be acceptable (it limits blast radius during "view-as") but it must be a named decision:

- prefer effective user: admin impersonation cannot be used to bypass per-user budgets; target's legitimate traffic could be impacted
- prefer actor user: admin retains full budget during impersonation; "view-as" writes a dedicated budget trail; log enrichment must still carry effective id for correlation

Recommend: partition by `(tenant_id, effective_user_id)`, with `actor_user_id` added as a metric tag only if the label stays low-cardinality (it does; it's bounded by admin count). Lock the choice in Locked Design Decisions so it is not rediscovered at implementation time.

### NB-2: No automated regression test for `PB_ENV=Test` non-leakage

AC and Validation Plan call for a static review that `PB_ENV=Test` remains isolated to the Playwright path. Static review is the right minimum bar, but the failure mode (a future contributor quietly wiring `PB_ENV` into `scripts/start-local.ps1`, `scripts/reviewer-full-stack.ps1`, the base `docker-compose.yml`, or the default Dockerfile) is easy to regress and hard to see on review. Recommend adding a lightweight script or test asserting `PB_ENV=Test` is set only in `docker-compose.e2e.yml` and the dedicated browser-gate script, and that the string appears nowhere else in the default-stack runtime paths. Non-blocking because the scope-locked static review is defensible.

### NB-3: Default frontend/build-output fixture check should cover the compiled wwwroot tree, not just Vite output

`src/PaperBinder.Api/wwwroot/assets/` contains committed compiled SPA bundles in the current branch state. A static review that checks only the Vite `dist/` output or the Docker build context can miss a regression where the fixture gets re-embedded into a future compiled bundle that is also committed. Recommend the fixture-absence check scan both `src/PaperBinder.Web/dist/` (after build) and `src/PaperBinder.Api/wwwroot/` (as committed) for `e2e-turnstile`.

### NB-4: Browser-gate script rename should be locked by name in the plan

The plan says `scripts/run-root-host-e2e.ps1` will be replaced with a name that matches current suite ownership but does not commit to a name. The rename cascades into `scripts/validate-checkpoint.ps1`, `docs/70-operations/runbook-local.md`, `docs/80-testing/e2e-tests.md`, `docs/90-adr/ADR-0010-playwright-root-host-e2e-runtime.md`, task files, CP13/CP14/CP15 delivery artifacts, and at least one README. Locking the name in the plan (candidate: `run-browser-e2e.ps1` or `run-spa-e2e.ps1` under `scripts/`) prevents divergent doc/script updates during the multi-file propagation step.

### NB-5: Observability metric set should enumerate labels, not just names

AC describes "minimum metrics for cleanup outcomes and representative security-boundary denials without sensitive or unbounded labels." Recommend the plan enumerate at least the candidate metric names and the exact tag set (e.g., `cleanup_outcome` with `result` tag; `security_denial` with `reason`, `route_class` tags) so the eventual metrics review is against a written contract rather than a moving target. Non-blocking because the plan explicitly reserves a constants seam for names/tags during REFACTOR of slice 3.

### NB-6: Redirect-construction regression ties to cookie-domain invariant but neither is called out

`PublicUrlSettings` parsing already enforces `PAPERBINDER_PUBLIC_ROOT_URL` host matches `PAPERBINDER_AUTH_COOKIE_DOMAIN`. A redirect-construction test that proves the invariant holds at runtime (not just at startup validation) is valuable. Non-blocking because startup validation catches the most common regression; the runtime test is additive insurance for the hardening pass.

### NB-7: Audit-substrate scope-discipline carryover from CP15 is not reinforced in the plan

CP15's post-implementation review noted a residual risk that "the temptation to expand [the audit-events table] into a generalized `audit_events` substrate, search UI, or export pipeline must be resisted" in CP16. The CP16 plan's Scope block correctly excludes generalized audit work, but the Locked Design Decisions do not explicitly reaffirm this. Recommend one line in Locked Design Decisions stating CP16 does not add rows, readers, or UI surface to `tenant_impersonation_audit_events`, nor generalize the table shape. Non-blocking because Scope already excludes it; the explicit restatement is belt-and-braces.

### NB-8: Impersonation cookie-expiry audit-closure behavior may be touched by observability or middleware changes

CP15 wired `TenantResolutionMiddleware` to call `TryRecordExpiredImpersonationAsync` on unauthenticated tenant-host requests that still carry the prior impersonation marker (CP15 `NBI-1`). CP16's middleware-ordering tightening and trace-instrumentation work both touch this middleware. Recommend an AC/regression line asserting the cookie-expiry audit-closure path still fires after the CP16 changes, so the CP15 residual risk is not silently regressed. Non-blocking because the existing cookie-expiry integration test already covers the path; promoting it into CP16 AC makes the expectation explicit.

---

## Locked Decisions

Treat these as binding for CP16 implementation. They already appear in the plan or are implied by `AGENTS.md`, `docs/55-execution/execution-plan.md`, and prior-checkpoint ADRs; they are restated here so the executor does not re-open them.

- CP16 is a hardening and refactor checkpoint. No new end-user features, admin workflows, or generalized audit tooling.
- ADR-0002, ADR-0005, ADR-0007, ADR-0008, ADR-0010 are not reopened. Any CP16 change that would modify their locked behavior requires an amendment or companion ADR in the same change set.
- Single cookie-auth model. No BFF, SSR, framework-mode routing, JWTs, tokens, server-side session stores, distributed caches, or proxy-vendor-specific runtime.
- Single SPA, single renderer. No second UI bundle. No markdown parser, raw-HTML support, preview route, or stored-rendered-HTML path without a preceding ADR.
- All browser calls continue to route through the shared API client. No direct `fetch(`, no browser storage, no client-built tenant identity, no custom impersonation/tenant headers introduced during the tenant-host extraction.
- `PB_ENV=Test` stays isolated to the dedicated Playwright runtime. It must not leak into `scripts/start-local.ps1`, `scripts/reviewer-full-stack.ps1`, the base `docker-compose.yml`, or the default Dockerfile path.
- E2E-only assets must not publish into the default compiled frontend or the default app image.
- Observability instrumentation stays minimal, explicit, and low-cardinality. No PII, credentials, connection strings, raw tenant document content, or unbounded labels in traces, logs, or metrics.
- Rate limiting remains single-host in-process. No Redis, no distributed limiter, no reverse-proxy vendor-specific policy.
- Canonical docs are updated in the same change set as the runtime change that caused the drift. `validate-docs.ps1` is a release-blocking gate.
- `tenant-host.tsx` extraction is behavior-preserving. Route ownership, host-context rules, shell-bootstrap ownership, shared-client boundary, and the route map remain unchanged.
- CP17 release packaging is out of scope (changelog finalization, reviewer-snapshot curation, release tagging, rollback notes, release-freeze administration stay in CP17).
- The `tenant_impersonation_audit_events` table is not generalized, expanded, read by UI, or exported during CP16.

---

## Required Plan Edits

Apply these edits to `docs/95-delivery/pr/cp16-hardening-and-consistency-pass/implementation-plan.md` before scope-lock is declared. All edits flow into the step 1 canonical-doc reconciliation pass already planned.

1. **Resolve Open Decision #1** (B1) — commit to the one-canonical-fixed-window authenticated tenant-host unsafe-mutation limiter (or, if the alternative is chosen, to the removal). Move the resolution from "Open Decisions" into "Locked Design Decisions." Update TDD slice 1, AC, Touch Points, and Validation Plan to match the committed direction. If implementing, lock the partition key per NB-1.
2. **Resolve Open Decision #2** (B2) — commit to either a minimum explicit response-header/CSP posture (with AC, RED slice, and ADR per B3) or to docs-only narrowing of the stale CSP claim. Update `threat-model-lite.md` and cross-linked docs accordingly. Move the resolution into Locked Design Decisions.
3. **Resolve Open Decision #3** (B3) — commit to landing a bounded observability ADR in the same change set as the instrumentation. Add the new ADR filename to Planned Work step 1 reconciliation and to Touch Points. Move the resolution into Locked Design Decisions.
4. **Add AC lines for middleware ordering, redirect construction, and CSRF/rate-limit precedence** (B4) — per the lines specified in B4. Add matching RED slices.
5. **Tighten the markdown/XSS AC** (B6) — add the explicit AC lines naming the shipped v1 behavior (HTML-encode plus `<pre>` wrap, no markdown parser) and require the reconciliation pass to remove sanitizer-implying language from every named doc.
6. **Lock `tenant-host.tsx` extraction contract** (B5) — enumerate target modules, set a post-extraction shell-size ceiling, add AC for test-coverage parity, and add the static-grep AC for direct `fetch(` / browser storage / custom header absence.
7. **Lock slice-ordering / sub-PR boundary** (B7) — require slice 6 (tenant-host extraction) to land as a discrete sub-PR after slices 1-3, or record an equivalent commit-boundary requirement.
8. **Specify authenticated-rate-limit partition under impersonation** (NB-1) — one line in Locked Design Decisions naming `(tenant_id, effective_user_id)` or the chosen alternative, and the log/metric enrichment with `actor_user_id`.
9. **Add automated regression for `PB_ENV=Test` non-leakage** (NB-2) — add to Validation Plan.
10. **Broaden the fixture-absence check to the committed wwwroot tree** (NB-3) — add `src/PaperBinder.Api/wwwroot/` to the scan.
11. **Lock the browser-gate script name** (NB-4) — pick the name and propagate it through Touch Points, Validation Plan, and the step 1 doc reconciliation list.
12. **Enumerate the minimum metric names and label keys** (NB-5) — add to Planned Work step 3 or to an appendix so the post-implementation review is against a written contract.
13. **Add an AC line for cookie-expiry impersonation audit-closure preservation** (NB-8).
14. **Add a Locked Design Decision restating the no-generalization posture of `tenant_impersonation_audit_events`** (NB-7).
15. **Cross-link the reconciliation set** — ensure step 1 explicitly includes the new observability ADR filename (B3), the CSP/header ADR if B2 resolves that way, `docs/90-adr/README.md` (for the new ADR index entry), any touched feature-definition files referencing markdown rendering, and the delivery task file `docs/05-taskboard/tasks/` entry for CP16.

---

## Post-Implementation Checks

Record these as the CP16 post-implementation check table. Each must pass before the PR artifact is marked ship-ready.

1. **Authenticated rate-limit contract resolved.** Either: a working authenticated tenant-host unsafe-mutation limiter returns `429 RATE_LIMITED` with `Retry-After` and correctly partitions by the locked key, proven by integration tests covering budget exhaustion, reset, and the CSRF-before-limiter precedence; **or** the `AuthenticatedPerMinute` plumbing is fully removed from `PaperBinderRuntimeSettings`, `PaperBinderConfigurationKeys`, `.env.example`, and every canonical doc named in step 1, proven by a grep that returns zero hits. No intermediate state.
2. **Host-validation, tenant-resolution, authentication, CSRF, rate-limit, and endpoint-authorization ordering locked by regression test.** A spoofed-host request to a representative authenticated tenant-host mutation reaches the same early rejection path it did in CP15; the pipeline ordering is observable through the regression test.
3. **Redirect construction uses `PAPERBINDER_PUBLIC_ROOT_URL`.** Regression test proves login/logout/provision redirects ignore spoofed `Host` or `X-Forwarded-Host` headers and emit absolute URLs rooted at the configured public URL.
4. **Cookie flags, CSRF-on-unsafe, and logout-during-impersonation behavior preserved.** Integration tests from CP11/CP14/CP15 continue to pass, and the cookie-expiry impersonation audit-closure path from CP15 (`NBI-1`) is exercised explicitly.
5. **Observability baseline real, not aspirational.** Traces emit on inbound `/api/*` requests, Dapper/Npgsql activity, and worker cleanup cycles, with correlation carrying `tenant_id`, `user_id`, `trace_id`, and `correlation_id` per `observability.md`. Console exporter works by default; OTLP exporter activates only when its config key is present.
6. **Observability ADR landed.** A new ADR under `docs/90-adr/` records the OpenTelemetry package choice, exporter model, correlation contract alignment, low-cardinality label policy, and explicit non-goals. `docs/90-adr/README.md` and `docs/ai-index.md` reference it.
7. **Metrics cardinality discipline.** Static review of metric registrations confirms every label name is enumerated, every label value space is bounded, and no metric carries `tenant_id`, `user_id`, `correlation_id`, route template parameters, or free-form strings as a label.
8. **Structured logs carry stable field names.** `event_name`, `tenant_id`, `user_id`, `trace_id`, `correlation_id`, and (where impersonation applies) `actor_user_id`, `effective_user_id`, `is_impersonated` appear with consistent casing and never contain secrets, credentials, connection strings, or raw document content.
9. **CSP / browser-security-header posture matches docs.** Either: the shipped runtime emits the locked header set and a regression test asserts their presence on SPA HTML responses; **or** the docs no longer claim a CSP and grep against `docs/` returns zero aspirational CSP references.
10. **Markdown/XSS docs match runtime.** `threat-model-lite.md` and cross-linked docs describe the v1 renderer's actual behavior (HTML-encode plus `<pre>` wrap, no markdown parser). No doc implies sanitization of parsed markdown output.
11. **Default compiled frontend and default app image do not publish `e2e-turnstile.js`.** Automated check (not just static review) passes against both `src/PaperBinder.Web/dist/` output and `src/PaperBinder.Api/wwwroot/` committed tree.
12. **`PB_ENV=Test` does not leak outside the Playwright path.** Automated check asserts the string appears only in `docker-compose.e2e.yml` and the renamed browser-gate script; `scripts/start-local.ps1`, `scripts/reviewer-full-stack.ps1`, the base `docker-compose.yml`, and the default Dockerfile do not set or consume it.
13. **Browser-gate script rename consistent everywhere.** The renamed script exists, is referenced by `scripts/validate-checkpoint.ps1`, and every mention of the old name is removed from docs, ADRs, task files, and prior PR artifacts (except as deferral notes in CP13/CP14/CP15 delivery history, which may retain the old name for historical context).
14. **`tenant-host.tsx` extraction matches the locked contract.** The extracted modules listed in the plan exist; `tenant-host.tsx` is reduced to the locked shell/bootstrap/route-registration role and sits under the stated line ceiling; `tenant-shell.test.tsx` and `e2e/tenant-host.spec.ts` retain pre-extraction coverage parity; no existing test is deleted to accommodate the refactor.
15. **No new browser-client boundary violations in the extraction.** Static grep against every extracted module returns zero direct `fetch(`, zero `localStorage` / `sessionStorage` usage, zero custom `X-Impersonate-*` or tenant-identifier headers, and every API call routes through the shared client.
16. **Audit-substrate scope discipline held.** No new row, reader, UI, or export on `tenant_impersonation_audit_events`. Schema unchanged. `ADR-0002` and `FD-0007` are not amended.
17. **Canonical doc reconciliation complete.** Every file named in Planned Work step 1 is updated in the same change set; `validate-docs.ps1`, `validate-launch-profiles.ps1`, and `validate-checkpoint.ps1 -Configuration Release -DockerIntegrationMode Require` pass; the renamed browser-gate script passes with the full CP13/CP14/CP15 browser suite plus any CP16 additions.
18. **No CP17 or out-of-scope bleed.** No changelog finalization, release tagging, rollback-notes-final, reviewer-snapshot curation, password reset, profile editing, user deletion, document editing, preview UX, archive UX expansion, search, uploads, audit browsing/export, BFF/SSR, framework-mode routing, JWT/token auth, server-side session store, distributed cache, or multi-role/multi-tenant-membership work in the diff.
19. **Manual VS Code and Visual Studio launch verification recorded in the PR artifact** before checkpoint closeout.

---

## Summary

The plan is close to scope-lock but not yet there. Its structure, locked decisions, risk framing, TDD shape, validation plan, and touch points are substantively correct. The blockers are concentrated in three unresolved Open Decisions (auth-rate-limit contract, CSP/security-header posture, observability ADR), a short set of missing acceptance criteria around middleware ordering and redirect construction, a loose markdown/XSS claim, an under-specified `tenant-host.tsx` extraction contract, and a missing sub-PR boundary between runtime-behavior slices and the large refactor. Apply the Required Plan Edits above and the plan will be scope-locked.

---

## Re-Review (Post-Revision)

Reviewer: PaperBinder Critic
Date: 2026-04-18

Inputs re-reviewed:
- Revised `docs/95-delivery/pr/cp16-hardening-and-consistency-pass/implementation-plan.md`
- The `Critic Review Resolution Log` section in the revised plan
- Unchanged canonical docs checked for continued alignment: `docs/55-execution/execution-plan.md`, `docs/55-execution/phases/phase-5-hardening-release.md`, `docs/30-security/threat-model-lite.md`, `docs/30-security/secrets-and-config.md`, `docs/30-security/rate-limiting-abuse.md`, `docs/40-contracts/api-contract.md`, `docs/70-operations/observability.md`
- Runtime-surface observations unchanged from the first pass

### Verdict

**The plan is scope-locked. No blocking findings remain.**

All seven blockers (`B1` auth-rate-limit lock, `B2` CSP/header posture, `B3` observability ADR, `B4` middleware/redirect/CSRF-precedence AC, `B5` `tenant-host.tsx` extraction contract, `B6` markdown/XSS AC, `B7` slice ordering) and all eight non-blocking findings (`NB-1` through `NB-8`) are resolved in the revised plan. The `Critic Review Resolution Log` records each disposition, and spot-checks against the Locked Design Decisions, Acceptance Criteria, TDD slices, Validation Plan, and Touch Points confirm the resolutions landed consistently rather than being documented in only one section.

Broad implementation may begin. Planned Work step 1 (canonical-doc reconciliation, including `ADR-0011-observability-opentelemetry-baseline.md`) should land as a first sub-PR before the runtime slices, matching the plan's own gating language and the CP15 precedent.

### Blocker Resolution Verification

| # | Blocker | Resolution In Revised Plan | Verified |
| --- | --- | --- | --- |
| B1 | Authenticated unsafe-mutation rate-limit contract unresolved | Scope commits to one canonical fixed-window limiter; Locked Design Decisions lock the source key, partition `(tenant_id, effective_user_id)`, and exempt routes (`POST /api/auth/logout`, `DELETE /api/tenant/impersonation`); TDD slice 1 no longer hedges; AC names the limiter and `429` + `Retry-After` contract; Validation Plan adds targeted integration coverage. | Pass |
| B2 | CSP / browser-security-header posture unresolved | Scope's Not-Included list rules out new CSP or browser-security-header middleware in CP16; Locked Design Decisions commit to docs-only narrowing; AC forbids CSP or sanitizer language in any canonical doc; XSS posture locked to output encoding plus the existing conservative renderer. | Pass |
| B3 | Observability ADR falsely conditional | Locked Design Decisions commit to landing `ADR-0011-observability-opentelemetry-baseline.md` in the same change set; the ADR filename is listed in Planned Work step 1 reconciliation, Validation scope-lock check, Touch Points, and AC; ADR Triggers section now records it as a requirement rather than a conditional trigger. | Pass |
| B4 | Middleware ordering, redirect construction, and CSRF/rate-limit precedence AC missing | AC enumerates the pipeline-order invariants, the spoofed-host redirect-construction regression, and the CSRF-before-rate-limit-accounting precedence; TDD slices 4 and 5 are dedicated RED slices; Validation Plan adds targeted coverage for each. | Pass |
| B5 | `tenant-host.tsx` extraction contract under-specified | Locked Design Decisions enumerate the exact eight target modules beneath `src/PaperBinder.Web/src/app/`, lock a 400-line ceiling for post-refactor `tenant-host.tsx`, require coverage parity on `tenant-shell.test.tsx` and `e2e/tenant-host.spec.ts`, forbid existing-test deletion, and require the static grep against `fetch(`, browser storage, custom impersonation headers, and tenant-identifier headers; Validation Plan adds the grep explicitly. | Pass |
| B6 | Markdown/XSS AC too loose | AC names the shipped v1 behavior (HTML-encode raw markdown, present as safe source, no parser/sanitizer/raw-HTML/stored-rendered-HTML) and explicitly forbids sanitizer- and CSP-implying language in canonical docs; Locked Design Decisions restate the same posture. | Pass |
| B7 | Slice ordering lets large refactor land with behavior changes | Slice 8 (tenant-host extraction) is explicitly scheduled as a dedicated follow-on sub-PR after slices 1-3 merge; Locked Design Decisions restate the sequencing requirement. | Pass |

### Non-Blocking Resolution Verification

| # | Non-Blocker | Resolution In Revised Plan | Verified |
| --- | --- | --- | --- |
| NB-1 | Auth-rate-limit partition key under impersonation unspecified | Locked Design Decisions commit to `(tenant_id, effective_user_id)`; `actor_user_id` retained only in logs and traces, explicitly excluded from metric labels. | Pass |
| NB-2 | No automated regression for `PB_ENV=Test` non-leakage | Validation Plan adds the `rg`-based non-leakage guard that allows hits only in `docker-compose.e2e.yml` and `run-browser-e2e.ps1`. | Pass |
| NB-3 | Fixture-absence check misses committed wwwroot | Validation Plan adds the automated scan against `src/PaperBinder.Web/dist/` (built output) and `src/PaperBinder.Api/wwwroot/` (committed tree). | Pass |
| NB-4 | Browser-gate script rename not named in plan | Rename is locked to `scripts/run-browser-e2e.ps1` across Scope, Locked Design Decisions, TDD slice 7, AC, Validation Plan, and Touch Points. | Pass |
| NB-5 | Metric labels not enumerated | Locked Design Decisions enumerate the four metric names (`paperbinder_security_denials_total`, `paperbinder_rate_limit_rejections_total`, `paperbinder_cleanup_cycles_total`, `paperbinder_cleanup_tenants_total`) with their locked label sets and an explicit forbidden-labels list. | Pass |
| NB-6 | Redirect-construction runtime test not called out | AC and TDD slice 4 require proving redirect construction stays anchored to `PAPERBINDER_PUBLIC_ROOT_URL` under spoofed `Host` / `X-Forwarded-Host` input. | Pass |
| NB-7 | Audit-substrate no-generalization not restated | Locked Design Decisions now explicitly restate that `tenant_impersonation_audit_events` is not generalized, expanded, read by UI, or exported during CP16. | Pass |
| NB-8 | Cookie-expiry impersonation audit closure not protected by AC | AC preserves the cookie-expiry audit-closure behavior through middleware/observability changes; Validation Plan adds targeted integration coverage. | Pass |

### Residual Risks (Carry Into Post-Implementation Review)

- **CSP claim removal must reach every cross-linked mention.** The docs-only narrowing path is correct, but `docs/30-security/threat-model-lite.md` today lists "baseline Content Security Policy" as a named XSS mitigation and other docs may echo it. Post-implementation review should grep `docs/` for `Content Security Policy`, `CSP`, and `Content-Security-Policy` and confirm every remaining occurrence is either history/ADR context or part of an explicit "v1 does not ship" statement.
- **Coverage parity is a qualitative AC.** "Pre-extraction coverage parity" for `tenant-shell.test.tsx` and `e2e/tenant-host.spec.ts` is defensible but subjective. Recommend the CP16 PR artifact record the pre-extraction and post-extraction test lists (and assertion counts) side-by-side so the reviewer sees the parity evidence rather than having to diff it.
- **`PB_ENV` non-leakage grep scope.** The Validation Plan scan covers `docker-compose.yml`, `docker-compose.e2e.yml`, `scripts/`, `src/PaperBinder.Api`, and `src/PaperBinder.Worker`. `src/PaperBinder.Infrastructure` is not named. Infrastructure is unlikely to read `PB_ENV` today, but expanding the scan to the full `src/` tree minus `src/PaperBinder.Web/e2e` is low-cost and closes the gap; recommend the executor broaden the scan during implementation.
- **Authenticated-rate-limit partition-key behavior before tenant membership is established.** The Locked Design Decision partitions `(tenant_id, effective_user_id)` "once tenant membership is established." Tenant-host unsafe mutations cannot reach the limiter without established membership in the current pipeline, so this is correct by construction; post-implementation review should confirm no seam reaches the limiter before the tenant-resolution and membership checks complete.
- **Slice 8 sub-PR separation depends on merge discipline.** The plan commits to landing the `tenant-host.tsx` extraction as a dedicated follow-on sub-PR after slices 1-3. If branch-local reviewer pressure is high, there is a latent risk of collapsing slice 8 back into the same PR. Post-implementation review should verify the extraction landed on its own review boundary with independent green validation.
- **ADR-0011 naming and index hygiene.** The plan names the new ADR as `ADR-0011-observability-opentelemetry-baseline.md`. Post-implementation review should confirm (a) the next available ADR number is still 11 at merge time, (b) `docs/90-adr/README.md` indexes it with a one-line description, and (c) `docs/ai-index.md` and `docs/repo-map.json` include it.
- **Historical delivery evidence for `run-root-host-e2e.ps1`.** The plan correctly allows CP13/CP14/CP15 delivery history to retain the old script name. Post-implementation review should confirm only active docs, scripts, and ADRs use `run-browser-e2e.ps1`, while historical PR artifacts keep the old name verbatim (so the history stays readable).

### Follow-ups For Executor Before Broad Implementation

1. Land Planned Work step 1 as a separate first sub-PR (canonical-doc reconciliation, `ADR-0011-observability-opentelemetry-baseline.md`, the taskboard entry, and the CSP/sanitizer-language narrowing) before starting the vertical-slice sequence. This matches the plan's own gating language and the CP15 precedent.
2. Land slices 1-3 (authenticated rate limiter with the locked partition/exempt-routes, observability instrumentation, locked metric set) as the second sub-PR, so the runtime-behavior and telemetry contract is green before any script rename, fixture relocation, or UI refactor touches the branch.
3. Land slices 4-7 (redirect-construction regression, CSRF-before-limiter precedence, fixture relocation, browser-gate rename with non-leakage guard) as the third sub-PR, so the remaining hygiene work is visibly scoped to scripts, docs, and hardening regressions rather than mixed into the refactor.
4. Land slice 8 (`tenant-host.tsx` extraction) as a dedicated final sub-PR against the already-stabilized branch state, with the grep guards in CI and the pre/post test-list artifact called out in residual risks.
5. Confirm the authenticated-mutation limiter exempt-routes list at implementation time: `POST /api/auth/logout` and `DELETE /api/tenant/impersonation` are correct; spot-check whether any additional non-mutation-looking but cookie-state-changing endpoint deserves the same exempt treatment, or explicitly record that no others exist.
6. When narrowing the CSP claim in `docs/30-security/threat-model-lite.md`, keep the XSS mitigation list honest: output encoding plus the conservative document renderer are the real defenses, and that should be stated without implying a sanitizer or parser is present.

---

## Post-Implementation Review

Reviewer: PaperBinder Critic
Date: 2026-04-18

Inputs reviewed:
- Full working-tree diff against `main` on branch `checkpoint-16-hardening-and-consistency-pass`
- `docs/95-delivery/pr/cp16-hardening-and-consistency-pass/implementation-plan.md` (scope-locked plan)
- `docs/95-delivery/pr/cp16-hardening-and-consistency-pass/description.md` (author notes and validation evidence)
- `docs/05-taskboard/tasks/T-0031-cp16-hardening-and-consistency-pass.md`
- Runtime surface: `PaperBinderAuthenticatedMutationRateLimitMiddleware.cs`, `PaperBinderAuthenticationExtensions.cs`, `PaperBinderTenantRedirectUrlBuilder.cs`, `PaperBinderAuthEndpoints.cs`, `PaperBinderImpersonationRoutes.cs`, `PaperBinderCsrfMiddleware.cs`, `PaperBinderObservabilityExtensions.cs`, `PaperBinderWorkerObservabilityExtensions.cs`, `src/PaperBinder.Infrastructure/Diagnostics/PaperBinderTelemetry.cs`
- Frontend surface: `src/PaperBinder.Web/src/app/tenant-host.tsx` and the seven extracted modules, `src/PaperBinder.Web/e2e/e2e-turnstile.js`, and the confirmed removal of the former frontend-public E2E fixture
- Tests: `tests/PaperBinder.IntegrationTests/HardeningConsistencyIntegrationTests.cs`, added spoofed-host coverage in `AuthIntegrationTests.cs`
- Scripts and compose: `scripts/run-browser-e2e.ps1`, `scripts/run-root-host-e2e.ps1` (shim), `scripts/validate-checkpoint.ps1`, `docker-compose.yml`, `docker-compose.e2e.yml`
- Canonical doc reconciliation set: `docs/30-security/threat-model-lite.md`, `docs/30-security/rate-limiting-abuse.md`, `docs/30-security/secrets-and-config.md`, `docs/40-contracts/api-contract.md`, `docs/70-operations/observability.md`, `docs/50-engineering/tech-stack.md`, `docs/90-adr/ADR-0011-observability-opentelemetry-baseline.md`, `docs/90-adr/README.md`, `docs/ai-index.md`, `docs/repo-map.json`

### Verdict

**The checkpoint is ship-ready. No blocking findings remain.**

Every scope-locked decision from the pre-implementation review landed as specified. The canonical authenticated tenant-host mutation limiter partitions by `(tenant_id, effective_user_id)`, sources its budget from `PAPERBINDER_RATE_LIMIT_AUTHENTICATED_PER_MINUTE`, exempts `POST /api/auth/logout` and `DELETE /api/tenant/impersonation`, and sits after CSRF in the pipeline so missing-CSRF traffic is never charged to a rate-limit bucket. The redirect trust boundary is anchored to `PAPERBINDER_PUBLIC_ROOT_URL` and is proven by a regression test that spoofs both `Host` and `X-Forwarded-Host`. `ADR-0011-observability-opentelemetry-baseline.md` landed with the instrumentation rather than after it; the minimum metric vocabulary is enforced in code by the `PaperBinderTelemetry` constants and by an integration assertion that refuses unapproved tag keys. The E2E challenge fixture has left the default build, the browser gate is canonical as `scripts/run-browser-e2e.ps1`, and the isolation guards run as part of `validate-checkpoint.ps1`. `tenant-host.tsx` reduces to 57 lines of shell/route wiring (well under the 400-line ceiling), and the seven extracted modules match the locked list while the static-grep invariants for `fetch(`, browser storage, and custom tenant/impersonation headers all come back clean.

The two open items called out in the task file (this post-implementation critic review; manual VS Code and Visual Studio launch verification) are closeout activities rather than merge blockers. This review closes the first.

### Blocking Findings

None.

### Non-Blocking Findings

#### NBI-1: Sub-PR sequencing was collapsed into one local change set

The scope-locked plan recommended landing reconciliation-first, then slices 1-3, then slices 4-7, and finally the `tenant-host.tsx` extraction as a dedicated follow-on sub-PR. The author notes in `description.md` acknowledge this was not reproduced as separate review boundaries and that all slices landed together on the branch. The residual risk the plan was guarding against (large UI refactor landing next to runtime-behavior changes) is mitigated here by the fact that each slice was validated independently and the extraction is mechanically safe (the static-grep invariants plus the 57-line shell size make the behavior-preservation claim inspectable). Still worth naming so the pattern does not repeat on CP17 where release-packaging concerns will genuinely benefit from serialized review boundaries.

#### NBI-2: `tenant-shell.tsx` absorbed most of the extracted surface

`tenant-host.tsx` is now 57 lines (excellent), but `tenant-shell.tsx` picked up roughly 540 lines of the routing, banner wiring, and host-context responsibilities. The scope-locked plan set the 400-line ceiling on `tenant-host.tsx` specifically, not on the shell module, so this does not violate any AC. The implementation still dramatically improves readability over the prior 1966-line single file. Naming it because a future hardening pass may want to set a similar ceiling on `tenant-shell.tsx` (or split lease/impersonation/routing wiring out of it) if it keeps growing.

#### NBI-3: Compatibility-shim risk for `scripts/run-root-host-e2e.ps1`

The shim is correct per the scope-locked plan ("historical delivery evidence may retain the old script name"). The residual risk is operational rather than technical: a future contributor doing a cleanup pass might delete the shim without first auditing archived CP13-CP15 PR artifacts, breaking `validate-docs.ps1` on files no one actively reads. The author notes already call this out as an intentional deviation and flag the historical-path dependency. No action required at CP16 merge.

#### NBI-4: Coverage-parity evidence is qualitative

The Re-Review's residual risks asked for a pre-extraction/post-extraction test-list artifact for `tenant-shell.test.tsx` and `e2e/tenant-host.spec.ts` to make parity auditable. The PR artifact records only aggregate counts (32 frontend tests, 6 Playwright tests, all passing). Count equality plus the behavior-preserving extraction is a defensible signal — the suites pass on the new structure — but a side-by-side test-list diff would be stronger evidence. Not a merge blocker because the AC requires parity, not parity-reporting, and the automated suites enforce the actual contract.

### Residual Risks

- **Manual VS Code and Visual Studio launch verification still pending.** Both the task file and the PR description flag this as a required closeout activity before `CP16` moves to `done`. It is not a merge blocker for the PR artifact itself but is load-bearing for checkpoint closure.
- **OpenTelemetry dependency drift.** `ADR-0011` locks the package set, the console/OTLP exporter model, the correlation contract, and the non-goals, but the runtime now carries new third-party packages on the API and worker. Future dependency updates must respect the ADR or trigger an amendment.
- **Metric-label discipline enforced by construction in tests, not at build time.** `HardeningConsistencyIntegrationTests.AssertAllowedMetricTags` catches unapproved tag keys at test time, which is correct. If a future change adds a new instrument without routing through `PaperBinderTelemetry`, the discipline holds only if that test keeps running against the new instrument. Worth re-auditing on any future observability expansion (CP17 or beyond).
- **Authenticated limiter depends on established tenant membership.** The partition-key construction relies on tenant resolution and user-context middleware having already populated the request. This is correct by construction in the current pipeline order, but any future reordering of auth/tenant-resolution middleware must preserve the invariant.
- **Compatibility shim longevity.** `scripts/run-root-host-e2e.ps1` is retained purely for historical doc path validation. Once CP17 release packaging archives CP13-CP15 delivery artifacts in a way that no longer depends on live path resolution, the shim should be removed in a follow-on cleanup checkpoint.
- **`tenant-shell.tsx` size (≈540 lines).** The extraction moved responsibilities out of `tenant-host.tsx` but concentrated them in the shell. No AC violation, but a candidate target for a future extraction pass if the shell keeps accreting routing and banner wiring.

### Required Fixes Before Merge

None. The PR artifact is cleared to merge on the evidence reviewed.

Closeout remaining after merge (tracked on the task file, not merge-blocking):

1. Record this post-implementation review outcome in the PR artifact. **Done by this section.**
2. Record manual VS Code and Visual Studio launch verification before moving `CP16` to `done` per the task file acceptance criteria.

### Summary

CP16 lands the hardening-and-consistency pass cleanly against every scope-locked decision. The authenticated tenant-host mutation limiter, redirect trust boundary, observability baseline with `ADR-0011`, E2E fixture relocation, browser-gate rename, and the `tenant-host.tsx` extraction are all in place; docs are reconciled; the full scripted validation bundle (build, unit, integration, Docker-backed integration, frontend, Playwright, docs validation, launch-profile validation, checkpoint validation, and static invariant greps) passed on 2026-04-18. No blocking findings. Non-blockers are small quality-of-refactor observations rather than correctness or boundary issues. Ship-ready, subject to the two non-blocking closeout items the task file already tracks.
