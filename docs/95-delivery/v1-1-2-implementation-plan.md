# V1.1.2 Positioning Patch Implementation Plan

Status: Review Ready
Target release: `v1.1.2` candidate
Authority: This file defines the checkpoint and validation plan for the `v1.1.2` positioning patch. The matching taskboard source is `docs/05-taskboard/v1-1-2-backlog.md`.

## Purpose

Ship a narrow patch that improves first-time comprehension and public discovery without expanding PaperBinder's product, security, tenant, or deployment scope.

The patch follows the same canonical PaperBinder workflow described by the flagship article: define outcome and constraints, execute scoped behavior slices, validate with repo-native gates, review, remediate only scoped findings, independently verify, and record release readiness before owner-controlled release actions.

## Scope

Included:

- Plain-English homepage explanation of what PaperBinder is.
- Concise concrete use cases for controlled organizational documents.
- Homepage explanation of why PaperBinder exists as a deliberately scoped engineering demonstration.
- Direct homepage path to the flagship article.
- Accessible mobile and narrow-tablet public navigation for the same Product, Demo, and About
  destinations exposed on desktop.
- Short public/root-host pages, including unsupported routes such as `/app`, visually terminate
  without orphaned decorative artwork.
- Lightweight orientation on the first tenant dashboard after entering the demo.
- Public footer attribution link from `Daniel Maratta` to `https://danielmaratta.com`.
- GoatCounter event coverage for new or modified public CTAs through the existing abstraction.
- Browser-facing public repository/history links and the hosted article current-artifact label.
- `1.1.2` version metadata and proportional release/documentation updates.

Out of scope:

- Product-feature expansion.
- Homepage or app redesign.
- New route architecture.
- New onboarding framework or persisted onboarding state.
- Authentication, authorization, tenancy, lease, cleanup, API, or deployment behavior changes.
- New analytics provider, cookies, consent surface, or PII/high-cardinality tracking.
- Dependency upgrades unless a validation gate proves they are required.

## Checkpoints And Commit Shape

| Checkpoint | Task | Scope | Intended commit |
| --- | --- | --- | --- |
| CP1 | `T-0056` | Scope-lock, TDD-driven positioning implementation, analytics coverage, version/docs update, validation, and release-readiness evidence for the `v1.1.2` patch. | `feat(public): Improve PaperBinder positioning and article discovery` |

If implementation produces more than one reviewable commit, split by cohesive intent:

| Commit | Scope |
| --- | --- |
| `docs(taskboard): Plan v1.1.2 positioning patch` | Planning artifacts only. |
| `feat(public): Clarify homepage and demo orientation` | Public homepage, dashboard orientation, footer attribution, and behavior tests. |
| `chore(release): Stage v1.1.2 metadata and evidence` | Version metadata, changelog, delivery docs, and final validation evidence. |

Do not split into broad refactor commits. If a discovered issue belongs outside this patch, record it as a carry-forward rather than absorbing it.

## Behavior Slices

1. Homepage product comprehension.
   - Add one focused failing root-host test before copy changes.
   - Assert durable concepts and CTAs, not full prose or CSS structure.
2. Homepage article discovery.
   - Add one focused failing root-host test proving the homepage has a visible route to `flagshipArticle.path` with analytics instrumentation.
3. Tenant dashboard orientation.
   - Add one focused failing tenant-shell/dashboard test proving new guests get workspace/binder/document context and a useful first action.
4. Footer attribution link.
   - Add one focused failing root-host test proving the footer author attribution links to `productIdentity.authorUrl` with existing external-link conventions and analytics coverage.
5. GoatCounter coverage.
   - Add or adjust focused analytics tests only for new stable public event names or regression-prone coverage.
   - Preserve namespaced low-cardinality synthetic events and direct `/count` requests.
6. Version and release metadata.
   - Use `scripts/validate-version.ps1` as the guard.
   - Do not describe `v1.1.2` as current stable until release close-out records the taggable state.

## Validation Gates

Focused gates during implementation:

- `powershell -ExecutionPolicy Bypass -File .\scripts\test-frontend.ps1 -TestPath src/app/root-host.test.tsx`
- `powershell -ExecutionPolicy Bypass -File .\scripts\test-frontend.ps1 -TestPath src/app/tenant-shell.test.tsx`
- `powershell -ExecutionPolicy Bypass -File .\scripts\test-frontend.ps1 -TestPath src/analytics/goatcounter.test.ts`

Candidate close-out gates:

- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-version.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\build.ps1 -Configuration Release`
- `powershell -ExecutionPolicy Bypass -File .\scripts\test.ps1 -Configuration Release -DockerIntegrationMode Require`
- `powershell -ExecutionPolicy Bypass -File .\scripts\run-browser-e2e.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-docs.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\validate-launch-profiles.ps1`
- `powershell -ExecutionPolicy Bypass -File .\scripts\reviewer-full-stack.ps1 -NoBrowser`
- `git diff --check`

Manual rendered review is required before declaring the task done:

- Desktop and mobile homepage.
- Desktop and mobile first tenant dashboard.
- Article CTA path from homepage.
- Footer attribution link.
- GoatCounter event coverage audit for every new or modified public interaction.

## Release Boundary

`v1.1.2` remains a patch candidate after final validation and release-readiness evidence are recorded. PR review, merge, tag creation, release workflow execution, Test/Prod deployment, smoke validation, and GitHub Release publication remain owner-controlled actions under the existing release workflow.
