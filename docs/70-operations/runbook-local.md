# Runbook: Local Development

## AI Summary

- Local flow: start Postgres, apply migrations, run API + worker + SPA.
- Provisioning verifies tenant bootstrap and redirect behavior.
- Common failures cover DB connectivity, cookie/domain config, and lease extension rules.
- Test commands are included for unit, integration, and full-suite runs.

## Prerequisites

- Docker Desktop (or compatible container runtime)
- .NET SDK (version pinned by `global.json` once set)
- Node.js pinned via repo `.nvmrc`
- npm pinned via `package.json` `packageManager`

## Local Startup (Minimum Flow)

1. Start PostgreSQL container:
   - `docker compose up -d postgres`
2. Apply migrations:
   - `dotnet run --project src/PaperBinder.Migrations`
3. Start API:
   - `dotnet run --project src/PaperBinder.Api`
4. Start worker:
   - `dotnet run --project src/PaperBinder.Worker`
5. Start SPA:
   - `npm --prefix src/PaperBinder.Web run dev`

If project paths differ during scaffolding, adjust commands to the active solution layout.

## Seed and Provision Flow

1. Call provisioning endpoint:
   - `POST /api/provision` with request header `X-Api-Version: 1` and valid challenge token
2. Capture returned:
   - `tenantSlug`
   - generated credentials
   - `expiresAt`
3. Log in with generated credentials and valid challenge token, then verify redirect to tenant subdomain.
4. Verify tenant lease:
   - `GET /api/tenant/lease`
   - `POST /api/tenant/lease/extend` (when eligible)

## Common Failures and Fixes

- Database connection failure
  - Verify container is running and connection string env var matches local port/user/password.
- Login loops / auth cookie missing
  - Verify cookie domain config matches local hostnames and HTTPS expectations.
- Tenant forbidden on valid login
  - Confirm host subdomain matches the provisioned `tenantSlug`.
- Extension endpoint returns conflict
  - Confirm lease remaining is less than or equal to 10 minutes and extension count is below 3.

## Running Tests Locally

- Unit tests:
  - `dotnet test --filter \"Category=Unit\"`
- Integration tests:
  - `dotnet test --filter \"Category=Integration\"`
- Full suite:
  - `dotnet test`
