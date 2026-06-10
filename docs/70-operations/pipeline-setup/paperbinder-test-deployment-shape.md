# PaperBinder Test Deployment Shape

Status date: 2026-06-04/2026-06-05 hardening pass

This document records the observed deployed shape of the `PaperBinder-Test` server so that implementation, CI/CD, infrastructure, and documentation work can be checked against the actual runtime environment.
These documents describe observed runtime state as of the inspection date. They are not the desired future architecture unless marked as such.

This document is intentionally operational. It should not contain secrets, passwords, API keys, private keys, or unredacted connection strings.

## Purpose

`PaperBinder-Test` is the public test/demo deployment for PaperBinder. It is a public-facing Docker Compose deployment on an Ubuntu server, with web ingress through Caddy and administrative access restricted to private-overlay SSH.

The test environment is allowed to be ephemeral and lower-risk than production, but it should still follow the same SSH, firewall, Docker boundary, and secret-handling posture as production where practical.

## Host identity

| Field | Current value |
|---|---|
| Hostname | `PaperBinder-Test` |
| OS | Ubuntu 24.04.4 LTS (`noble`) |
| Public root host | redacted in public repo docs; configured through environment-specific deployment settings |
| Tenant host pattern | `{tenant}` under the configured shared-test base domain |

## Compose invocation

The running Test deployment was created with this Compose shape:

```bash
cd /opt/paperbinder/app
docker compose -p paperbinder-test -f docker-compose.test.yml ps
```

Do not assume Test uses `docker-compose.prod.yml`. The running container labels identify the Test config file as:

```text
/opt/paperbinder/app/docker-compose.test.yml
```

Observed runtime note:

- The current shared-test host is deployed manually from a checked-out source tree with locally built images.
- This is the intended long-lived runtime style for the shared test environment; shared test is not expected to adopt the GHCR-backed production image contract.

## Deployment root and local state

- Default base install directory: `/opt/paperbinder`
- Canonical app working directory: `/opt/paperbinder/app`
- `/opt/paperbinder/app` is owned by the deploy user in the observed environment
- `/opt/paperbinder/app/.env` is untracked and should remain mode `600`
- The parent `/opt/paperbinder` directory is a base install path only; do not treat its ownership as a portable contract

## Running services

Expected running services:

| Service | Container name | Exposure |
|---|---|---|
| App/API | `paperbinder-test-app-1` | Docker-internal `8080/tcp`; not host-published |
| Worker | `paperbinder-test-worker-1` | No public ports |
| Database | `paperbinder-test-db-1` | Host-local only: `127.0.0.1:5432->5432/tcp` |
| Proxy | `paperbinder-test-proxy-1` | Public `80/tcp`, `443/tcp`, `443/udp`; Caddy admin `2019/tcp` is container metadata only, not host-published |

Expected Docker port shape:

```text
paperbinder-test-app-1      8080/tcp
paperbinder-test-worker-1
paperbinder-test-db-1       127.0.0.1:5432->5432/tcp
paperbinder-test-proxy-1    0.0.0.0:80->80/tcp, [::]:80->80/tcp,
                            0.0.0.0:443->443/tcp, [::]:443->443/tcp,
                            0.0.0.0:443->443/udp, [::]:443->443/udp,
                            2019/tcp
```

## Network exposure target

Only the following should be publicly reachable from the internet:

```text
80/tcp
443/tcp
443/udp
```

SSH is intentionally not public. Postgres is intentionally not public. The app service port is intentionally not public.

Observed/listening sockets may still show `sshd` listening on `0.0.0.0:22` and `[::]:22`; this is acceptable because UFW restricts SSH ingress to the private overlay interface. Public SSH should time out.

## UFW firewall shape

Expected UFW posture:

```text
Status: active
Default: deny (incoming), allow (outgoing), deny (routed)

80/tcp                     ALLOW IN    Anywhere
443/tcp                    ALLOW IN    Anywhere
22/tcp on <overlay-interface>       ALLOW IN    Anywhere                   # SSH via private overlay only
80/tcp (v6)                ALLOW IN    Anywhere (v6)
443/tcp (v6)               ALLOW IN    Anywhere (v6)
22/tcp (v6) on <overlay-interface>  ALLOW IN    Anywhere (v6)              # SSH via private overlay only
```

There should be no broad public SSH rule:

```text
22/tcp                     ALLOW IN    Anywhere
22/tcp (v6)                ALLOW IN    Anywhere (v6)
```

## SSH posture

Effective SSH configuration should include:

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

Operational expectations:

