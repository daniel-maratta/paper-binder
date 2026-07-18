# T-0037 Copy Strategy

Status: Active working guidance
Date: 2026-07-17
Scope: Final copy cleanup for the `v1.1` public and authenticated surfaces

## Purpose

This document defines how to address remaining AI-smell and implementation-heavy copy across the current PaperBinder app surface.

It is a working guide for the `T-0037` controlled copy pass.
It does not approve new product scope, new behavior, or new claims.

## Source Constraints

This strategy must stay inside current repo truth, especially:

- `docs/10-product/presentation-contract-v1-1.md`
- `docs/10-product/prd.md`
- `docs/00-intent/project-scope.md`
- `docs/00-intent/non-goals.md`
- `docs/10-product/domain-nouns.md`

## Copy Goals

App copy should be:

- product-oriented
- factual
- straightforward
- calm
- consistent
- demo-aware without sounding apologetic

App copy should not:

- sound like AI-polished generic product prose
- read like reviewer notes or architecture narration
- explain implementation mechanics during normal product use
- imply unshipped capability, commercial maturity, or broader scope than PaperBinder actually has

## Voice

Use one primary voice across public and authenticated surfaces:

- direct
- restrained
- useful
- specific

Preferred tone:

- clear over clever
- concrete over abstract
- task-first over commentary-first
- confident without marketing language

Avoid:

- theatrical phrasing
- oppositional phrasing
- inflated language
- defensive over-explanation

## Three Copy Modes

Not every surface should sound the same.
Use these three modes deliberately.

### 1. Product Mode

Use for most page titles, intros, helper text, and CTA labels.

Primary questions:

- what is this page
- what can I do here
- what happens next

Examples:

- `Start a live demo workspace`
- `Create and open the binders available in this workspace`
- `Manage users, roles, and view-as access from one page`

### 2. Demo Mode

Use only where the demo nature materially matters.

This should be stated in a few intentional places, not repeated everywhere.

Good placements:

- landing/supporting public copy
- `Start Demo` intro
- `/about`
- lease and expiry surfaces
- one small authenticated-shell indicator if needed

Bad placement pattern:

- repeating `demo`, `temporary`, or `hiring artifact` language throughout routine workflow copy

### 3. System Mode

Use for:

- errors
- lease expiry
- one-time credential handling
- archived/retained state explanations

System-mode copy may be slightly more explicit than product-mode copy, but should still be:

- short
- factual
- actionable

## Demo Disclosure Strategy

PaperBinder should remain clearly identified as a demo, but this truth should be concentrated.

Recommendation:

- keep explicit demo framing on the public landing and `Start Demo` path
- keep explicit demo/lease language where expiry, cleanup, or one-time credentials matter
- keep `/about` as the main place for broader scope framing
- avoid repeating demo disclaimers on ordinary task surfaces unless the copy would otherwise become misleading

Practical rule:

- if the user is performing normal binder/document/user tasks, the page should usually sound like product UI
- if the user is provisioning, handling temporary credentials, extending lease, or encountering expiry, demo framing should be explicit

## Preferred Noun Set

Use these primary nouns consistently:

- `workspace`
- `binder`
- `document`
- `users`
- `role`
- `view as`

Use these more sparingly:

- `tenant`
- `access`
- `lease`

Avoid foregrounding these terms in normal UI copy unless they are strictly needed:

- `root host`
- `tenant host`
- `server-authoritative`
- `redirectUrl`
- `SPA client`
- `cookie-auth`
- `route contract`

## Rewrite Rules

### Rule 1: Product Language First

Default to the user outcome, not the internal mechanism.

Prefer:

- `Sign in to a workspace`

Instead of:

- `Continue through the server-approved destination into the tenant host`

### Rule 2: Put Technical Truth Behind User Intent

Keep the technical truth, but express it as the user-visible result unless deeper detail is necessary.

Prefer:

- `PaperBinder sends you to the right workspace after sign-in`

Instead of:

- `Redirect resolution stays on the server so the browser never builds tenant URLs from user input`

### Rule 3: Remove Reviewer Narration From Product UI

Do not let the app speak like repo documentation.

Avoid:

- `hiring artifact`
- `architecture demonstration`
- `reviewer-facing context`
- `marketing abstraction`

These may be acceptable in docs or `/about`, but they should rarely appear in primary product UI.

