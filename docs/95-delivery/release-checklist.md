# Release Checklist
Status: Current (`V1`)

## Purpose

Own the canonical release gate list for the published stable `V1` release.

## Required Artifacts

- [x] `CHANGELOG.md` contains the current `## [1.1.1] - 2026-08-17` entry above the `## [1.1.0] - 2026-07-28` prior stable entry, with a fresh empty `## Unreleased`.
- [x] Repository version metadata matches the current `v1.1.1` / `1.1.1` release.
- [x] `CHANGELOG.md` contains the current `## [1.1.0] - 2026-07-28` published stable entry above the `## [1.0.5] - 2026-07-03` stable entry and the historical `## [V1] - 2026-04-19` first-cut release summary, with a fresh empty `## Unreleased`.
- [x] `docs/95-delivery/release-workflow.md` and `docs/95-delivery/release-checklist.md` agree on the `V1` release line, the published stable tag, the active branch metadata distinction, the command surface, and ownership.
- [x] Repository version metadata matched the published stable `V1` release tag `v1.1.0` / `1.1.0` on `main` at the `v1.1.0` release cut.
- [x] `.github/workflows/ci.yml` validates version metadata on pull requests and pushes to `main`.
- [x] `.github/workflows/release.yml` defines the tag-driven release validation pipeline for stable SemVer tags.
- [x] `docs/archive/v1/checkpoints/pr/cp17-release-preparation-and-reviewer-snapshot/description.md` records shipped scope, validation evidence, reviewer walkthrough, and author notes for the critic.
- [x] `README.md`, `REVIEWERS.md`, `review/`, `docs/60-ai/`, operations docs, testing docs, taskboard state, and checkpoint ledger describe the shipped `V1` system only.

## Scripted Validation

