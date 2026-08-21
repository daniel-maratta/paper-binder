# Changelog

All notable changes to this project are documented in this file.

## Unreleased

### Added
- Added a plain-language homepage explanation of PaperBinder as a lightweight workspace for important internal documents, with concrete policy, procedure, handbook, and internal-reference use cases.
- Added a direct homepage path to the flagship engineering article.

### Changed
- Clarified first-entry workspace dashboard orientation so new guests understand the temporary workspace, binders, read-only documents, and the first useful action.
- Revised public and first-demo copy to prefer workspace, access-control, and read-only-record language over internal tenant and systems terminology.
- Linked the public footer author attribution to Daniel Maratta's portfolio site using the existing external-link conventions.

### Fixed
- Added a runtime allow-list guard so unapproved synthetic GoatCounter event names are dropped before a direct `/count` request can be sent.

### Docs
- Staged `1.1.2` candidate version metadata and release evidence without describing `v1.1.2` as the published stable release.

## [1.1.1] - 2026-08-17

### V1.1.1 Release Notes

These notes describe the `v1.1.1` patch release, superseding `v1.1.0` as the current PaperBinder release.

### Added
- Added public Legal, Privacy Policy, Terms of Use, and Cookie Notice pages, rendered from a dedicated frontmatter-backed legal content collection through a shared legal document template, with links exposed from both the public and tenant footers.
- Added point-of-collection warnings telling users not to submit sensitive, regulated, confidential, proprietary, personal, medical, financial, credential, or important real business information.
- Added production-gated GoatCounter usage analytics (`ADR-0016`): PaperBinder-owned direct `/count` requests with sanitized route-template pageviews and a small set of approved public conversion events, disabled outside the production public host and never loading GoatCounter provider JavaScript.
- Added `SECURITY.md`, documenting vulnerability reporting and dependency/security maintenance policy.
- Added generated `THIRD-PARTY-NOTICES.md` and expanded `NOTICE.md` distinguishing PaperBinder's MIT licensing, third-party dependency notices, and owner-created asset provenance.

### Changed
- Generalized release documentation validation so future release-checklist structure checks are not pinned to the historical CP17 artifact path.
- Quieted optional Docker Compose lease-extension variable warnings by adding explicit defaults that match the existing local environment contract.
- Reduced small API ceremony by centralizing tenant membership context resolution and consolidating repeated text trimming.
- Split binder and document application contract types by responsibility so command, outcome, failure, and model types are easier to navigate without changing public behavior.
- Updated frontend lockfile dependencies with same-major `npm audit fix`/`fix` remediation for `nanoid`, `react-router`, and `react-router-dom`, taking `npm audit --audit-level=moderate` to zero vulnerabilities.
- Overrode the transitive `SSH.NET` test dependency to `2026.0.0` in `tests/PaperBinder.IntegrationTests`, clearing the `NU1902` vulnerability warning.
- Bounded repo-owned Docker Compose container log retention (`local` logging driver, `max-size=10m`, `max-file=5`) across all Compose files; deployed containers must be recreated for the change to apply.
- Aligned runtime logging with the no-PII-by-default posture by removing tenant slug, email, and binder name fields from application log templates.

### Fixed
- Fixed a stale end-to-end test assertion (`e2e/root-host.spec.ts`) that expected the Cookie Notice page's original `Current posture` heading after the public legal content pass renamed it to `Cookie use`.

### Docs
- Polished README provenance and reviewer entry-point copy.
- Added the PaperBinder-hosted flagship article route and restored the About page article link to that hosted article.
- Recorded final validation and hiring assessment review evidence for `v1.1.1` release readiness.
- Added a technical retention/data inventory (`docs/95-delivery/v1-1-1-legal-retention-inventory.md`) verifying what expiration and purge mean for every data entity and operational surface, and used it to align public policy wording with actual runtime behavior instead of implying fixed-minute deletion guarantees.

## [1.1.0] - 2026-07-28

### V1.1.0 Release Notes

These notes describe the published `v1.1.0` stable release.

### Security
- Removed a tracked local ASP.NET Core Data Protection key ring XML file
  (`src/PaperBinder.Api/paperbinder-local-keys/`) found during an independent hiring-style review
  pass; it was local/demo-scoped, never the production key ring (a Docker volume at `/data/keys`).
  Added `paperbinder-local-keys/` to `.gitignore` and a new `scripts/validate-no-tracked-secrets.ps1`
  guardrail, wired into `preflight.ps1` and CI, so this class of file cannot be silently recommitted.