### Rule 4: Avoid Meta and Oppositional Phrasing

Do not define the product by arguing against another style of product copy.

Avoid:

- `not a marketing abstraction`
- `not trying to become`
- `without leaving the workspace context` when overused

Prefer direct statements about what the user can do.

### Rule 5: Keep Helper Text Field-Specific

Helper text should help complete the field or understand the immediate consequence.

Good helper text:

- `Use the email this workspace member will sign in with`
- `Choose a workspace name for this demo`

Bad helper text:

- explanations of normalization
- client/server payload commentary
- auth-model commentary

### Rule 6: Keep CTAs Short and Literal

Prefer:

- `Start demo`
- `Open workspace`
- `Add binder`
- `Save role`

Avoid CTAs that restate policy or internal behavior.

### Rule 7: Errors Should Be Specific, Not Dramatic

Error copy should say:

- what failed
- what the user can do next

It should not sound vague, theatrical, or over-produced.

### Rule 8: Use System Detail Only Where It Changes User Behavior

Keep explicit operational detail for:

- one-time credentials
- expiry and lease extension
- archived visibility behavior
- retry/rate-limit guidance

Remove it from routine copy where it does not change the action.

## High-AI-Smell Patterns To Remove

These are the main patterns to target in the final pass:

- implementation narration in public forms
- architecture narration in authenticated panels
- reviewer-facing or self-conscious explanations
- generic polished abstractions with little task value
- long sentences that bundle multiple safeguards into one line

## Rewrite Pattern Examples

### Example 1

High AI smell:

`Review the product itself instead of a marketing abstraction.`

Recommended direction:

`See the product in a live workspace.`

Why:

- removes meta commentary
- stays product-first
- remains truthful

### Example 2

High AI smell:

`Provision a temporary tenant and keep the server in charge.`

Recommended direction:

`Create a temporary workspace and continue into the app.`

Why:

- focuses on the user outcome
- removes internal implementation framing

### Example 3

High AI smell:

`PaperBinder normalizes the workspace name on the server before opening the demo.`

Recommended direction:

`Choose a workspace name for this demo.`

Why:

- helper text becomes field-specific
- backend processing is not surfaced unnecessarily

### Example 4

High AI smell:

`Root-host sign in remains available for return visits and still relies on the same server-approved destination.`

Recommended direction:

`Already have credentials? Sign in to an existing workspace.`

Why:

- task-first
- same user intent
- removes routing jargon

### Example 5

High AI smell:

`Redirect resolution stays on the server so the browser never builds tenant URLs from user input.`

Recommended direction:

`After sign-in, PaperBinder sends you to the right workspace.`

Why:

- still truthful
- much easier to read
- keeps the safeguard implicit

### Example 6

High AI smell:

`Keep the full user list on screen while add-user, role updates, and impersonation actions expand on this route.`

Recommended direction:

`Manage users, roles, and view-as access from one page.`

Why:

- describes the product surface instead of implementation structure

### Example 7

High AI smell:

`Role changes, owner visibility, and impersonation eligibility stay server-enforced for this workspace.`

Recommended direction:

`Update roles and start view as when it is available.`

Why:

- enforcement belongs in behavior and error handling, not ordinary panel copy

### Example 8

High AI smell:

`It is intentionally narrow in scope: enough product surface to feel real, enough architecture to review, and explicit boundaries around what it is not trying to become.`

Recommended direction:

`PaperBinder is a focused demo workspace for binders, documents, and role-based access.`

Why:

- clearer
- less self-conscious
- more product-oriented

## Editing Order

Apply the copy pass in this order:

1. global repeated templates
2. public-path forms and support panels
3. `/about` and other explanatory public surfaces
4. authenticated admin/task surfaces
5. system/error/retained-expiry wording

Reason:

- repeated templates give the biggest consistency gain
- public forms currently carry the heaviest mechanism-driven copy
- explanatory public surfaces need deliberate demo framing
- authenticated copy should be tightened after the global term map is stable

## Acceptance Check Before Any Copy Change Is Kept

For each changed string, confirm:

- Is it factual?
- Is it inside current product scope?
- Does it help the user act?
- Does it avoid internal implementation narration?
- Does it avoid reviewer/doc voice?
- Does it match the shared noun set?
- Does it still make clear that PaperBinder is a demo where that fact materially matters?

If the answer to any of these is `no`, rewrite again or remove the line.
