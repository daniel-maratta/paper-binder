# PaperBinder Deployment Shape Summary

Status date: 2026-06-04/2026-06-05 hardening pass

This summary captures the current shared deployment posture for `PaperBinder-Test` and `PaperBinder-Prod`. Use the environment-specific documents for public-safe runtime details such as Compose files, service names, and current-vs-intended deployment distinctions.
These documents describe observed runtime state as of the inspection date. They are not the desired future architecture unless marked as such.

## Deployment model

Both environments are single-host Docker Compose deployments on Ubuntu 24.04.4 LTS.

| Layer | Current shape |
|---|---|
| Host OS | Ubuntu 24.04.4 LTS |
| Runtime style | Manual deployment from checked-out source with locally built Docker images |
| Intended future contract | GHCR-backed, release-tagged production rollout; not yet the observed live state |
| Admin access | SSH as the deploy user over a private overlay interface only |
| Public ingress | Caddy proxy on `80/tcp`, `443/tcp`, `443/udp` |
| App/API | Docker-internal `8080/tcp`; not host-published |
| Worker | Internal only |
| Postgres | Host-local `127.0.0.1:5432`; not public |
| Data Protection keys | Docker volume mounted at `/data/keys`, with optional app-only `.pfx` mount at `/run/paperbinder-secrets/data-protection.pfx` |
| App working directory | `/opt/paperbinder/app`, owned by the deploy user |
| Secrets | `.env` under `/opt/paperbinder/app`, mode `600`, Compose runtime; never committed |

## Environment-specific Compose commands

```bash
# Test
cd /opt/paperbinder/app
docker compose -p paperbinder-test -f docker-compose.test.yml ps

# Prod
cd /opt/paperbinder/app
docker compose -p paperbinder-prod -f docker-compose.prod.yml ps
```

## SSH target posture

Both servers should report:

```text
permitrootlogin no
passwordauthentication no
kbdinteractiveauthentication no
pubkeyauthentication yes
permitemptypasswords no
x11forwarding no
allowusers <deploy-user>
maxauthtries 3
```

Public SSH should time out. Overlay-network SSH should work.

## UFW target posture

Both servers should allow only web traffic publicly and SSH on the private overlay interface:

```text
80/tcp                     ALLOW IN    Anywhere
443/tcp                    ALLOW IN    Anywhere
22/tcp on <overlay-interface>       ALLOW IN    Anywhere                   # SSH via private overlay only
80/tcp (v6)                ALLOW IN    Anywhere (v6)
443/tcp (v6)               ALLOW IN    Anywhere (v6)
22/tcp (v6) on <overlay-interface>  ALLOW IN    Anywhere (v6)              # SSH via private overlay only
```

There should be no plain public `22/tcp ALLOW IN Anywhere` rule.

## Port exposure target

Expected public exposure:

```text
80/tcp
443/tcp
443/udp
```

Expected non-public exposure:

```text
Postgres: 127.0.0.1:5432 only
App/API: Docker-internal 8080/tcp only
SSH: reachable only through the private overlay firewall rule
```

## Data Protection key handling

Both environments persist ASP.NET Core Data Protection keys at:

```text
/data/keys
```

The container path is backed by a named Docker volume. The host volume directory should be:

```text
drwx------ root root ... _data
```

The key XML files should be:

```text
-rw------- root root ... key-*.xml
```

The app currently runs as root inside the container. This makes the current root-owned key volume readable by the app.

Deployment hardening now supports certificate-backed key encryption with:

```text
PAPERBINDER_DATA_PROTECTION_APPLICATION_NAME=PaperBinder-Example
PAPERBINDER_DATA_PROTECTION_CERTIFICATE_PATH=/run/paperbinder-secrets/data-protection.pfx
PAPERBINDER_DATA_PROTECTION_CERTIFICATE_PASSWORD=<set-on-server>
```

When those settings are applied and the certificate is mounted into the app container, the `No XML encryptor configured...` warning should disappear from app logs.

## Runtime secrets

Important secrets include:

```text
PAPERBINDER_DB_CONNECTION
PAPERBINDER_CHALLENGE_SECRET_KEY
POSTGRES_PASSWORD
NAMECHEAP_API_KEY
```

Handling rules:

- Do not commit real values.
- Do not paste raw Compose config.
- Do not paste raw `.env` files.
- Use redaction before sharing logs/config.
- Keep `.env` local and permission-restricted.
- Rotate any secret that is pasted into a shared or persistent system.

## Broad redaction filter

Use this pattern when reviewing Compose config or logs:

```bash
sed -E '
  s/(Password=)[^;"]+/\1<REDACTED>/Ig;
  s/(Username=)[^;"]+/\1<REDACTED>/Ig;
  s/(User ID=)[^;"]+/\1<REDACTED>/Ig;
  s/(Host=)[^;"]+/\1<REDACTED>/Ig;
  s/(Database=)[^;"]+/\1<REDACTED>/Ig;
  s/([[:space:]]*[A-Z0-9_]*(PASSWORD|SECRET|TOKEN|API_KEY|CONNECTION|PRIVATE_KEY|CLIENT_SECRET)[A-Z0-9_]*:[[:space:]]*).*/\1<REDACTED>/Ig;
  s/([A-Z0-9_]*(PASSWORD|SECRET|TOKEN|API_KEY|CONNECTION|PRIVATE_KEY|CLIENT_SECRET)[A-Z0-9_]*=).*/\1<REDACTED>/Ig;
'
```

## Known acceptable warnings

The following warnings are expected in the current deployment and should not be treated as immediate defects without additional evidence:

```text
Overriding HTTP_PORTS '8080' and HTTPS_PORTS ''. Binding to values defined by URLS instead 'http://+:8080'.
Tenant resolution rejected request...
API authentication boundary rejected request...
```

## Follow-up hardening backlog

Recommended future passes:

1. Verify unattended upgrades and fail2ban.
2. Review `.env`, sudo group, and Docker group membership.
3. Consider moving Caddy DNS credentials to a stricter secret-handling pattern.
4. Consider running app/worker containers as non-root users.
5. Consider DNS provider/API token model if Namecheap API scope is too broad.
