# Changelog

All notable changes to this project are documented in this file.

## Unreleased

- Tightened demo workspace guardrails, lease-extension behavior, destructive-action surfaces, and reviewer-facing UI polish for the `1.1.0` release candidate.
- Replaced the public presentation with the implemented V1.1 product-led shell and refreshed authenticated workspace proof surfaces.
- Added the authenticated mobile shell baseline for dashboard, binders, binder detail, document detail, users, and tenant error routes.
- Reconciled V1.1 documentation truth, pruned superseded temporary redesign notes, and refreshed public/authenticated product screenshots.

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
- The canonical release artifact set for `V1`: `docs/95-delivery/release-workflow.md`, `docs/95-delivery/release-checklist.md`, and the CP17 release snapshot under `docs/95-delivery/pr/cp17-release-preparation-and-reviewer-snapshot/`.

### Changed
- Delivery, operations, testing, reviewer, taskboard, and execution docs now align on the locked `V1` / `v1.0.0` release identity, the supported single-host Docker Compose topology, the clean-checkout validation bundle, and the reviewer walkthrough order.
- Reviewer-facing and canonical AI docs now explicitly describe deferred post-`V1` candidate scope instead of implying shipped `V1` behavior.
- `scripts/run-root-host-e2e.ps1` remains documented only as a historical compatibility shim; `scripts/run-browser-e2e.ps1` is the canonical browser gate.

### Security
- Tenant isolation remains the release-blocking security boundary: host-derived tenant resolution, membership validation, policy-based authorization, CSRF protection, pre-auth abuse controls, authenticated mutation rate limiting, safe-source document rendering, and audit-safe impersonation are all part of the shipped `V1` contract.

### Docs
- The changelog is now cut as a `V1` release summary instead of an unbounded checkpoint accumulator, with the release-readiness signal owned by `docs/95-delivery/release-checklist.md`.
