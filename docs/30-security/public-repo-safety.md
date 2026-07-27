# Public Repo Safety
Status: V1

PaperBinder is a public repository and public demo. This document defines content-safety rules.

## Scope

In scope:
- Secret handling for local/dev/CI.
- Public demo content safety posture.

Out of scope:
- Enterprise compliance programs.
- Dedicated secret manager architecture.

## Hard Rules

### No Secrets in Git

Never commit:
- API keys, tokens, credentials.
- Connection strings with real passwords.
- Private keys or cert private keys.
- Real `.env` files.

### Allowed Configuration Patterns

- `.env.example` with fake values.
- fake-only local development settings.
- local secrets via user-secrets or gitignored `.env`.
- CI secrets only via provider secret store.

### Challenge Configuration

- Turnstile (or equivalent challenge) is anti-abuse friction.
- Challenge applies to root-host provisioning and root-host login in the current build.
- Challenge secrets must remain in environment configuration.
- Challenge data must never be committed.

## Infrastructure Access

- SSH is not exposed publicly.
- Administrative access requires Tailscale.
- Password authentication is disabled.
- SSH keys are required.

## Defensive Defaults

- Keep `.gitignore` protections for secret-like files.
- Keep repository secret scanning enabled.
- Use least-privileged DB credentials.

## Incident Response

If a secret is committed:
1. Revoke/rotate immediately.
2. Remove from history (best effort).
3. Record remediation in changelog or incident notes.
4. Add a preventive lint/check if pattern-based.

### Remediation Record: Tracked Data Protection Key Material

A local ASP.NET Core Data Protection key ring XML file (`src/PaperBinder.Api/paperbinder-local-keys/key-*.xml`,
containing an unencrypted master key per the framework's own on-disk format) was found tracked in
git during a hiring-style review pass. It was local/demo-scoped — never the production key ring,
which is a Docker volume at `/data/keys` per `PAPERBINDER_AUTH_KEY_RING_PATH` (see
`docs/30-security/secrets-and-config.md`) — but tracking it still violated this document's "No
Secrets in Git" rule. Remediation:
- Removed the tracked file and directory from the current tree (`git rm --cached`).
- Added `paperbinder-local-keys/` to `.gitignore` so the default local key-ring path (set in
  `.env.example`) is never re-tracked.
- Added `scripts/validate-no-tracked-secrets.ps1`, wired into `scripts/preflight.ps1` and
  `.github/workflows/ci.yml`, which fails the build if any `paperbinder-local-keys*` path or
  `key-*.xml` Data Protection artifact is tracked.
- Not rewriting git history for this pass: the key only ever protected local/demo sessions (not a
  production or shared-test secret), and history rewrites on a shared branch carry their own risk;
  if this repository's threat model changes, revisit per the "Remove from history (best effort)"
  step above.

## AI-Assisted Hygiene

- Never paste real secrets into prompts.
- Redact tokens and sensitive identifiers in shared logs.
- Prefer minimal error extracts over full environment dumps.

## Alternatives Considered

- Private repository: rejected; public artifact is intentional.
- Encrypted secrets in repo: rejected; key management risk remains.
- Full vault/KMS integration in V1: rejected; unnecessary overhead.
