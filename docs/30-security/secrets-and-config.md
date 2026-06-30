# Secrets And Config

## Configuration Sources by Environment

- Local: environment variables + local `.env` (gitignored).
- Dev/Test: environment variables from deployment/runtime environment.
- Prod: environment variables and secret manager integration (provider-specific).

## Secret vs Config

- Secret: any value that grants access or can impersonate identity.
  - Examples: database password, cookie encryption keys, API keys.
- Config: non-sensitive behavior settings.
  - Examples: app URLs, feature flags, lease and cleanup cadence.
- Frontend build-time config uses `VITE_PAPERBINDER_*` keys and stays non-secret in v1.

## Lease Configuration Naming

- Tenant lease behavior is configured with environment variables that use `LEASE` in the key name.
- In v1, `PAPERBINDER_LEASE_*` keys are the canonical config contract for lease duration, extension eligibility/amount, max extensions, and cleanup cadence.

## Required Environment Variables (Examples)

- `PAPERBINDER_DB_CONNECTION=Host=localhost;Port=5432;Database=paperbinder;Username=paperbinder-prod;Password=<secret>`
- `PAPERBINDER_PUBLIC_ROOT_URL=https://<production-root-host>`
- `PAPERBINDER_AUTH_COOKIE_DOMAIN=.<production-base-domain>`
- `PAPERBINDER_AUTH_COOKIE_NAME=paperbinder.auth`
- `PAPERBINDER_AUTH_KEY_RING_PATH=/data/keys`
- `PAPERBINDER_DATA_PROTECTION_APPLICATION_NAME=PaperBinder-Example`
- `PAPERBINDER_DATA_PROTECTION_CERTIFICATE_PATH=/run/paperbinder-secrets/data-protection.pfx`
- `PAPERBINDER_DATA_PROTECTION_CERTIFICATE_PASSWORD=<secret>`
- `PAPERBINDER_LEASE_CLEANUP_INTERVAL_SECONDS=60`
- `PAPERBINDER_LEASE_DEFAULT_MINUTES=60`
- `PAPERBINDER_LEASE_EXTENSION_MINUTES=10`
- `PAPERBINDER_LEASE_MAX_EXTENSIONS=3`
- `PAPERBINDER_CHALLENGE_SITE_KEY=<public-site-key>`
- `PAPERBINDER_CHALLENGE_SECRET_KEY=<secret>`
- `PAPERBINDER_RATE_LIMIT_PREAUTH_PER_MINUTE=30`
- `PAPERBINDER_RATE_LIMIT_AUTHENTICATED_PER_MINUTE=120`
- `PAPERBINDER_RATE_LIMIT_LEASE_EXTEND_PER_MINUTE=10`
- `PAPERBINDER_AUDIT_RETENTION_MODE=RetainTenantPurgedSummary`
- `PAPERBINDER_OTEL_OTLP_ENDPOINT=https://otel.example.com:4317` (optional)
- `VITE_PAPERBINDER_ROOT_URL=https://<production-root-host>`
- `VITE_PAPERBINDER_API_BASE_URL=https://<production-root-host>`
- `VITE_PAPERBINDER_TENANT_BASE_DOMAIN=<production-base-domain>`

Shared test uses the equivalent `<shared-test-root-host>` and `<shared-test-base-domain>` values for `PAPERBINDER_PUBLIC_ROOT_URL`, `PAPERBINDER_AUTH_COOKIE_DOMAIN`, and the `VITE_PAPERBINDER_*` host settings.
Production and shared test must not share cookie-domain settings.
Production GHCR deploys also require the workflow-generated `POSTGRES_DB`, `POSTGRES_USER`, and `PAPERBINDER_DB_CONNECTION` values to agree with the existing PostgreSQL role on the host. The current production role is `paperbinder-prod`.

When a deployment uses the repo-owned wildcard-TLS proxy path, Caddy also requires deployment-only DNS-challenge settings:

- `NAMECHEAP_API_USER=<namecheap-username>`
- `NAMECHEAP_API_KEY=<secret>`
- `NAMECHEAP_CLIENT_IP=<whitelisted-ipv4>`
- `NAMECHEAP_API_ENDPOINT=https://api.namecheap.com/xml.response` (optional; production endpoint default)

Do not commit real values.
Keep the repo-root `.env.example` synchronized with these keys using fake values only.
Do not commit `.pfx` files, private keys, or certificate passwords; place deployment certificates on the server only.
The current public GHCR deployment contract fixes `PAPERBINDER_AUTH_KEY_RING_PATH` to `/data/keys` in the checked-in deploy Compose files.
`TEST_AUTH_KEY_RING_PATH` and `PROD_AUTH_KEY_RING_PATH` GitHub environment values are not currently consumed by the deploy workflows; if operator-configurable key-ring paths are introduced later, update workflow validation, generated `.env`, and deploy Compose interpolation together.

`PAPERBINDER_PUBLIC_ROOT_URL` must be an absolute root URL with the same host as `PAPERBINDER_AUTH_COOKIE_DOMAIN`.
Provision, login, and logout redirect construction must use this trusted config value rather than the raw incoming request scheme/host.
Production is indexable by default. Shared test remains intentionally non-indexable through proxy policy rather than application secrets.

`PAPERBINDER_LEASE_EXTENSION_MINUTES` drives both the lease-extension eligibility threshold and the number of minutes added on success.
No separate `PAPERBINDER_LEASE_EXTENSION_WINDOW_*` key exists in v1.

`PAPERBINDER_AUDIT_RETENTION_MODE` must be exactly one supported mode:
- `PurgeTenantAudit`
- `RetainTenantPurgedSummary`
- `PurgeTenantAudit` suppresses tenant-specific success summaries after purge.
- `RetainTenantPurgedSummary` keeps only a minimal non-sensitive `tenant_purged` structured log event.

## Rotation Expectations

- Cookie encryption/signing material must support rotation (manual rotation is acceptable in v1).
- Enabling certificate-backed Data Protection key protection does not retroactively re-encrypt an existing persisted key file.
- If an environment already has an older unencrypted key-ring XML file, rotate or recreate that key-ring volume during a maintenance window when encrypted-at-rest persistence itself is required.
- Database credentials should be rotated on environment change and incident response events.
- Document rotation steps in environment runbooks.

## Logging Rules

- Never log secret values.
- Redact secret-like patterns in logs and error payloads.
- Do not emit connection strings or credentials in exception messages returned to clients.

## Local Development Secret Storage

- Use a local `.env` file for development-only secrets.
- `.env` must remain gitignored.
- Start local Docker Compose and VS Code process-debug flows from the same repo-root `.env` contract.
- Prefer platform secret stores where available; do not embed secrets in source files.
