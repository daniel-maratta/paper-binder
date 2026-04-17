# PaperBinder

PaperBinder is a constrained multi-tenant SaaS demonstration designed to exhibit architectural discipline.

It is intentionally narrow in scope: the goal is to demonstrate senior-level system design, security posture, and delivery discipline without building a "kitchen sink" platform.

---

## For Technical Reviewers

If you are reviewing this repository as part of a technical interview or architecture discussion, see:

REVIEWERS.md

---

## Purpose

This repo exists to:
- Provide a high-signal hiring artifact: realistic SaaS boundaries, tenant isolation, auditability, and clean delivery practices.
- Demonstrate a pragmatic approach to multi-tenant architecture (auth, tenant routing, isolation, and operational constraints).
- Show careful scoping: build just enough to be credible, secure, and reviewable.

This is not intended to become a commercial product.

---

## What PaperBinder Is

- A multi-tenant web app where each tenant operates in an isolated context.
- A document/policy binder concept implemented using DB-backed text documents.
- A product demo emphasizing tenant-aware routing and authorization with explicit non-goals.

---

## Docs Layout

- `docs/00-intent/`: product intent constraints and glossary.
- `docs/05-taskboard/`: repo-native agent taskboard and durable execution state.
- `docs/10-product/`: product requirements, user stories, and UX/domain language.
- `docs/15-feature-definition/`: feature-level contracts and ambiguity resolution docs.
- `docs/20-architecture/`: conceptual system design and boundary definitions.
- `docs/30-security/`: security posture, tenant isolation, and threat model.
- `docs/40-contracts/`: API and external contract documentation.
- `docs/50-engineering/`: product engineering constraints and stack lock.
- `docs/55-execution/`: staged delivery plan for this product.
- `docs/60-ai/`: product AI subsystem scope and architecture.
- `docs/70-operations/`: operational procedures and runbooks.
- `docs/80-testing/`: test strategy, test data, and test suites.
- `docs/90-adr/`: product architecture decision records.
- `docs/95-delivery/`: release/PR artifacts and delivery/versioning notes.

---

## Documentation

- AI docs index: `docs/ai-index.md`
- Machine-readable doc topology: `docs/repo-map.json`
- Documentation integrity contract: `docs/00-intent/documentation-integrity-contract.md`
- Agent taskboard: `docs/05-taskboard/`
- API contracts: `docs/40-contracts/`
- ADRs: `docs/90-adr/`
- Security stance: `docs/30-security/`
- Operational runbooks: `docs/70-operations/`
- Testing docs: `docs/80-testing/`

---

## Bootstrap

Canonical workspace commands live in `scripts/`:

- Windows PowerShell:
  - `powershell -ExecutionPolicy Bypass -File .\scripts\preflight.ps1 -Profile Full`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\restore.ps1`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\migrate.ps1`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\validate-launch-profiles.ps1`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\validate-checkpoint.ps1 -Configuration Release -DockerIntegrationMode Require`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\run-root-host-e2e.ps1`
  - `powershell -ExecutionPolicy Bypass -File .\scripts\start-local.ps1`
- Linux/macOS with PowerShell Core:
  - `pwsh ./scripts/preflight.ps1 -Profile Full`
  - `pwsh ./scripts/restore.ps1`
  - `pwsh ./scripts/build.ps1`
  - `pwsh ./scripts/test.ps1`
  - `pwsh ./scripts/migrate.ps1`
  - `pwsh ./scripts/validate-docs.ps1`
  - `pwsh ./scripts/validate-launch-profiles.ps1`
  - `pwsh ./scripts/validate-checkpoint.ps1 -Configuration Release -DockerIntegrationMode Require`
  - `pwsh ./scripts/run-root-host-e2e.ps1`
  - `pwsh ./scripts/start-local.ps1`
- Visual Studio:
  - Open `PaperBinder.sln`.
  - Preferred reviewer entry point: choose `Reviewer Full Stack` from the shared solution launch profiles in `PaperBinder.slnLaunch`.
  - Fast process-debug alternative: choose `App + Worker (Process)` when you want the compiled SPA and worker without Docker.
  - Focused debugging remains available via `API Only`, `UI Only`, and `Worker Only`.
  - If shared solution launch profiles are unavailable in your Visual Studio build, fall back to the matching project launch profile on `PaperBinder.Api` or `PaperBinder.Worker`.

VS Code tasks and launch settings are thin wrappers over the same command surface in `.vscode/`.
The primary reviewer launch now stays in parity across both editors as `Reviewer Full Stack`, with `App + Worker (Process)` as the fast localhost-only fallback.
The authoritative launch-profile contract lives in `docs/70-operations/runbook-local.md`.
Checkpoint-complete validation now also requires `scripts/validate-launch-profiles.ps1` plus recorded manual launch verification in both VS Code and Visual Studio before a checkpoint can be declared done.
`scripts/validate-checkpoint.ps1` bundles the standard scripted closeout path (build, tests, docs validation, launch-profile validation), but it does not replace the required manual verification evidence.
CP14 closeout also requires `scripts/run-root-host-e2e.ps1` as a separate browser gate; the broadened suite now covers both root-host and tenant-host Playwright flows and is intentionally not bundled into `scripts/validate-checkpoint.ps1`.
The canonical `scripts/build.ps1` path now runs the frontend build explicitly before `dotnet build` and then passes `SkipFrontendBuild=true` into the solution build so Vite/npm failures surface with tool-native output instead of an opaque MSBuild exit.
`scripts/restore.ps1` now reruns bodyless `dotnet restore` failures once with richer verbosity and treats persistent no-body restore failures as a likely restricted/offline-environment issue rather than silently implying a broken project graph. Its `npm ci` step also retries one transient Windows `EPERM`/`unlink` lock before failing with explicit close-the-locking-process guidance.

The Windows `powershell -ExecutionPolicy Bypass -File ...` path is the supported baseline for this repo; it is not a one-off workaround and the checked-in VS Code tasks use the same entrypoint.

For local development, the canonical reviewer startup path is Docker Compose at `http://paperbinder.localhost:8080`, with optional process-debug surfaces on `http://localhost:5080` (API host) and `http://localhost:5173` (Vite).

Policy:
- CP2 makes the canonical local stack Docker Compose-based at `http://paperbinder.localhost:8080`, fronted by Caddy and backed by PostgreSQL.
- CP3 adds a dedicated migrations executable and Docker Compose migration service so schema changes apply before the app host and worker are considered ready.
- Process-based API (`http://localhost:5080`) and Vite (`http://localhost:5173`) launches remain available for focused debugging, not as the canonical local topology.
- `Reviewer Full Stack` is the highest-value reviewer path because it starts the proxy, database, migrations, app host, and worker together, verifies health endpoints, and opens both the reviewer root host and the API liveness endpoint.
- `App + Worker (Process)` is the fast engineering path when you only want the compiled SPA on `http://localhost:5080` and a separate worker process.
- `API Only` launches in Development indicate process liveness only, while `UI Only` serves the compiled SPA through the same API host.
- VS Code keeps the separate `Launch Frontend Dev Server` path as an extra focused frontend-debug surface.
- Interactive API documentation can be introduced later when real endpoint contracts exist and authorization policy is in place.
- `scripts/test.ps1` always runs unit tests plus the non-Docker integration bucket; Docker-backed integration tests run automatically when Docker is available and can be required explicitly via `-DockerIntegrationMode Require` for checkpoint or CI validation.

---

## Status

This repository is under active development.
