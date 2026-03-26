# Runbook: Local Development

## AI Summary

- CP1 provides a real workspace command surface before database/runtime topology exists.
- Canonical local commands live in `scripts/` and are reused by VS Code and CI.
- Current local startup runs the API host, worker host, and Vite SPA scaffold.
- Docker, Postgres, and migrations become part of the local flow in later checkpoints.

## Prerequisites

- PowerShell
- .NET SDK pinned by `global.json`
- Node.js pinned via repo `.nvmrc`
- npm pinned via `package.json` `packageManager`

## Canonical Commands

- Windows PowerShell:
  - Restore: `powershell -ExecutionPolicy Bypass -File .\scripts\restore.ps1`
  - Build: `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1`
  - Test: `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1`
  - Validate docs: `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`
  - Start local stack: `powershell -ExecutionPolicy Bypass -File .\scripts\start-local.ps1`
- Linux/macOS with PowerShell Core:
  - Restore: `pwsh ./scripts/restore.ps1`
  - Build: `pwsh ./scripts/build.ps1`
  - Test: `pwsh ./scripts/test.ps1`
  - Validate docs: `pwsh ./scripts/validate-docs.ps1`
  - Start local stack: `pwsh ./scripts/start-local.ps1`

## VS Code Flow

- Restore: task `Restore`
- Build: task `Build`
- Test: task `Test`
- Docs validation: task `Validate Docs`
- Local stack launch: task `Start Local Stack` or launch compound `Launch Local Stack`

## Current CP1 Runtime Shape

- API host project: `src/PaperBinder.Api`
- Worker host project: `src/PaperBinder.Worker`
- Frontend project: `src/PaperBinder.Web`
- Frontend dev server URL: `http://localhost:5173` on `localhost` only
- API local-start URL: `http://localhost:5080`
- Development backend landing page: `http://localhost:5080`

`scripts/start-local.ps1` starts the three processes in the background and writes stdout/stderr logs under `logs/local-start/`.
It assumes the canonical restore/build path has already been run and then starts the hosts sequentially, waiting for each one to become ready.
In local Development, the API host does not serve the SPA fallback; use `http://localhost:5173` for the frontend and `http://localhost:5080` for the backend host. The backend root is a simple reviewer-facing live-state page, not a product UI or interactive API documentation surface.

## Current CP1 Limits

- No Docker Compose or PostgreSQL wiring exists yet.
- No EF Core migrations pipeline exists yet.
- No provisioning, auth, or tenant-host feature flow exists yet.
- Health endpoints and HTTP protocol middleware land in CP4.
- Interactive API documentation is intentionally deferred until endpoint contracts and authorization policy exist.

## Running Tests Locally

- Standard path:
  1. `powershell -ExecutionPolicy Bypass -File .\scripts\restore.ps1`
  2. `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1`
  3. `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1`
- Cross-platform equivalent:
  1. `pwsh ./scripts/restore.ps1`
  2. `pwsh ./scripts/build.ps1`
  3. `pwsh ./scripts/test.ps1`
