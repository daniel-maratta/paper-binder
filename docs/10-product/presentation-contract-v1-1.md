# Presentation Contract - V1.1

Status: Approved
Scope: Presentation canon for the V1.1 product-led public and authenticated shell
Authority: `ADR-0013`

This is the approved presentation canon for the `v1.1.0` phase. Earlier V1 presentation docs remain available as historical shipped-surface references, but they do not control the current V1.1 presentation surface.

## Purpose

This contract defines the controlling presentation direction for the `v1.1.0` phase.

It exists to replace the old V1 visual/copy presentation direction for forward planning while staying within shipped V1 product truth, PRD scope, and existing architectural boundaries.

This contract sets presentation policy. It is not an implementation plan.

## Supersession

This contract supersedes the presentation-direction portions of:

- `docs/10-product/ui-ux-contract-v1.md`
- `docs/10-product/ui-style.md`

It narrows the presentation-facing interpretation of:

- `docs/10-product/information-architecture.md`
- `docs/10-product/component-specification-v1.md`

Historical V1 presentation docs remain useful for understanding the pre-V1.1 surface, but they do not control current V1.1 presentation decisions.

## 1. Public-Path Framing

PaperBinder must be presented on the public path as real, production-worthy software within its actual constrained scope.

The public experience must be:

- product-presented
- honest about scope
- credible and calm
- oriented toward visible product proof

The public experience must not be:

- a checkpoint-era reviewer walkthrough
- a startup-marketing fiction
- an architecture lecture
- a claims surface for unshipped depth

The primary public story is:

- PaperBinder is a constrained, role-aware, multi-tenant document workspace demo
- binders and documents are the core product objects
- access is role-aware and tenant-isolated
- a live disposable demo exists
- deeper technical evidence exists in repo documentation

## 2. Reviewer-Support Posture

Reviewer support remains an explicit repo concern, but the main site experience is not the primary repository of reviewer evidence.

Reviewer evidence belongs primarily in:

- canonical repo docs
- reviewer-oriented repo docs
- future articles or equivalent written material

The product UI may link to supporting context where appropriate, including from unauthenticated public routes, but it must not carry the main burden of explaining architecture, checkpoint history, release packaging, or implementation mechanics.

No separate reviewer microsite is introduced by this contract.

## 3. Visual Direction And Token Intent

The orange presentation system is retired wholesale for forward work.

The approved visual direction for `v1.1.0` is a darker blue-neutral slate-style system with:

- cool neutrals
- dark blue primary emphasis
- restrained accents
- calmer, more product-grade contrast
- clearer visual hierarchy than the shipped V1 surface

Token intent must be semantic rather than brand-slogan-driven. The forward system should define intent categories such as:

- canvas/background
- surface/subtle surface
- border/subtle border
- strong text/muted text
- primary action
- secondary action
- status states

Exact token names and values are implementation-planning work, not part of this contract.

Policy constraints:

- orange is no longer the primary interactive accent
- public and authenticated surfaces may differ in tone, but must remain part of one coherent system
- visual polish must support product credibility, not visual novelty
- metadata and diagnostic chrome must no longer dominate primary product surfaces

## 4. Information Architecture Direction

The public-path IA must become product-led rather than onboarding-led.

The forward IA policy is:

- show the product story before deep implementation framing
- keep the live demo path clear and prominent
- keep honest scope/context available without making it the first impression
- avoid exposing reviewer or checkpoint terminology as primary navigation structure

The tenant-host product structure remains grounded in shipped V1 truth:

- dashboard
- binders
- binder detail
- document detail
- tenant users
- lease/session states

This contract does not approve exact route names or route moves.
It defines IA direction only.

The root-host / tenant-host architecture model remains part of shipped V1 truth, but its internal terminology should be demoted on the public path unless needed for an actual user decision.

## 5. Copy Rules

Public and product copy must use product language first and systems language second.

Preferred copy posture:

- concise
- product-oriented
- honest
- specific
- non-theatrical

Public copy should emphasize concepts such as:

- workspace
- binder
- document
- access
- isolated tenant
- live demo

Public copy should avoid foregrounding terms such as:

- checkpoint
- root-host onboarding
- tenant-host routing mechanics
- server-authoritative redirect
- shared API client
- canonical route contract

Those concepts may remain in technical docs and reviewer material where they are actually useful.

Additional copy rules:

- do not invent customers, testimonials, logos, usage numbers, or enterprise claims
- do not describe PaperBinder as a complete commercial platform
- do not use architecture narration as hero copy
- do not turn routine product surfaces into reviewer commentary panels
- keep helper text task-specific rather than contract-explanatory where possible

## 6. Product-Proof Policy

Screenshots, workflow visuals, and other product-proof surfaces must reflect shipped product truth and must not stage unimplemented capability.

Presentation may use screenshots, crops, or workflow-oriented proof devices, but those surfaces must remain truthful to the shipped product and its currently supported states.

Placeholder product-image shells were acceptable during implementation. Current public-facing proof surfaces must use captures from the finished authenticated product surface.

## 7. Forbidden Implication Rules

Presentation work must not imply shipped capabilities that V1 does not actually provide.

Forbidden implication areas include:

- collaboration workflows or shared editing
- audit history, audit browsing, or change-tracking depth
- document version history
- richer preview or rendering capability than the current shipped read-only document surface
- external sharing or public-link behavior
- broader commercial maturity than the repo truth supports
- active production-customer posture
- compliance, governance, or operational guarantees not actually documented and supported

The following kinds of phrases require special care and are disallowed unless later canon and implementation make them true:

- `collaboration`
- `history`
- `what changed`
- `activity trail`
- `versioning`
- `document preview`
- `review workflow` when it implies more than current product truth

Any implementation that materially rewrites public or authenticated copy must include a deliberate final pass against these forbidden-implication rules before it is considered complete.

## 8. Non-Goals

This contract does not approve:

- new product features
- new architecture
- new API behavior
- new tenancy behavior
- new reviewer microsite structure
- implementation-specific route refactors
- implementation-specific component plans
- final token values
- a migration sequence
- code changes by implication

## 9. Forward Planning Boundary

Implementation planning that follows this contract must reconcile the new direction with:

- PRD and scope constraints
- historical V1 shipped behavior
- route and copy seams in the current SPA
- test and snapshot coupling
- doc-index and canon-propagation requirements

That later planning must remain explicit about what is:

- active canon
- historical shipped reference
- exploratory design input
- implementation detail

## 10. Acceptance Boundary For Future Work

Future implementation planning under this contract must preserve these truths:

- PaperBinder remains a constrained multi-tenant demo artifact
- the product can be presented more credibly without pretending to be something larger than it is
- reviewer evidence remains primarily doc-based
- the new blue-neutral system replaces the old orange system wholesale
- presentation may improve, but truthfulness and scope discipline remain mandatory