- [x] Fresh candidate clone bootstrapped `.env` from `.env.example` before Docker-backed commands on `2026-04-19`.
- [x] Current stable-tag candidate validation reran from the active workspace on `2026-06-26`.
- [x] Current stable-tag candidate validation reran from the active workspace on `2026-07-02`.
- [x] Current stable-tag candidate validation reran from the active workspace on `2026-07-03`.
- [x] [preflight.ps1](../../scripts/preflight.ps1) `-Profile Full` passed on `2026-04-19`.
- [x] [restore.ps1](../../scripts/restore.ps1) passed on `2026-04-19`.
- [x] [validate-version.ps1](../../scripts/validate-version.ps1) is part of CI and release validation and passed for `1.0.1` on `2026-06-26`.
- [x] [validate-version.ps1](../../scripts/validate-version.ps1) passed for `1.0.2` on `2026-07-02`.
- [x] [validate-version.ps1](../../scripts/validate-version.ps1) passed for `1.0.3` on `2026-07-02`.
- [x] [validate-version.ps1](../../scripts/validate-version.ps1) passed for `1.0.4` on `2026-07-02`.
- [x] [validate-version.ps1](../../scripts/validate-version.ps1) passed for `1.0.5` on `2026-07-03`.
- [x] [build.ps1](../../scripts/build.ps1) `-Configuration Release` passed on `2026-04-19`.
- [x] [build.ps1](../../scripts/build.ps1) passed again on `2026-06-26` after the `1.0.1` metadata and release-doc alignment pass.
- [x] `dotnet build PaperBinder.sln -c Release --no-restore -p:SkipFrontendBuild=true -v minimal` passed on `2026-07-02` after the `1.0.2` release-bump alignment pass.
- [x] `dotnet build PaperBinder.sln -c Release --no-restore -p:SkipFrontendBuild=true -v minimal` passed on `2026-07-02` after the `1.0.3` release-bump alignment pass.
- [x] `dotnet build PaperBinder.sln -c Release --no-restore -p:SkipFrontendBuild=true -v minimal` passed on `2026-07-02` after the `1.0.4` release-bump alignment pass.
- [x] `dotnet build PaperBinder.sln -c Release --no-restore -p:SkipFrontendBuild=true -v minimal` passed on `2026-07-03` after the `1.0.5` release-bump alignment pass.
- [x] [test.ps1](../../scripts/test.ps1) `-Configuration Release -DockerIntegrationMode Require` passed on `2026-04-19`.
- [x] [test.ps1](../../scripts/test.ps1) passed again on `2026-06-26`; Docker-backed integration coverage remained skipped locally because Docker was unavailable.
- [x] [run-browser-e2e.ps1](../../scripts/run-browser-e2e.ps1) passed on `2026-04-19`.
- [x] [validate-docs.ps1](../../scripts/validate-docs.ps1) passed on `2026-04-19`.
- [x] [validate-docs.ps1](../../scripts/validate-docs.ps1) passed again on `2026-04-20` after the post-implementation CP17 closeout updates.
- [x] [validate-docs.ps1](../../scripts/validate-docs.ps1) passed again on `2026-06-26` after the `1.0.1` version and delivery-doc refresh.
- [x] [validate-docs.ps1](../../scripts/validate-docs.ps1) passed again on `2026-07-02` after the `1.0.2` version and delivery-doc refresh.
- [x] [validate-docs.ps1](../../scripts/validate-docs.ps1) passed again on `2026-07-02` after the `1.0.3` version and delivery-doc refresh.
- [x] [validate-docs.ps1](../../scripts/validate-docs.ps1) passed again on `2026-07-02` after the `1.0.4` version and delivery-doc refresh.
- [x] [validate-docs.ps1](../../scripts/validate-docs.ps1) passed again on `2026-07-03` after the `1.0.5` version and delivery-doc refresh.
- [x] [validate-launch-profiles.ps1](../../scripts/validate-launch-profiles.ps1) passed on `2026-04-19`.
- [x] [validate-checkpoint.ps1](../../scripts/validate-checkpoint.ps1) `-Configuration Release -DockerIntegrationMode Require` passed on `2026-04-19`.
- [x] [reviewer-full-stack.ps1](../../scripts/reviewer-full-stack.ps1) `-NoBrowser` release smoke passed on `2026-04-19`.
- [x] [validate-docs.ps1](../../scripts/validate-docs.ps1) passed on `2026-07-26` for the `T-0043` `v1.1.0` final close-out pass on branch review/v1.1.0-final (commit `58f6172`).
- [x] [build.ps1](../../scripts/build.ps1) `-Configuration Release` passed on `2026-07-26` for the `T-0043` `v1.1.0` final close-out pass — `0 Warning(s), 0 Error(s)`.
- [x] [validate-version.ps1](../../scripts/validate-version.ps1) passed for `1.1.0` on `2026-07-26` as part of the `T-0043` close-out pass.
- [x] [test.ps1](../../scripts/test.ps1) `-Configuration Release -DockerIntegrationMode Require` passed on `2026-07-26` for the `T-0043` close-out pass: `64/64` frontend, `142/142` unit, `32/32` non-Docker integration, `102/102` Docker-backed integration — all green.
- [x] [run-browser-e2e.ps1](../../scripts/run-browser-e2e.ps1) passed on `2026-07-26` for the `T-0043` close-out pass: `e2e/root-host.spec.ts` `3/3`, `e2e/tenant-host.spec.ts` `3/3`.
- [x] [reviewer-full-stack.ps1](../../scripts/reviewer-full-stack.ps1) `-NoBrowser` passed on `2026-07-26` for the `T-0043` close-out pass: `app`/`db`/`proxy`/`worker` came up healthy, health endpoints reachable, worker completed a clean lease-cleanup cycle; stack torn down afterward.
- [x] [validate-no-tracked-secrets.ps1](../../scripts/validate-no-tracked-secrets.ps1) added and passed on `2026-07-27` on branch review/v1.1.0-rc2-remediation, confirming the removed local Data Protection key material stays untracked.
- [x] [build.ps1](../../scripts/build.ps1) `-Configuration Release` passed on `2026-07-27` for the hiring-review remediation pass — `0 Warning(s), 0 Error(s)`.
- [x] [test.ps1](../../scripts/test.ps1) `-Configuration Release -DockerIntegrationMode Require` passed on `2026-07-27` for the hiring-review remediation pass: `64/64` frontend, `142/142` unit, `33/33` non-Docker integration (new security-response-headers test added), `102/102` Docker-backed integration — all green.
- [x] `dotnet list PaperBinder.sln package --vulnerable --include-transitive` and `npm audit --audit-level=moderate` re-run fresh on `2026-07-27` — see Dependency / Vulnerability Disposition below.
- [x] [validate-docs.ps1](../../scripts/validate-docs.ps1) passed on `2026-07-27` after the hiring-review remediation pass (key-material removal, security headers, archive/unarchive reviewer note, dependency-audit refresh).
- [x] `.github/workflows/release.yml` succeeded for `v1.0.1` from commit `63025570f3c259e5116a0e1064cb70cdc11721d3` on `2026-06-28`.
- [x] `.github/workflows/deploy-test.yml` succeeded for `1.0.1` from commit `63025570f3c259e5116a0e1064cb70cdc11721d3` on `2026-06-29`.
- [x] `.github/workflows/deploy-prod.yml` succeeded for `1.0.1` from commit `63025570f3c259e5116a0e1064cb70cdc11721d3` on `2026-06-29`.
- [x] `.github/workflows/release.yml` succeeded for `v1.0.2` from commit `fc7cc9878d3d84c2196e3dcdf4b61e33e48cfb1b` on `2026-07-02`.
- [x] `.github/workflows/deploy-test.yml` succeeded for `1.0.2` from commit `fc7cc9878d3d84c2196e3dcdf4b61e33e48cfb1b` on `2026-07-02`.
- [x] `.github/workflows/deploy-prod.yml` succeeded for `1.0.2` from commit `fc7cc9878d3d84c2196e3dcdf4b61e33e48cfb1b` on `2026-07-02`.
- [x] `.github/workflows/release.yml` succeeded for `v1.0.3` from commit `781bc9ce11bb60b1d89e72b0f53cf1f158241bdb` on `2026-07-02`.
- [x] `.github/workflows/release.yml` failed for `v1.0.4` from commit `39a7bcc83613d1565c60a5d44f683dbb09358f43` on `2026-07-02` in `validate-release` before image publishing because the Docker-backed trace-correlation gate asserted before the expected request activity was visible to the listener.

