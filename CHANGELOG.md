# Changelog

All notable changes to this project are documented in this file.

## Unreleased

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
