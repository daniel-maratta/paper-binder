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
  - Validate launch profiles: `powershell -ExecutionPolicy Bypass -File .\scripts\validate-launch-profiles.ps1`
  - Validate checkpoint: `powershell -ExecutionPolicy Bypass -File .\scripts\validate-checkpoint.ps1 -Configuration Release -DockerIntegrationMode Require`
  - Start local stack: `powershell -ExecutionPolicy Bypass -File .\scripts\start-local.ps1`
- Linux/macOS with PowerShell Core:
  - Preflight: `pwsh ./scripts/preflight.ps1 -Profile Full`
  - Restore: `pwsh ./scripts/restore.ps1`
  - Build: `pwsh ./scripts/build.ps1`
  - Test: `pwsh ./scripts/test.ps1`
  - Migrate schema: `pwsh ./scripts/migrate.ps1`
  - Validate docs: `pwsh ./scripts/validate-docs.ps1`
  - Validate launch profiles: `pwsh ./scripts/validate-launch-profiles.ps1`
  - Validate checkpoint: `pwsh ./scripts/validate-checkpoint.ps1 -Configuration Release -DockerIntegrationMode Require`
  - Start local stack: `pwsh ./scripts/start-local.ps1`

## VS Code Flow

- Preflight: task `Preflight`
- Restore: task `Restore`
- Build: task `Build`
- Test: task `Test`
- Migrate schema: task `Migrate Schema`
- Docs validation: task `Validate Docs`
- Launch profile validation: task `Validate Launch Profiles`
- Standard scripted checkpoint closeout: task `Validate Checkpoint (Release)`
- Preferred reviewer entry point: launch `Reviewer Full Stack` or run task `Reviewer Full Stack`
- Local stack launch: task `Start Local Stack`
- Fast process-debug alternative: launch `App + Worker (Process)`
- Focused process-debug launches: `API Only`, `UI Only`, and `Worker Only`
- Extra focused frontend debugging: launch `Launch Frontend Dev Server`

## Visual Studio Flow

- Open `PaperBinder.sln`.
- Preferred reviewer entry point: choose `Reviewer Full Stack` from the shared solution launch profiles in `PaperBinder.slnLaunch`.
- Fast process-debug alternative: choose `App + Worker (Process)` when you want the compiled SPA and worker without Docker.
- Focused debugging remains available through `API Only`, `UI Only`, and `Worker Only`.
- If your Visual Studio build does not expose shared solution launch profiles, fall back to the matching project launch profile in `src/PaperBinder.Api/Properties/launchSettings.json` or `src/PaperBinder.Worker/Properties/launchSettings.json`.

Local Visual Studio process launches now load missing configuration keys from the repo-root `.env` file first, then fill any still-missing keys from `.env.example`. The API project build also restores and builds the frontend workspace before copying the compiled SPA into `wwwroot`, so the `UI Only` launch does not depend on a separate Vite process. `Reviewer Full Stack` runs the canonical Docker-backed startup script instead of a localhost-only process launch.

## Launch Profile Contract

- The checked-in launch surface is intentional and must stay in parity across Visual Studio and VS Code.
- Canonical shared profile names:
  - `Reviewer Full Stack`
  - `App + Worker (Process)`
  - `API Only`
  - `UI Only`
  - `Worker Only`
- VS Code may also expose `Reviewer Full Stack` as a task and may keep `Launch Frontend Dev Server` as an extra frontend-only debugging surface.
- `Reviewer Full Stack` is the highest-value reviewer path and must remain Docker-backed rather than silently degrading into a localhost-only process launch.
- `App + Worker (Process)` is an engineering convenience path and must remain clearly named as a process launch, not a full local stack launch.
- `API Only` must remain the plain backend-process live-state launch on `http://localhost:5080`.
- `UI Only` must remain the compiled-SPA-through-API-host launch on `http://localhost:5080`.
- `Worker Only` must remain the standalone worker-process launch with visible console logging.

### Reviewer Full Stack Behavior

- Startup entrypoint: `scripts/reviewer-full-stack.ps1`
- Backing topology: Docker Compose via `docker-compose.yml`
- Expected services: `proxy`, `db`, `migrations`, `app`, `worker`
- Browser behavior: opens `http://paperbinder.localhost:8080` and `http://paperbinder.localhost:8080/health/live`
- Verification behavior: confirms `/health/live` and `/health/ready`, prints compose status, and prints recent worker logs

### Drift Guard

- If any launch profile name or behavior changes, update these files in the same change set:
  - `PaperBinder.slnLaunch`
  - `.vscode/launch.json`
  - `.vscode/tasks.json` when the change affects task-backed launches
  - `src/PaperBinder.Api/Properties/launchSettings.json`
  - `src/PaperBinder.Worker/Properties/launchSettings.json`
  - `README.md`
  - `docs/70-operations/runbook-local.md`