## Manual Verification

- [x] Reviewer walkthrough coverage is represented by the `2026-04-19` candidate-release browser suite plus the refreshed manual IDE launch verification recorded on `2026-04-20`.
- [x] VS Code manual launch verification completed and passed on `2026-04-20`.
- [x] Visual Studio manual launch verification completed and passed on `2026-04-20`.
- [x] `Launch Frontend Dev Server` is recorded explicitly as VS Code-only.
- [x] Shared-test runtime parity now reflects the deployed `1.0.2` app, worker, proxy, and database after the successful `2026-07-02` rollout.
- [x] Production runtime parity now reflects the deployed `1.0.2` app, worker, proxy, and database after the successful `2026-07-02` rollout.
- [x] GitHub Releases `v1.0.0`, `v1.0.1`, and `v1.0.2` were published by `2026-07-02`.

## Documentation Integrity

- [x] `scripts/run-root-host-e2e.ps1` remains documented as a historical compatibility shim through `V1`.
- [x] Reviewer-facing and release-facing local links resolve inside this repository only.
- [x] `docs/ai-index.md` and `docs/repo-map.json` include the CP17 release docs, task file, and release artifact.

## V1.1.0 Final Release Evidence (T-0043)

This section is the `T-0043` final staff review / release close-out evidence record. It extends the
gate list above with the v1.1.0-specific evidence `T-0043`'s acceptance criteria require; it does
not replace the historical `V1` sections above.

### PRs Merged Into `release/v1.1.0`

