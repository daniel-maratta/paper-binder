# ADR-0013: V1.1 Presentation Direction And Canon Reset

Status: Approved

## Date / Scope

- Date: 2026-07-06
- Scope: Repo-level presentation, UI, UX, copy, and information-architecture direction for the next post-`v1.0.5` refinement phase

## Canon Precedence

Active direction for this phase is defined by current approved intent/product/ADR documentation, with `docs/10-product/presentation-contract-v1-1.md` as the controlling presentation canon for this phase.

Historical release artifacts, checkpoint-era delivery materials, and exploratory design documents are informative inputs only unless a later approved canonical document explicitly adopts or restates part of them.

## Decision

PaperBinder will treat the next substantial presentation/UI/UX/copy/IA refinement pass as a `v1.1.0` presentation-direction upgrade unless stronger repo-grounded evidence later requires a major-version interpretation.

This decision establishes the following policy:

1. `CP17` is primarily a historical `V1` release artifact.
   It remains useful for release-history facts and archived reviewer-snapshot context.
   It is not the primary controlling canon for the next presentation phase unless a later approved canonical document explicitly reuses one of its constraints.

2. The repo's ongoing reviewer-support posture is defined by current and future approved canon, not by `CP17` itself.
   `CP17` records how `V1` was packaged and presented at release time; it does not govern the next active presentation direction by default.

3. The public product path will be product-presented and reviewer-supported.
   The main site experience should present PaperBinder as real, production-worthy software within its actual constrained scope.
   It should not read like checkpoint-era reviewer narration, and it should not pretend to be a fully commercialized SaaS business.

4. Reviewer depth belongs primarily in repo documentation and future articles, not in the main product UI.
   The default posture remains doc-first reviewer evidence.
   The main site experience is not the primary repository of reviewer evidence.
   No separate reviewer microsite is introduced by this decision.

5. The orange presentation system is retired for forward work.
   The next presentation direction uses the darker blue-neutral slate-style visual system described by the current redesign exploration.
   This is a wholesale replacement of the old orange-accent presentation direction, not a partial theme tweak.

6. The redesign packet under `docs/temp-ui-ux-design-docs/` is exploratory input only.
   It is not canonical product or implementation authority as-is.
   It may inform the next canonical contract, but it does not become canon by proximity.

7. The canonical presentation contract for this phase is `docs/10-product/presentation-contract-v1-1.md`.
   It supersedes the existing V1 visual/copy presentation canon for forward planning.
   Current V1 presentation docs still describe the shipped V1 surface, but they do not control forward `v1.1.0` presentation planning.

## Rationale

The current repo contains two conflicting truths:

- The shipped V1 presentation canon is explicit, implemented, and test-coupled.
- The redesign packet correctly identifies weaknesses in that canon, especially the reviewer-heavy root-host framing, the overexposed implementation language, and the now-obsolete orange visual direction.

Treating the redesign packet as immediate canon would create ambiguity and document drift.
Treating the old V1 presentation docs as permanently controlling would block a repo-approved presentation reset that the current product state now supports.

`v1.1.0` is the correct policy target because the expected work is presentation-significant but not, by itself, product-domain or architecture redefining.
No current evidence requires a `v2.0.0` boundary.

This decision also preserves an important repo posture:
reviewer evidence remains a strength, but it should live primarily in the documentation layer rather than dominate the main site experience.

## Consequences

- Existing V1 presentation docs that lock the orange system, the old public-path copy posture, or the old reviewer-forward framing are historical shipped-reference canon for the implemented V1 surface.
- Those V1 presentation docs remain valid descriptions of the shipped V1 surface, but they are not the controlling target for forward `v1.1.0` presentation planning.
- The next implementation phase must distinguish clearly between:
  - shipped V1 historical artifacts
  - active forward canon for `v1.1.0`
  - exploratory design input
- Public-path copy and layout decisions must stay within shipped product truth.
  Presentation may become more product-like and more credible, but it must not imply capabilities that V1 does not ship.
- Reviewer support remains a repo responsibility, but the default support layer is docs and articles, not primary in-app narration.
- No route, component, copy, or test updates are authorized by this decision alone.
  Those belong to a later approved implementation-planning phase.

## Out Of Scope

This decision does not approve or introduce:

- new end-user capabilities
- collaboration features
- audit-reporting UI
- document version history
- document preview pipelines beyond the shipped product contract
- architecture changes
- auth or tenancy changes
- API contract changes
- a separate reviewer microsite
- a detailed migration plan
- direct code or documentation edits

## Follow-On Actions

1. Identify which current V1 presentation docs remain historical shipped-surface references and which broader product docs are narrowed by the approved contract.

2. Reconcile the approved presentation contract with:
   - PRD and scope language
   - canonical intent docs
   - reviewer docs
   - route/copy/test seams that currently encode the old presentation canon
   - documentation navigation metadata

3. Produce a repo-specific adoption and implementation plan under the approved canon.

## Boundary Notes

The forward presentation direction may describe PaperBinder as a secure, role-aware, multi-tenant document workspace, but it must not imply unshipped depth such as:

- collaboration workflows
- audit exploration/reporting
- document version history
- richer content-preview capabilities than the shipped read-only document detail
- mature commercial-product scale or operating posture

Any future proposal that needs those claims must change product scope explicitly rather than implying them through presentation language.
