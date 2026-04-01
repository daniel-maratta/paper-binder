# Runbook: Local Development

## AI Summary

- CP2 established the Docker Compose topology; CP3 adds the schema migration workflow on top of it.
- Canonical local commands still live in `scripts/` and are reused by VS Code where appropriate.
- The repo-root `.env` file drives Docker Compose, backend process debugging, and frontend build-time configuration.
- Process-based API, worker, and Vite launches remain available for focused debugging outside the canonical local stack.

## Prerequisites

- PowerShell
- .NET SDK pinned by `global.json`
- Node.js pinned via repo `.nvmrc`
- npm pinned via `package.json` `packageManager`
- Docker Engine with Docker Compose plugin

## Canonical Commands

- Windows PowerShell:
  - Preflight: `powershell -ExecutionPolicy Bypass -File .\scripts\preflight.ps1 -Profile Full`
  - Restore: `powershell -ExecutionPolicy Bypass -File .\scripts\restore.ps1`
  - Build: `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1`
  - Test: `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1`
  - Migrate schema: `powershell -ExecutionPolicy Bypass -File .\scripts\migrate.ps1`
  - Validate docs: `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`
  - Start local stack: `powershell -ExecutionPolicy Bypass -File .\scripts\start-local.ps1`
- Linux/macOS with PowerShell Core:
  - Preflight: `pwsh ./scripts/preflight.ps1 -Profile Full`
  - Restore: `pwsh ./scripts/restore.ps1`
  - Build: `pwsh ./scripts/build.ps1`
  - Test: `pwsh ./scripts/test.ps1`
  - Migrate schema: `pwsh ./scripts/migrate.ps1`
  - Validate docs: `pwsh ./scripts/validate-docs.ps1`
  - Start local stack: `pwsh ./scripts/start-local.ps1`

## VS Code Flow

- Preflight: task `Preflight`
- Restore: task `Restore`
- Build: task `Build`
- Test: task `Test`
- Docs validation: task `Validate Docs`
- Local stack launch: task `Start Local Stack`
- Focused process debugging: launch `Launch API`, `Launch Worker`, or `Launch Frontend Dev Server`

## Visual Studio Flow

- Open `PaperBinder.sln`.
- Preferred reviewer entry point: select the shared `Reviewer UI` solution launch profile from `PaperBinder.slnLaunch`.
- If your Visual Studio build does not expose shared solution launch profiles, set `PaperBinder.Api` as the startup project and use the `reviewer-ui` launch profile from `launchSettings.json`.
- For a process-based reviewer UI + worker session, use the shared `Reviewer UI + Worker` solution launch profile when available.

Local Visual Studio process launches now load missing configuration keys from the repo-root `.env` file, and fall back to `.env.example` when `.env` is absent. The API project build also restores and builds the frontend workspace before copying the compiled SPA into `wwwroot`, so the reviewer UI launch does not depend on a separate Vite process.

## Local Startup Shape

- Root host URL: `http://paperbinder.localhost:8080`
- Tenant host example: `http://demo.paperbinder.localhost:8080/app`
- Compose file: `docker-compose.yml`
- Reverse proxy config: `deploy/local/Caddyfile`
- App image build: `src/PaperBinder.Api/Dockerfile`
- Migration image build: `src/PaperBinder.Migrations/Dockerfile`
- Repo-root environment contract: `.env` copied from `.env.example`

`scripts/start-local.ps1` now runs `docker compose up -d --build`, which includes a one-shot `migrations` service that applies pending schema changes before the app host is allowed to finish startup.
The local app container serves the compiled SPA and API from one ASP.NET host, while the reverse proxy keeps root-host and tenant-host routing aligned with the documented deployment shape.
Use `scripts/migrate.ps1` when you need to rerun migrations manually against the current local stack.

## First-Time Local Stack Setup

1. Copy `.env.example` to `.env`.
2. Review or adjust local values if needed.
3. Run `powershell -ExecutionPolicy Bypass -File .\scripts\preflight.ps1 -Profile Full`.
4. Run `powershell -ExecutionPolicy Bypass -File .\scripts\start-local.ps1`.

The checked-in `.env.example` values are fake/demo-safe and are intended to work for the local Docker topology without exposing real secrets.

## Process Debugging Surfaces

- API process-debug URL: `http://localhost:5080`
- Frontend dev server URL: `http://localhost:5173`
- Plain Development API launches still show a backend-process live-state page rather than the product UI surface.
- Visual Studio `reviewer-ui` launches serve the compiled SPA through the API host and load missing environment variables from the repo-root `.env`, falling back to `.env.example` when needed.
- Visual Studio `worker-process` launches also load missing environment variables from the repo-root `.env`, falling back to `.env.example` when needed.
- `Launch API` and `Launch Worker` read environment variables from the repo-root `.env`.

## Current CP3 Limits

- No provisioning, auth, or tenant-host feature flow exists yet.
- HTTP versioning, correlation, ProblemDetails middleware, and contract-focused protocol coverage still land in CP4.
- Interactive API documentation is intentionally deferred until endpoint contracts and authorization policy exist.
- The baseline schema is intentionally narrow: it establishes the first tenant lease table and migration workflow without pulling auth or binder/document features forward.

## Running Tests Locally

- Standard path:
  1. `powershell -ExecutionPolicy Bypass -File .\scripts\restore.ps1`
  2. `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1`
  3. `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1`
- Cross-platform equivalent:
  1. `pwsh ./scripts/restore.ps1`
  2. `pwsh ./scripts/build.ps1`
  3. `pwsh ./scripts/test.ps1`

`scripts/test.ps1` now runs three logical buckets:
- unit tests
- non-Docker integration tests
- Docker-backed integration tests when Docker is available

If Docker is unavailable, the script emits an explicit skip message for the Docker-backed bucket instead of failing late inside Testcontainers startup. Use `-DockerIntegrationMode Require` when you need full CP3+ merge-gate validation and want Docker availability to fail fast.
