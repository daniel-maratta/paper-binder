# 02. Information Architecture and Copy

## 1. Public information architecture

## Recommended top-level navigation
- Product
- Demo
- About

Optional secondary nav item:
- Reviewer notes

Rationale:
- `Product` explains what PaperBinder is and shows the workspace
- `Demo` is the activation path
- `About` gives honest scope/context
- `Reviewer notes` can hold architecture/demo constraints without polluting the main narrative

## Recommended route model (conceptual)
These names are directional, not final:
- `/` -> product-first homepage
- `/start-demo` -> start demo / login entry
- `/about` -> honest overview of product and scope
- `/reviewer-notes` or `/architecture` -> secondary technical context
- authenticated product routes remain where they are unless route changes are low-cost and beneficial

Codex should verify current route ownership before changing paths.

## 2. Homepage structure

## Section order
1. Header/nav
2. Hero with screenshot
3. Product proof strip
4. Workspace overview section
5. Core capabilities section
6. Reviewer-aware closing section
7. Footer

## Homepage hero copy draft

### Eyebrow
PAPERBINDER

### Headline
A secure workspace for your documents and your team.

### Supporting copy
Multi-tenant by design. Built for organized review, controlled access, and clear visibility.

### Primary CTA
Start Demo

### Secondary CTA
Learn more

### Hero screenshot caption
Live workspace preview

## Product proof strip copy
- Isolation — Each tenant stays fully separated.
- Access control — Fine-grained roles and permissions.
- Visibility — Review activity and document state with confidence.

## Workspace overview section

### Section headline
A document workspace that feels like real software.

### Body copy
PaperBinder groups work into binders, documents, and team access controls inside an isolated tenant workspace. The public site should show the real application early so evaluators can see product thinking, not just provisioning mechanics.

### Supporting bullets
- Binder-based organization for grouped work
- Document detail views with structured metadata
- Role-aware user management and reviewer-safe controls

## Capability cards copy

### Card 1
#### Title
Binders
#### Body
Group related documents into clear workspaces that stay easy to review.

### Card 2
#### Title
Documents
#### Body
Open individual documents in a structured detail view with readable metadata and source content.

### Card 3
#### Title
Access
#### Body
Manage tenant users and roles with permission-aware actions.

## Reviewer-aware closing section

### Headline
Live demo, honest scope.

### Body
PaperBinder is presented as a real product-style demo artifact. The main flow emphasizes the product experience; deeper implementation notes remain available for reviewers who want them.

### Links
- Start Demo
- About PaperBinder
- Reviewer notes

## Footer copy
PaperBinder — Multi-tenant document workspace demo

Optional small-print line:
Built as a reviewable software artifact with a live disposable demo workspace.

## 3. Demo-entry page

This replaces the current root-host onboarding tone.

## Page goal
Help the user start a disposable demo workspace or log in with existing demo credentials.

## Page structure
1. Compact hero/intro
2. Primary demo-start card
3. Existing login card
4. Small operational note
5. Optional secondary reviewer note

## Demo-entry page copy draft

### Page title
Start a live demo workspace

### Intro
Create a disposable PaperBinder workspace and continue directly into the live product.

### Primary card title
New demo workspace

### Primary card body
Enter a workspace name and start a temporary demo tenant. The generated workspace is disposable and intended for review.

### Field label
Workspace name

### Help text
PaperBinder normalizes the workspace name on the server and returns the approved destination.

### Primary button
Start demo workspace

### Secondary button
Log in instead

### Small note
Demo workspaces are temporary and may expire automatically.

### Local-only challenge bypass note
Use only in local development. This note should not appear in production.

## Existing login card copy

### Title
Use existing demo credentials

### Body
Return to a previously created demo workspace with valid credentials.

### CTA
Go to login

## 4. About page

## Page goal
Explain what PaperBinder is, what it demonstrates, and what it intentionally does not yet cover.

## About page copy draft

### Headline
About PaperBinder

### Intro
PaperBinder is a multi-tenant document workspace demo designed to show coherent product thinking, controlled access, and review-oriented software structure.

### Section: What PaperBinder demonstrates
- isolated tenant workspaces
- binder and document flows
- role-aware user management
- product-oriented UI structure
- a live demo path into the real application

### Section: What this demo does not try to be
This demo is intentionally scoped. It is not positioned as a complete enterprise platform, pricing site, or fully expanded document lifecycle suite.

### Section: Why it is presented this way
The goal is to show a real working application in a form that feels like a credible product, while keeping deeper implementation context available for technical reviewers.

## 5. Reviewer-notes page

This page is optional but recommended.

## Page goal
Hold the technical/reviewer context that is currently overexposed on the main path.

## Suggested sections
- scope of the live demo
- tenant/session behavior
- architecture notes
- implementation constraints
- links to deeper repository documentation if appropriate

## Copy stance
Direct, technical, terse. This is where terms like tenant host, redirect contract, and session lifetime can safely live.

## 6. In-app copy rules

## Replace
- Root-host onboarding
- Tenant workspace
- Checkpoint scope
- Live summary content is composed...
- Browser routing remains canonical...
- Current tenant session can request a server-authoritative lease extension now.

## With
- Start demo workspace
- Workspace
- What you can do here
- Recent activity and visible content
- Review binders and manage access
- This demo session can be extended

## 7. CTA system

## Primary CTAs
- Start Demo
- Start demo workspace
- Review binders
- Open binder
- Manage users

## Secondary CTAs
- Learn more
- Log in instead
- View reviewer notes
- Back to binder

## Avoid
- Provision new demo tenant and log in
- Continue with canonical redirect
- Review checkpoint scope
- Inspect route contract

## 8. UI text style rules

- prefer noun + verb clarity over technical precision in public copy
- do not expose implementation terms unless they change a real user decision
- keep helper text to one job per block
- use plain, product-oriented verbs: start, open, manage, review, extend, continue
- keep architecture language out of hero sections, banners, and first paragraphs
