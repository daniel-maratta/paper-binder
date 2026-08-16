# Security Policy

PaperBinder is a public engineering portfolio and constrained multi-tenant SaaS demonstration operated by Daniel Maratta. It is not a production SaaS service, customer system, compliance platform, managed security service, or bug-bounty program.

This policy defines the current vulnerability-reporting and dependency-maintenance posture for the public demo and repository.

## Supported Versions

PaperBinder supports only the current public deployment and the current release-candidate branch/tag being prepared for that deployment. Older tags and historical checkpoint branches are preserved for review evidence, but they do not receive security backports.

| Version surface | Support posture |
| --- | --- |
| Current public demo | Best-effort review and remediation for credible security reports. |
| Current release candidate | Best-effort review and remediation before release when the report is applicable. |
| Historical tags, archive docs, and checkpoint evidence | Not supported; retained for review/provenance only. |
| Local forks or private deployments | Not supported by Daniel Maratta. Operators are responsible for their own configuration and updates. |

No uptime, response-time, remediation-time, availability, backup, recovery, or continuity guarantee is provided.

## Reporting A Vulnerability

Do not submit real secrets, credentials, confidential data, regulated data, or sensitive tenant content when reporting an issue.

For sensitive security reports, contact `legal@danielmaratta.com` with a subject that starts with `SECURITY:`. Include:

- A concise description of the issue.
- Affected URL, endpoint, route, package, or file path.
- Reproduction steps using only demo-safe data.
- Impact assessment, including whether tenant isolation, authentication, authorization, CSRF, session handling, secrets, logging, or dependency advisories are involved.
- Whether the issue appears to affect the current public demo, local development only, test tooling only, or archived material.

Do not file public GitHub issues for exploitable vulnerabilities until the issue has been reviewed. Public issues are acceptable for non-sensitive documentation bugs, stale links, or non-security defects.

## Research Rules And Safe Harbor Limits

PaperBinder welcomes good-faith, low-impact security reports, but it does not grant broad testing authorization.

Permitted:

- Static review of the public repository.
- Non-destructive interaction with the public demo using demo-safe data.
- Reports that identify vulnerable dependency versions, misconfiguration risk, documentation drift, or plausible security-boundary defects.

Not permitted:

- Accessing, modifying, deleting, or exfiltrating another user's tenant data.
- Attempting credential theft, session theft, phishing, social engineering, or MFA/challenge bypass against real accounts.
- Denial-of-service, load testing, stress testing, or excessive scraping.
- Persistence, malware, crypto-mining, destructive tests, or lateral movement.
- Testing third-party infrastructure, DNS, hosting provider consoles, registries, CI/CD providers, or email systems outside PaperBinder's own public demo surface.
- Submitting sensitive, regulated, confidential, proprietary, medical, financial, credential, or important real business information.

This project does not offer rewards, bounties, compensation, swag, public credit guarantees, or legal safe-harbor commitments beyond the limited permission described above.

## Security Scope

Security-sensitive areas include:

- Tenant isolation and tenant-host routing.
- Authentication, authorization, role and membership checks.
- CSRF, cookie flags, session lifetime, and logout behavior.
- Tenant lease expiry and cleanup behavior.
- Secrets, deployment configuration, and public-repo hygiene.
- Logging of user-provided or sensitive fields.
- Dependency advisories that apply to PaperBinder's shipped runtime.

Current security design references:

- `docs/30-security/tenant-isolation.md`
- `docs/30-security/threat-model-lite.md`
- `docs/30-security/secrets-and-config.md`
- `docs/30-security/public-repo-safety.md`
- `docs/95-delivery/v1-1-1-legal-retention-inventory.md`

## Dependency Maintenance Policy

PaperBinder keeps dependency maintenance intentionally small and reviewable.

### Inventory

- npm dependencies are locked by `src/PaperBinder.Web/package-lock.json`.
- Direct NuGet package versions are centralized in `Directory.Build.props` and referenced from project files.
- Third-party notice generation is deterministic and checked with `npm.cmd run third-party-notices:check`.
- `THIRD-PARTY-NOTICES.md` is generated from the npm lockfile and direct NuGet references.

### Routine Checks

Before a release candidate is considered legally/security ready, run:

```powershell
npm.cmd audit --audit-level=moderate
dotnet list PaperBinder.sln package --vulnerable --include-transitive
npm.cmd run third-party-notices:check
powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release
powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release
powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1
```

Use Docker-backed integration tests and browser E2E when the dependency, advisory, or fix touches authentication, tenant routing, redirects, cookies, API behavior, persistence, or frontend routing.

### Triage Rules

- Runtime vulnerabilities affecting tenant isolation, auth/authz, session handling, CSRF, redirects, secrets, server request handling, markdown rendering, database access, or production dependency paths block release until patched, mitigated, or explicitly deferred with a recorded rationale.
- Same-major patch/minor updates are preferred when they do not alter security-sensitive behavior.
- Major-version upgrades that can change route semantics, auth behavior, persistence behavior, serialization, or runtime hosting must be tracked as explicit implementation work with focused validation.
- Development-only, test-only, or non-applicable advisories may be deferred when the rationale is documented and the shipped runtime is not exposed.
- Any vulnerable dependency that remains in the tree must have an owner-visible disposition in taskboard or release evidence before release.

### Current Known Carry-Forwards

- React Router major-version upgrade remains tracked in `docs/05-taskboard/tasks/T-0053-react-router-major-version-upgrade.md`. Existing React Router RSC-mode advisories were previously dispositioned as not applicable to PaperBinder's shipped client-rendered SPA runtime, but the major-version upgrade remains future minor-version maintenance work.
- The current Release build emits an existing `NU1903` warning for transitive `SSH.NET` under `tests/PaperBinder.IntegrationTests`. Treat this as test-tooling dependency debt until remediated or replaced; do not describe the build as warning-free while it remains.

## Disclosure And Remediation

Valid reports will be reviewed on a best-effort basis. Possible outcomes include:

- Fix and release.
- Configuration change.
- Documentation correction.
- Dependency update.
- Recorded deferral with rationale.
- No action when the report is not applicable to PaperBinder's current public demo or supported version surface.

Do not rely on PaperBinder for storage, backup, recovery, compliance, sensitive data processing, or production work while any report is under review.