- [x] PR 1 baseline/review infrastructure — merged (`T-0044`, PR #45).
- [x] PR 2 engineering/security/architecture review — merged (`T-0045`, PR #46).
- [x] PR 3 product/responsive/accessibility review — merged (`T-0041`/`T-0039`, PR #47).
- [x] PR 4 RC1 independent acceptance and residual remediation — merged (PR #48).
- [x] PR 4.5 documentation canonicality / engineering-truth alignment — merged (PR #49).
- [x] PR 5 (`T-0043` close-out pass, branch review/v1.1.0-final) — merged into `release/v1.1.0` via PR #50 (commit `06e306c`).

### Findings Disposition (`T-0044` / `T-0045` / `T-0041`)

- [x] `T-0044` (release baseline): recording-only task, no remediation scope; done.
- [x] `T-0045` (engineering/security/architecture): done. Zero Critical/High findings. F1, F2, F4, F7,
  F9 fixed; F3 (archive/unarchive UI) and F5 (React Router 7→8 migration) durably deferred with
  recorded owner decisions in `docs/05-taskboard/v1-1-backlog.md`; remaining Low/Informational
  findings (F6, F8, F10–F20) tracked with no action required in this task's scope, except F20 (cheap
  follow-up, not urgent).
- [x] `T-0041` (accessibility/responsive QA): done. 11 findings (3 release-blocking, 4 medium, 4 low)
  found via live browser verification against the isolated Docker E2E stack, all fixed (none
  deferred), each independently re-verified live after landing.
- [x] Two residuals surfaced during independent RC1 verification (2026-07-25) — markdown H4–H6
  heading compression and the dashboard summary-grid `1024px`/`1023px` breakpoint overlap — were
  both resolved during Phase 4 RC remediation (commits `47fc383`, `2367507`) and confirmed resolved
  in `d33fcfc`.
- [x] No unresolved High/Critical finding remains from `T-0044`, `T-0045`, or `T-0041`.

### Dependency / Vulnerability Disposition

- [x] `dotnet list package --vulnerable --include-transitive` — re-run fresh on `2026-07-26` against
  review/v1.1.0-final: zero vulnerable packages across all 8 projects.
- [x] `dotnet list PaperBinder.sln package --vulnerable --include-transitive` — re-run fresh again on
  `2026-07-27` on branch review/v1.1.0-rc2-remediation as part of a hiring-review remediation
  pass: zero vulnerable packages across all 8 projects, unchanged.
- [x] `npm audit --audit-level=moderate` — successfully re-run fresh on `2026-07-27` from
  `src/PaperBinder.Web` (Node 24.13.1 / npm 11.8.0, matching `.nvmrc`/`package.json`), resolving the
  prior session's local gzip-decoding/network limitation recorded below. Result: **7 vulnerabilities
  (2 low, 5 high)**, unchanged from the `T-0045` disposition (`2026-07-24`). Advisory status:
  - `react-router` / `react-router-dom` (production dependency, installed `7.13.2`): the one
    release-relevant advisory. Fix is a major-version migration (7 to 8), not a patch. Durably
    deferred to its own future task per the owner decision recorded in
    `docs/05-taskboard/v1-1-backlog.md`. Manual validation performed: every `<Link to>`/`navigate()`
    call in `src/PaperBinder.Web/src` uses a static route literal or a server-returned tenant-scoped
    resource id (never raw client/URL-param input), and the app's cross-origin redirects (login,
    provisioning, logout) go through `window.location.assign()` outside react-router's navigation
    stack entirely — so the open-redirect/RSC/SSR-hydration/`__manifest`-DoS advisories in this
    range do not apply to this app's plain client-rendered-SPA usage. Future remediation: migrate to
    React Router 8.x in a dedicated task with its own validation pass.
  - `@babel/core`, `esbuild`, `postcss`, `vite`, `undici` (6 of the 7 advisories, `undici` transitive
    via the dev/build toolchain): dev-tooling-only — none are shipped in the built `dist/` output.
    Legitimate to durably defer; no production exposure.
  - Historical note (previous session, `2026-07-26`, branch review/v1.1.0-final): `npm audit` failed
    twice with `npm error audit endpoint returned an error` (local gzip decoding of the registry's
    advisories-bulk response failed) — an environment/network-layer limitation in that execution
    session, not a registry outage or a new advisory. This `2026-07-27` re-run confirms the carried-
    forward disposition was accurate.

### Version Consistency

- [x] `Directory.Build.props` (`VersionPrefix`/`AssemblyVersion`/`FileVersion`), `package.json`, and
  `package-lock.json` all agree on `1.1.0`; `validate-version.ps1` passed on `2026-07-26`.
- [x] `README.md` and `REVIEWERS.md` correctly identify the current published stable tag as
  `v1.1.0`.
- [x] Active docs record `v1.1.0` as deployed through Test and Prod.

### Documentation Synchronization

- [x] PR 4.5's docs-canonicality pass already reconciled engineering-doc claims with implementation;
  this close-out pass found no further drift during validation.

### Remaining Owner-Controlled Steps

- [x] Merge PR 5 (review/v1.1.0-final) into `release/v1.1.0` — done via PR #50 (commit `06e306c`).
- [x] Merge `release/v1.1.0` into `main` per repo convention - done via PR #52 at commit `ed40c4d`.
- [x] Create and push the `v1.1.0` SemVer tag - done; local Git verifies annotated tag `v1.1.0`
  points at `ed40c4d52a75e62c68b105102a06afb3cf354893`.
- [x] Run `.github/workflows/release.yml` for `v1.1.0` and deploy the tagged release to Test -
  owner-attested complete on `2026-07-28`.
- [x] Deploy the tagged release to Prod and complete production smoke validation - owner-attested
  complete on `2026-07-28`.
- [x] Publish or prepare the tag-driven GitHub Release per owner-controlled release workflow -
  owner-attested complete on `2026-07-28`.
- [x] Record the resulting tag, Test deploy, Prod deploy, and smoke-validation evidence back into this
  checklist - completed by this update.

## V1.1.1 Patch Release Evidence (T-0052)

This section records the `v1.1.1` patch candidate validation and final hiring assessment review. It does
not replace the historical `V1.1.0` evidence above.
The later legality audit added a release-blocking legal-readiness addendum tracked by `T-0055`; that
addendum completed on `2026-08-16`, with a follow-up public-copy and logging pass on `2026-08-17`.
Final legal wording approval, the merge to `main`, tag creation, the release workflow run, and Test/Prod deployment with smoke validation are complete; publishing the draft GitHub Release remains the
sole owner-controlled release action.

### Checkpoint Completion

- [x] `T-0046` through `T-0051` are done.
- [x] `T-0052` final validation and hiring assessment review completed on `2026-07-28`.
- [x] No new product features, API contracts, tenant-boundary changes, authorization changes, CSRF
  changes, or deployment topology changes were introduced.
- [x] The hosted flagship article route is part of the v1.1.1 public reviewer surface. Its accepted
  prose remains sourced from RC2, while the web Markdown representation, publication chrome, and
  metadata are maintained under the frontend publication contract.

### Scripted Validation

- [x] [validate-version.ps1](../../scripts/validate-version.ps1) passed for `1.1.1` on `2026-07-28`.
- [x] [build.ps1](../../scripts/build.ps1) `-Configuration Release` passed on `2026-07-28` after
  dependency remediation: Vite `7.3.6`, `0 Warning(s)`, `0 Error(s)`.
- [x] [test.ps1](../../scripts/test.ps1) `-Configuration Release -DockerIntegrationMode Require`
  passed on `2026-07-28` after dependency remediation: `65/65` frontend, `142/142` unit, `33/33`
  non-Docker integration, `102/102` Docker-backed integration.
- [x] [run-browser-e2e.ps1](../../scripts/run-browser-e2e.ps1) passed on `2026-07-28` after
  dependency remediation: root-host `3/3`, tenant-host `3/3`.
- [x] [validate-docs.ps1](../../scripts/validate-docs.ps1) passed on `2026-07-28` after
  release-doc updates.
- [x] [validate-launch-profiles.ps1](../../scripts/validate-launch-profiles.ps1) passed on
  `2026-07-28`.
- [x] [reviewer-full-stack.ps1](../../scripts/reviewer-full-stack.ps1) `-NoBrowser` passed on
  `2026-07-28` after dependency remediation and release-doc updates.

### Hiring Assessment Review

- [x] Final review artifact:
  [docs/archive/v1-1/remediation/engineering-quality/t-0052-final-hiring-assessment-review.md](../archive/v1-1/remediation/engineering-quality/t-0052-final-hiring-assessment-review.md).
- [x] Finding F1 fixed: tenant-shell version-display test now derives expected text from
  `package.json` instead of hard-coding `v1.1.0`.
- [x] Finding F2 fixed: same-major `npm audit fix` remediation updated frontend lockfile
  dependencies, reducing `npm audit --audit-level=moderate` from 7 advisories to 2.
- [x] Finding F3 explicitly rejected as not applicable to the shipped runtime mode: the remaining
  React Router advisory is RSC-mode specific, while PaperBinder is a client-rendered SPA and does
  not use React Router RSC mode, framework actions, SSR, or document request action handling.
- [x] Finding F4 fixed: release-facing docs now distinguish the `v1.1.1` release-ready candidate
  from the currently published `v1.1.0` stable tag.

### Dependency / Vulnerability Disposition

- [x] `dotnet list PaperBinder.sln package --vulnerable --include-transitive` passed on
  `2026-07-28`: zero vulnerable NuGet packages across all 8 projects.
- [x] `npm.cmd audit --audit-level=moderate` passed on `2026-08-16`: zero vulnerabilities after
  same-major/patch remediation for `nanoid`, `react-router`, and `react-router-dom`.

### Owner-Controlled Steps

- [x] Complete `T-0055` legal-readiness addendum - completed on `2026-08-16`.
- [x] Merge the `v1.1.1` candidate branch to the release target - merged via
  [PR #54](https://github.com/daniel-maratta/paper-binder/pull/54), merge commit
  `89ad4aa891d733265c42429d2954b625cd70257d`, on `2026-08-17T22:04:39Z`. A documentation-only
  follow-up recording that merge landed via
  [PR #55](https://github.com/daniel-maratta/paper-binder/pull/55), merge commit
  `3ce64c6f44eee45bbb4419c22b198a04bc634711`, on `2026-08-17T22:18:45Z`.
- [x] Create and push the `v1.1.1` SemVer tag - an initial tag at commit `3ce64c6` was pushed on
  `2026-08-17` but its `release.yml` run
  ([32075491068](https://github.com/daniel-maratta/paper-binder/actions/runs/32075491068)) failed
  at the Browser E2E step: `e2e/root-host.spec.ts` still asserted the Cookie Notice page's original
  `Current posture` heading after commit `1c908f6` renamed it to `Cookie use` the same day, so no
  images were published and no release was created from that tag. Fixed via
  [PR #56](https://github.com/daniel-maratta/paper-binder/pull/56), merge commit
  `256829103bac573b3c3e17e301fcf7e59171250d`, on `2026-08-18T04:31:35Z` (verified locally first:
  `run-browser-e2e.ps1` root-host `5/5` passing). The `v1.1.1` tag was deleted and recreated
  pointing at `2568291`, and CHANGELOG.md records the stale-assertion fix under `v1.1.1`.
- [x] Run the tag-driven release workflow - the recreated tag's `release.yml` run
  ([32099838508](https://github.com/daniel-maratta/paper-binder/actions/runs/32099838508)) passed
  in full on `2026-08-18T04:37:42Z`: `validate-release` (build, repo tests, browser E2E, docs,
  launch profiles, checkpoint bundle) succeeded, all five images
  (`paperbinder-api`, `paperbinder-api-test`, `paperbinder-worker`, `paperbinder-migrations`,
  `paperbinder-proxy`) published to GHCR tagged `1.1.1`/`v1.1.1`/`latest`, and a **draft** GitHub
  Release "PaperBinder v1.1.1" was created at
  [github.com/daniel-maratta/paper-binder/releases/tag/v1.1.1](https://github.com/daniel-maratta/paper-binder/releases/tag/v1.1.1).
- [x] Run `deploy-test.yml` for `v1.1.1` - a first attempt
  ([32101650509](https://github.com/daniel-maratta/paper-binder/actions/runs/32101650509)) failed
  at the `Deploy release` step: the `deploy_path` workflow input was corrupted by MSYS/Git-Bash
  path conversion in the invoking local shell (`/opt/paperbinder` became
  `C:/Program Files/Git/opt/paperbinder`), so `proxy` failed to recreate on an invalid Caddyfile
  bind-mount path after `db`, `migrations`, `worker`, and `app` had already recreated successfully
  on the real `1.1.1` images. This was a local tooling issue, not a codebase or pipeline defect, so
  no CHANGELOG entry was added. Re-run with MSYS path conversion disabled
  ([32101782918](https://github.com/daniel-maratta/paper-binder/actions/runs/32101782918)) passed
  in full on `2026-08-18T05:09:16Z`: all containers (including `proxy`, picking up the new logging
  driver) recreated on the `1.1.1` images, migrations ran cleanly, and the workflow's own smoke
  check passed against the live `/health/live` and `/health/ready` endpoints on the Test droplet.
  `v1.1.1` is confirmed running on Test.
- [x] Run `deploy-prod.yml` for `v1.1.1` and complete production smoke validation - run
  [32102278515](https://github.com/daniel-maratta/paper-binder/actions/runs/32102278515) passed in
  full on `2026-08-18T05:16:57Z`: `db`, `migrations`, `worker`, `app`, and `proxy` (picking up the
  new logging driver) all recreated on the `1.1.1` images against
  `https://paperbinder.danielmaratta.com`, migrations ran cleanly, and the workflow's own live smoke
  check passed both `/health/live` (attempt 2/12, a normal transient blip during container restart)
  and `/health/ready` (attempt 1/24), confirmed directly via `gh run view --log`. `v1.1.1` is
  confirmed running in Prod.
- [ ] Publish the draft GitHub Release at
  [github.com/daniel-maratta/paper-binder/releases/tag/v1.1.1](https://github.com/daniel-maratta/paper-binder/releases/tag/v1.1.1)
  (`isDraft: true` as of this update). This is the sole remaining owner-controlled release action.

### Legal Readiness Addendum

- [x] `T-0055` completed on `2026-08-16`.
- [x] Follow-up legal surface audit, AI wording-shape pass, public-copy remediation, and Docker
  logging remediation were completed on `2026-08-17`.
- [x] Public legal pages are reachable at `/legal`, `/privacy`, `/terms`, and `/cookies`.
- [x] Public and tenant footers expose Legal, Privacy Policy, Terms of Use, and Cookie Notice links.
- [x] Public legal pages use `August 17, 2026` as the effective date.
- [x] Legal, privacy, cookie, copyright, and security contact paths use the configured
  `paperbinder@danielmaratta.com` alias.
- [x] Point-of-collection warnings tell users not to submit sensitive, regulated, confidential,
  proprietary, personal, medical, financial, credential, or important real business information.
- [x] Children-under-13 wording is present in the public Legal, Privacy Policy, and Terms of Use
  surfaces.
- [x] Legal documents are frontmatter-backed Markdown content in a dedicated legal collection.
- [x] Public legal copy no longer exposes draft, owner-approval, or audit-process wording such as
  `Static review for this release`; `scripts/validate-docs.ps1` now guards against those phrases in
  public legal Markdown.
- [x] Retention/provider wording avoids fixed-minute deletion promises and keeps provider
  snapshot/backup and external OTLP retention wording general unless owner/provider facts are
  later verified.
- [x] Repo-owned Compose files bound container stdout/stderr retention through Docker's `local`
  logging driver with `max-size=10m` and `max-file=5`; deployed containers must be recreated before
  the logging-driver change applies.
- [x] The Cookie Notice remains informational disclosure only for the current strictly necessary
  cookie posture; no consent-management platform or cookie banner was added.
- [x] `NOTICE.md`, `THIRD-PARTY-NOTICES.md`, and `SECURITY.md` cover asset provenance,
  dependency notices, vulnerability reporting, and dependency/security maintenance posture.
- [x] `npm.cmd audit --audit-level=moderate` passed on `2026-08-16`: zero vulnerabilities after
  same-major/patch remediation for `nanoid`, `react-router`, and `react-router-dom`.
- [x] [build.ps1](../../scripts/build.ps1) `-Configuration Release` passed on `2026-08-16`;
  the prior `NU1903` warning for transitive `SSH.NET` was remediated by a test-only
  `SSH.NET 2026.0.0` override in `tests/PaperBinder.IntegrationTests`.
- [x] `dotnet list tests/PaperBinder.IntegrationTests/PaperBinder.IntegrationTests.csproj package --vulnerable --include-transitive`
  passed on `2026-08-16`: no vulnerable packages after the `SSH.NET` override.
- [x] [test.ps1](../../scripts/test.ps1) `-Configuration Release -DockerIntegrationMode Require`
  passed on `2026-08-16`: frontend `70/70`, unit `143/143`, non-Docker integration `34/34`,
  Docker-backed integration `103/103`.
- [x] [run-browser-e2e.ps1](../../scripts/run-browser-e2e.ps1) passed on `2026-08-16`:
  root-host `5/5`, tenant-host `3/3`, including public legal page reachability from the root-host
  footer.
- [x] [validate-docs.ps1](../../scripts/validate-docs.ps1) passed on `2026-08-16`.
- [x] `npm.cmd run third-party-notices:check` passed on `2026-08-16`.
- [x] Set final public legal-document effective dates during deployment and approve the final
  wording for publication - all four public legal documents (`legal-index.md`, `privacy.md`,
  `terms.md`, `cookies.md`) carry the concrete, non-placeholder effective date `August 17, 2026`
  with no draft/audit-process wording remaining, and the owner (Daniel Maratta) explicitly approved
  the final wording for publication on `2026-08-17`.

## Release Readiness

- Release line: `V1`
- Historical first stable tag: `v1.0.0`
- Current release tag: `v1.1.1`
- Current release SemVer metadata: `1.1.1`
- Prior published stable tag: `v1.1.0`
- Prior published stable SemVer version: `1.1.0`
- Active branch SemVer metadata: `1.1.1`
- Status: `main` was aligned and taggable for `v1.0.5` as of `2026-07-03`. `release/v1.1.0`
  completed `T-0043` final-review validation on `2026-07-26` — findings resolved, full
  scripted and browser validation green, version metadata consistent, no unresolved High/Critical
  findings — and PR 5 (review/v1.1.0-final) has since merged into `release/v1.1.0` via PR #50
  (commit `06e306c`). The owner declared `T-0043` done on `2026-07-28`. `release/v1.1.0` has since
  merged to `main` via PR #52 at commit `ed40c4d`, and annotated tag `v1.1.0` points at the same
  commit. The owner attests that the tagged release has deployed through Test and Prod and that
  production smoke validation is complete.
- Executor attestation: `main`, `CHANGELOG.md`, repo version metadata, and current-state delivery
  docs were aligned for `v1.0.5` at that release cut; `release/v1.1.0` now carries validated `1.1.0`
  metadata, the completed `T-0043` pass records the final pre-tag release attestation, and this
  update records the owner-attested merge/tag/Test-deploy/Prod-deploy/smoke evidence.
- Deferred follow-up note: the React Router major-version upgrade remains tracked as `T-0053` for
  future minor-version maintenance, but the current same-major/patch audit remediation leaves
  `npm audit --audit-level=moderate` at zero vulnerabilities for this release.
- Owner-controlled actions outside `T-0043`: merge-to-`main`, tag creation, release workflow, Test
  deployment, Prod deployment, production smoke validation, and release publication are recorded
  above as complete. No follow-up docs-only checklist PR is expected.
- V1.1.1 readiness update: the `v1.1.1` patch candidate completed final validation and hiring
  assessment review on `2026-07-28`, and the `T-0055` legal-readiness addendum completed on
  `2026-08-16`. Version metadata is consistent, build/test/browser/docs/launch and reviewer-stack
  gates are green or recorded with final rerun evidence in `T-0052` and `T-0055`; `npm audit` now
  reports zero vulnerabilities after same-major/patch remediation for `nanoid`, `react-router`, and
  `react-router-dom`, and the prior test-tooling `SSH.NET` vulnerability warning is remediated by a
  test-only `SSH.NET 2026.0.0` override. Final legal effective-date selection, the merge to `main`,
  tag creation, the tag-driven release workflow run, and Test/Prod deployment with smoke validation
  are complete; publishing the draft GitHub Release remains the sole owner-controlled action.
- V1.1.1 executor attestation: `CHANGELOG.md`, repo version metadata, current-state delivery docs,
  and the taskboard are aligned for `v1.1.1` release readiness. The merge to `main` (PR #54, commit
  `89ad4aa`, 2026-08-17), tag creation (`v1.1.1` at commit `2568291`, 2026-08-18, after deleting and
  recreating the initial tag to include the `e2e/root-host.spec.ts` fix in PR #56), the
  `release.yml` run ([32099838508](https://github.com/daniel-maratta/paper-binder/actions/runs/32099838508),
  success), and the `deploy-test.yml` run
  ([32101782918](https://github.com/daniel-maratta/paper-binder/actions/runs/32101782918), success,
  including a passing live smoke check), and the `deploy-prod.yml` run
  ([32102278515](https://github.com/daniel-maratta/paper-binder/actions/runs/32102278515), success,
  including a passing live smoke check against `https://paperbinder.danielmaratta.com`) are recorded
  above as complete. Only publishing the draft GitHub Release remains a separate follow-up action
  and is not claimed by this checklist update.
- V1.1.1 carry-forward attestation: `T-0053` tracks the React Router major-version upgrade, and
  `T-0054` tracks overall API shape and over-ceremony remediation as future minor-version work.
- V1.1.1 current-release attestation (`2026-08-17`): `v1.1.1` is the canonical, current PaperBinder
  release. `T-0055` recorded `main` as taggable, and `CHANGELOG.md`, `README.md`, `REVIEWERS.md`,
  `docs/95-delivery/staging-and-versioning.md`, `docs/95-delivery/release-workflow.md`, and
  `docs/00-intent/canonical-decisions.md` now describe `v1.1.1` as current rather than as a
  candidate pending against `v1.1.0`.
- V1.1.1 merge attestation (`2026-08-17`): `release/v1.1.1` merged into `main` via
  [PR #54](https://github.com/daniel-maratta/paper-binder/pull/54), merge commit
  `89ad4aa891d733265c42429d2954b625cd70257d`, at `2026-08-17T22:04:39Z`, verified directly against
  `origin/main` via `git fetch` and `gh pr view`.
- V1.1.1 tag and release-workflow attestation (`2026-08-18`): the `v1.1.1` tag was pushed twice.
  The first push (commit `3ce64c6`, `2026-08-17`) triggered
  [release.yml run 32075491068](https://github.com/daniel-maratta/paper-binder/actions/runs/32075491068),
  which **failed** at Browser E2E because `e2e/root-host.spec.ts` still asserted the Cookie Notice
  page's pre-rename `Current posture` heading; no images were published and no release was created
  from it. The stale assertion was fixed and verified locally (`run-browser-e2e.ps1` root-host
  `5/5`) via [PR #56](https://github.com/daniel-maratta/paper-binder/pull/56), merge commit
  `256829103bac573b3c3e17e301fcf7e59171250d`, `2026-08-18T04:31:35Z`. The `v1.1.1` tag was then
  deleted and recreated at commit `2568291`, triggering
  [release.yml run 32099838508](https://github.com/daniel-maratta/paper-binder/actions/runs/32099838508),
  which **passed** in full on `2026-08-18T04:37:42Z` — all five GHCR images published
  (`paperbinder-api`, `paperbinder-api-test`, `paperbinder-worker`, `paperbinder-migrations`,
  `paperbinder-proxy`) and a draft GitHub Release created at
  [github.com/daniel-maratta/paper-binder/releases/tag/v1.1.1](https://github.com/daniel-maratta/paper-binder/releases/tag/v1.1.1),
  confirmed directly via `gh run view` and `gh release view`.
- V1.1.1 Test-deploy attestation (`2026-08-18`): `deploy-test.yml` was run twice for `v1.1.1`. The
  first run ([32101650509](https://github.com/daniel-maratta/paper-binder/actions/runs/32101650509))
  failed at the `Deploy release` step because the `deploy_path` input was corrupted by MSYS/Git-Bash
  path conversion in the invoking local shell, not by any codebase or pipeline defect; `db`,
  `migrations`, `worker`, and `app` had already recreated successfully on the real `1.1.1` images
  before `proxy` failed on the resulting invalid Caddyfile bind-mount path. Re-run with MSYS path
  conversion disabled
  ([32101782918](https://github.com/daniel-maratta/paper-binder/actions/runs/32101782918)) passed
  in full, including the workflow's own live smoke check against `/health/live` and `/health/ready`
  on the Test droplet, confirmed directly via `gh run view`. `v1.1.1` is confirmed deployed on Test.
- V1.1.1 Prod-deploy attestation (`2026-08-18`): `deploy-prod.yml` run
  [32102278515](https://github.com/daniel-maratta/paper-binder/actions/runs/32102278515) passed in
  full on the first attempt: `db`, `migrations`, `worker`, `app`, and `proxy` (picking up the new
  logging driver) all recreated on the `1.1.1` images, and the workflow's own live smoke check
  passed both `/health/live` (attempt 2/12) and `/health/ready` (attempt 1/24) against
  `https://paperbinder.danielmaratta.com`, confirmed directly via `gh run view --log`. `v1.1.1` is
  confirmed deployed in Prod.
- V1.1.1 remaining-gap attestation (`2026-08-18`): publishing the draft GitHub Release
  (`isDraft: true` as of this update, confirmed via `gh release view`) has not happened yet and is
  not claimed here — it is the sole remaining owner-controlled action.
- Mirrors:
  - `docs/archive/v1/checkpoints/pr/cp17-release-preparation-and-reviewer-snapshot/description.md`
  - `docs/archive/v1/checkpoints/checkpoint-status.md`