- Added baseline security response headers: `X-Content-Type-Options: nosniff`, `Referrer-Policy:
  strict-origin-when-cross-origin`, and `X-Frame-Options: DENY` on every app response
  (`SecurityResponseHeadersMiddleware`), plus `Strict-Transport-Security` at the TLS-terminating
  reverse proxy for the test and prod Caddy configs. CSP remains an intentional non-goal (CP16
  decision, unchanged) pending its own per-route validation pass.

### Docs
- Added a "Known Gaps" section to `REVIEWERS.md` surfacing the archive/unarchive UI gap and the
  `react-router-dom` advisory deferral directly in the reviewer fast-path, instead of leaving them
  only in `FD-0001` and the engineering review doc.

### Added
- Replaced the public presentation with the implemented V1.1 product-led shell and refreshed authenticated workspace proof surfaces.
- Added the authenticated mobile shell baseline for dashboard, binders, binder detail, document detail, users, and tenant error routes.
- Added `docs/90-adr/ADR-0015-responsive-breakpoint-policy.md`, establishing four canonical breakpoints (420/768/1024/1180px) that all layout-collapsing CSS/JS must reuse.

### Changed
- Tightened demo workspace guardrails, lease-extension behavior, destructive-action surfaces, and reviewer-facing UI polish across the authenticated workspace.
- Applied the Users-page mobile-card pattern to the Binders list so binder/document ID copy chips no longer wrap character-by-character at narrow (<420px) widths.
- Consolidated duplicated API problem-detail contracts onto the shared `PaperBinderApiProblem` shape.

### Fixed
- Fixed authenticated-shell layout breakage in the 1024-1180px viewport range caused by a CSS/JS breakpoint drift, and aligned the dashboard summary-grid breakpoint with the same threshold pairing.
- Fixed lease-banner content clipping at intermediate viewport heights (`overflow: hidden` disabling flex-item minimum-size protection).
- Fixed keyboard/focus behavior: skip-link focus target, delete-dialog focus return, visible focus rings on copy chips/credential buttons/mobile menu toggle/public logo link, and toast auto-dismiss pausing on keyboard focus as well as mouse hover.
- Fixed document markdown heading hierarchy so a document's own headings nest under page chrome instead of rendering as unnested `h1`-`h6`, while preserving H1-H4 semantic distinction.
- Fixed a stale end-to-end test assertion (`e2e/tenant-host.spec.ts`) that expected a "Tenant admin" binder-policy checkbox the product intentionally never renders.
- Removed the dead `TenantImpersonationBanner` component (defined but never rendered) and its duplicated helper.

### Security
- Independent engineering/security/architecture review found no Critical or High-severity findings: no cross-tenant data access, no auth/authz bypass, no CSRF gap, no exploitable XSS/injection, and zero known-vulnerable NuGet packages.
- Reviewed and durably deferred the one production-relevant `npm audit` advisory (`react-router-dom`, major-version migration) after confirming its open-redirect CVE does not apply to this app's client-side-only routing usage.

### Docs
- Reconciled V1.1 documentation truth, pruned superseded temporary redesign notes, and refreshed public/authenticated product screenshots.
- Completed a documentation canonicality / engineering-truth alignment pass correcting CQRS/dispatcher and caller-role claims, labeling historical CP-era and V1 presentation artifacts explicitly, and syncing `docs/ai-index.md`/`docs/repo-map.json` with actual task/ADR state.
- Recorded `v1.1.0` release validation evidence in `docs/95-delivery/release-checklist.md`: docs validation, Release build (0 warnings/0 errors), full test suite (64/64 frontend, 142/142 unit, 32/32 non-Docker integration, 102/102 Docker-backed integration), and browser E2E (root-host 3/3, tenant-host 3/3) all green; NuGet has zero vulnerable packages. Merge, tag, Test deploy, Prod deploy, smoke-validation, and release-publication evidence is recorded in the release checklist.

## [1.0.5] - 2026-07-03

### Fixed
- The Docker-backed trace-correlation release gate now waits for the expected request, database, and worker activities before asserting, eliminating the false-negative failure that stopped the `v1.0.4` release workflow before image publishing.