- The deploy user can SSH over the private overlay network.
- The deploy user can escalate with `sudo` when required.
- Root SSH is disabled.
- Password-based SSH is disabled.
- Public SSH should time out because firewall rules restrict ingress to the overlay interface.

Keep local SSH client aliases and key-file paths out of committed documentation. Historical root/public aliases should not be used for normal administration.

## Data Protection key ring

PaperBinder Test uses ASP.NET Core Data Protection keys persisted to a Docker volume mounted at `/data/keys`.

Expected runtime environment variable:

```text
PAPERBINDER_AUTH_KEY_RING_PATH=/data/keys
```

Observed key volume:

```text
/var/lib/docker/volumes/paperbinder-test_paperbinder_keys/_data
```

Expected host permissions:

```text
drwx------ root root ... /var/lib/docker/volumes/paperbinder-test_paperbinder_keys/_data
-rw------- root root ... key-*.xml
```

The app currently runs as root inside the container, so it can read the root-owned key-ring files.

The warning below may still appear and is currently accepted for this demo/test deployment tier:

```text
No XML encryptor configured. Key ... may be persisted to storage in unencrypted form.
```

Interpretation: keys are persisted and permission-restricted, but not certificate-encrypted at rest. Removing this warning requires an app/config change such as certificate-backed Data Protection key protection.

## Secrets posture

Secrets must not be committed to Git or pasted into logs, tickets, docs, or chat. Important runtime secrets include, but are not limited to:

- `PAPERBINDER_DB_CONNECTION`
- `PAPERBINDER_CHALLENGE_SECRET_KEY`
- `POSTGRES_PASSWORD`
- `NAMECHEAP_API_KEY`, if present in the proxy environment

The `.env` file should be local-only and permission-restricted:

```text
/opt/paperbinder/app/.env -> chmod 600
```

Expected Git posture:

- `.env` ignored
- `.env.example` may be tracked
- no real secrets in tracked files

When printing Compose config or logs for review, use a sanitizer that redacts keys containing:

```text
PASSWORD
SECRET
TOKEN
API_KEY
CONNECTION
PRIVATE_KEY
CLIENT_SECRET
```

## Namecheap API key handling

If Test uses DNS-01 automation through Namecheap, `NAMECHEAP_API_KEY` is an infrastructure secret. It should be treated as high-value.

Recommended current posture:

- Keep it out of Git.
- Keep it in `.env` / Compose runtime configuration only.
- Keep `.env` `chmod 600`.
- Restrict SSH to Tailscale, which is already the current target posture.
- Whitelist only the required public server IPv4s in Namecheap API settings.
- Rotate the key if it is ever pasted into shared systems, screenshots, tickets, logs, or chat.

## Expected app log warnings

These are acceptable/known in the current deployment:

```text
No XML encryptor configured...
Overriding HTTP_PORTS '8080' and HTTPS_PORTS ''. Binding to values defined by URLS instead 'http://+:8080'.
Tenant resolution rejected request...
API authentication boundary rejected request...
```

The Data Protection warning is accepted for now because the key ring is persisted and permission-restricted. Tenant/auth warnings are expected when invalid hosts, expired demo tenants, unauthenticated calls, or probing traffic hit the public instance.

## Verification commands

Use these for Test verification:

```bash
cd /opt/paperbinder/app
export PB_COMPOSE='docker compose -p paperbinder-test -f docker-compose.test.yml'

$PB_COMPOSE ps
sudo ss -tulpn
sudo ufw status verbose
docker ps --format 'table {{.Names}}\t{{.Ports}}' | grep paperbinder
sudo sshd -T | grep -Ei 'permitrootlogin|passwordauthentication|kbdinteractiveauthentication|pubkeyauthentication|permitemptypasswords|allowusers|x11forwarding|maxauthtries'

docker exec paperbinder-test-app-1 sh -lc '
  echo "USER=$(id)"
  echo "PAPERBINDER_AUTH_KEY_RING_PATH=${PAPERBINDER_AUTH_KEY_RING_PATH:-<unset>}"
  ls -la /data/keys
  find /data/keys -maxdepth 1 -type f -name "*.xml" -printf "%f %s bytes\n"
'
```

From Windows:

```powershell
curl.exe -Iv https://<shared-test-root-host>
curl.exe -Iv https://<representative-tenant-host>
```

## Known follow-up items

- Verify unattended upgrades and fail2ban separately.
- Review `.env` and Docker group membership periodically.
- Consider non-root app containers in a later hardening pass.
- Consider certificate-backed ASP.NET Data Protection key encryption if PaperBinder moves beyond demo/portfolio production.
- Consider narrower DNS API token support through a DNS provider migration if Namecheap API scope becomes a concern.