- If the reviewer path changes, also re-verify the Docker-backed startup script and the documented reviewer URLs.
- `scripts/validate-launch-profiles.ps1` must pass before a checkpoint or launch-profile-affecting PR is called review-ready.
- The canonical `scripts/build.ps1` path runs the frontend build explicitly before `dotnet build` and then passes `SkipFrontendBuild=true` so frontend tool failures stay visible in script output.
- The canonical `scripts/restore.ps1` path reruns bodyless `dotnet restore` failures once with richer verbosity and treats a still-opaque restore as a likely restricted/offline-environment issue rather than silently implying a broken project graph.
- The frontend `npm ci` step retries one transient Windows `EPERM`/`unlink` lock before failing with explicit guidance to close whatever is holding `node_modules`.

## Checkpoint Completion Verification

- Before declaring any checkpoint done, run `powershell -ExecutionPolicy Bypass -File .\scripts\validate-launch-profiles.ps1`.
- Prefer `powershell -ExecutionPolicy Bypass -File .\scripts\validate-checkpoint.ps1 -Configuration Release -DockerIntegrationMode Require` for the standard scripted checkpoint-validation bundle.
- Record manual launch verification for every checked-in launch surface in the checkpoint PR artifact's `Validation Evidence` section.
- `scripts/validate-checkpoint.ps1` does not replace the required manual VS Code and Visual Studio verification evidence.
- Manual VS Code verification must cover:
  - `Reviewer Full Stack`
  - `App + Worker (Process)`
  - `API Only`
  - `UI Only`
  - `Worker Only`
  - `Launch Frontend Dev Server`
- Manual Visual Studio verification must cover:
  - `Reviewer Full Stack`
  - `App + Worker (Process)`
  - `API Only`
  - `UI Only`
  - `Worker Only`
- If a Visual Studio build does not expose shared solution launch profiles, verify the equivalent project launch profiles instead and record that fallback explicitly.

## Local Startup Shape

- Root host URL: `http://paperbinder.localhost:8080`
- Tenant host example: `http://demo.paperbinder.localhost:8080/app`
- Compose file: `docker-compose.yml`
- Reverse proxy config: `deploy/local/Caddyfile`
- App image build: `src/PaperBinder.Api/Dockerfile`
- Worker image build: `src/PaperBinder.Worker/Dockerfile`
- Migration image build: `src/PaperBinder.Migrations/Dockerfile`
- Repo-root environment contract: `.env` copied from `.env.example`

`scripts/start-local.ps1` now runs `docker compose up -d --build`, which includes a one-shot `migrations` service plus a long-running worker service, and applies pending schema changes before the app host is allowed to finish startup.
The local stack serves the compiled SPA and API from one ASP.NET host behind the reverse proxy, while the worker runs as a separate container so reviewers can see the same background-runtime shape the docs describe.
Use `scripts/migrate.ps1` when you need to rerun migrations manually against the current local stack.

## First-Time Local Stack Setup

1. Copy `.env.example` to `.env`.
2. Review or adjust local values if needed.
3. Run `powershell -ExecutionPolicy Bypass -File .\scripts\preflight.ps1 -Profile Full`.
4. Run `powershell -ExecutionPolicy Bypass -File .\scripts\start-local.ps1`.

The checked-in `.env.example` values are fake/demo-safe and are intended to work for the local Docker topology without exposing real secrets.
`PAPERBINDER_PUBLIC_ROOT_URL` should stay aligned with the root host URL exposed by the local reverse proxy.

## Process Debugging Surfaces

- API process-debug URL: `http://localhost:5080`
- Frontend dev server URL: `http://localhost:5173`
- `Reviewer Full Stack` opens the canonical root host at `http://paperbinder.localhost:8080` and the API liveness endpoint at `http://paperbinder.localhost:8080/health/live`, verifies health endpoints, prints compose status, and shows recent worker logs.
- `App + Worker (Process)` keeps everything on localhost and does not start Docker containers.
- `API Only` shows the backend-process live-state page rather than the product UI surface.
- `UI Only` serves the compiled SPA through the API host and loads missing environment variables from the repo-root `.env`, falling back to `.env.example` when needed.
- `Worker Only` loads missing environment variables from the repo-root `.env`, falling back to `.env.example` when needed.
- VS Code `Launch Frontend Dev Server` remains available when you specifically want the standalone Vite surface on `http://localhost:5173`.

## Current CP7 Limits

- Root-host login, tenant-host logout, cookie auth, CSRF enforcement, membership-based tenant validation, root-host provisioning, and pre-auth abuse controls are now live.
- Root-host provisioning creates the tenant, owner user, membership, lease state, and authenticated session only; binder/document seed data remains deferred.
- The checked-in browser UI for provisioning/login remains later frontend-checkpoint work even though the backend contracts are live.
- Policy-based named endpoint authorization and tenant-user administration remain later-checkpoint work.
- Interactive API documentation is intentionally deferred until endpoint contracts and authorization policy exist.
- Binder, document, lease, and impersonation feature flows remain later-checkpoint work.

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