### Docs
- Release metadata and current-state delivery docs now align on the `v1.0.5` / `1.0.5` release identity while preserving `v1.0.2` as the last known-good public deployed state until the new release finishes rollout.

## [1.0.4] - 2026-07-02

### Changed
- The release image-publish workflow now uses current Docker GitHub Action majors, removing the remaining Node.js 20 deprecation annotations from the tagged release run.

### Fixed
- The API Dockerfile now explicitly skips Docker's `SecretsUsedInArgOrEnv` build check for the public Turnstile site key, clearing the false-positive release annotation without changing frontend runtime configuration.

### Docs
- Release metadata and current-state delivery docs now align on the `v1.0.4` / `1.0.4` release identity while preserving `v1.0.2` as the last known-good public deployed state until the new release finishes rollout.

## [1.0.3] - 2026-07-02

### Security
- OpenTelemetry runtime dependencies now align on `1.16.0`, clearing the current `NU1902` vulnerability warnings in the shipped API and worker observability baseline.

### Changed
- GitHub Actions workflow dependencies now use the Node 24-capable `v5` majors for `actions/checkout`, `actions/setup-node`, and `actions/setup-dotnet`, removing the Node 20 deprecation annotation from CI and deploy pipeline runs.

### Docs
- Release metadata and current-state delivery docs now align on the `v1.0.3` / `1.0.3` release identity while preserving `v1.0.2` as the last known-good public deployed state until the new release finishes rollout.

## [1.0.2] - 2026-07-02

### Changed
- The code-quality cleanup branch landed as a staged, scope-locked maintenance pass across tenant-user, binder, and bounded API scaffolding hotspots, improving file responsibility and skim-readability without changing the public route surface.
- Tenant-user and binder infrastructure hotspots now delegate low-signal SQL, row-mapping, and contract-model ownership into narrower seams so endpoint and service files stay focused on orchestration behavior.

### Fixed
- Tenant-user API-boundary tests now pin the stricter email validator semantics and the endpoint-level trimming of surrounding whitespace on role inputs.

### Docs
- Release metadata and current-state delivery docs now align on the `v1.0.2` / `1.0.2` release identity while preserving `v1.0.1` deployment notes as historical last-known-good public state until the new release finishes rollout.

## [1.0.1] - 2026-06-26

### Fixed
- Release version metadata now aligns across `Directory.Build.props`, the frontend package manifests, and the SemVer validation guard so stable `1.0.1` tag validation can pass the release workflow.

### Security
- ASP.NET Core Data Protection key-ring persistence now supports encrypting key XML at rest with deployment-provided X.509 `.pfx` certificates while keeping filesystem-backed key storage.

### Docs
- Current release, reviewer, and operational docs now treat `v1.0.1` as the active stable tag while preserving the original `V1` / `v1.0.0` artifact set as historical first-release evidence.

## [V1] - 2026-04-19

### Added
- The complete `V1` reviewer-ready system: root-host provisioning and login, tenant-host binder and document flows, tenant-admin user management, lease lifecycle, worker cleanup, tenant-local impersonation, and the React SPA plus ASP.NET Core API and worker runtime needed to support them.
- The canonical release artifact set for `V1`: `docs/95-delivery/release-workflow.md`, `docs/95-delivery/release-checklist.md`, and the CP17 release snapshot under `docs/archive/v1/checkpoints/pr/cp17-release-preparation-and-reviewer-snapshot/`.

### Changed
- Delivery, operations, testing, reviewer, taskboard, and execution docs now align on the locked `V1` / `v1.0.0` release identity, the supported single-host Docker Compose topology, the clean-checkout validation bundle, and the reviewer walkthrough order.
- Reviewer-facing and canonical AI docs now explicitly describe deferred post-`V1` candidate scope instead of implying shipped `V1` behavior.
- `scripts/run-root-host-e2e.ps1` remains documented only as a historical compatibility shim; `scripts/run-browser-e2e.ps1` is the canonical browser gate.

### Security
- Tenant isolation remains the release-blocking security boundary: host-derived tenant resolution, membership validation, policy-based authorization, CSRF protection, pre-auth abuse controls, authenticated mutation rate limiting, safe-source document rendering, and audit-safe impersonation are all part of the shipped `V1` contract.

### Docs
- The changelog is now cut as a `V1` release summary instead of an unbounded checkpoint accumulator, with the release-readiness signal owned by `docs/95-delivery/release-checklist.md`.
