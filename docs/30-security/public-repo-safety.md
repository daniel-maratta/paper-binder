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
- Challenge is planned to apply to root-host provisioning and root-host login in CP7.
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

## AI-Assisted Hygiene

- Never paste real secrets into prompts.
- Redact tokens and sensitive identifiers in shared logs.
- Prefer minimal error extracts over full environment dumps.

## Alternatives Considered

- Private repository: rejected; public artifact is intentional.
- Encrypted secrets in repo: rejected; key management risk remains.
- Full vault/KMS integration in V1: rejected; unnecessary overhead.
