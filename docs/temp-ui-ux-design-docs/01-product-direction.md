# 01. Product Direction

## 1. Product framing

### Recommended product statement
PaperBinder is a secure, multi-tenant workspace for controlled document review, organized binders, and role-based team access.

### Recommended presentation statement
PaperBinder should be presented as a **live product-style demo** of a document workspace, not as a root-host onboarding walkthrough and not as a fake SaaS startup.

### Positioning sentence
PaperBinder helps teams organize sensitive documents into clear binder-based workspaces with isolated tenants, controlled access, and reviewer-friendly visibility.

## 2. Why this direction is correct

The strongest asset in PaperBinder is not the provisioning flow. It is the fact that there is an actual working application with:
- tenant isolation
- binders and documents
- user management
- stateful session behavior
- coherent product screens

The redesign should therefore lead with visible product proof and let architectural credibility support the story from behind, not from the front.

## 3. Primary audiences

### Primary audience
A technically literate evaluator who wants to see:
- real software
- coherent product thinking
- credible UI/UX judgment
- clear feature boundaries
- enough implementation depth to trust the build

### Secondary audience
A future prospective buyer or collaborator who may later evaluate PaperBinder as a real product concept.

### Internal audience
The builder himself and any AI/code agent working from these docs.

## 4. Product narrative hierarchy

### Primary narrative
1. This is a real document workspace.
2. It is multi-tenant by design.
3. Teams can organize work into binders and documents.
4. Access is controlled by roles.
5. A live disposable demo is available.

### Secondary narrative
1. The demo is intentionally scoped.
2. Reviewer-oriented architecture notes exist.
3. Some product edges are intentionally shallow in v1.

### Narrative to demote
The following ideas may still exist, but should not dominate the primary path:
- root host
- tenant host
- server-authoritative redirect mechanics
- checkpoint scope
- shared API client
- route-contract narration
- infrastructure exposition

## 5. Experience principles

### 5.1 Product first
The first screen should feel like software with purpose, not setup instructions.

### 5.2 Honest, not theatrical
Do not invent enterprise logos, fake testimonials, fake metrics, or fake customers.

### 5.3 Reviewer-aware, not reviewer-dominated
Reviewer notes still matter, but they live in a secondary lane.

### 5.4 Show the actual app
Screenshots and product views should do more work than explanatory prose.

### 5.5 Calm B2B visual tone
Cool neutrals, dark blue, controlled contrast, restrained accents, strong spacing.

### 5.6 Preserve optionality
The redesign should make future commercialization easier, not harder.

## 6. Non-goals

The redesign is **not** trying to:
- make PaperBinder look like a finished venture-backed SaaS company
- add fake product depth
- expand functional scope purely for presentation
- erase the reviewer/demo nature of the project
- turn the site into an architecture whitepaper

## 7. Messaging pillars

### Pillar 1: Secure workspace structure
Organize documents into clear binders inside isolated workspaces.

### Pillar 2: Controlled collaboration
Grant team access deliberately with role-aware permissions.

### Pillar 3: Review visibility
See what is present, what changed, and what remains active.

### Pillar 4: Real demoable software
Start a live disposable workspace and inspect the product directly.

## 8. Tone definition

### Should feel like
- calm
- precise
- credible
- product-minded
- operationally literate
- reviewer-respectful

### Should not feel like
- fluffy marketing
- architecture lecture
- design-dribbble fiction
- startup theater
- internal admin console copy

## 9. Headline territory

Recommended homepage headline directions:
- PaperBinder document workspaces.
- Organize sensitive documents in a workspace built for review.
- Multi-tenant document workspaces with controlled access and clear visibility.

Recommended support-line directions:
- Build binders, manage access, and review documents in isolated team workspaces.
- See the live product, not just a concept.
- Start a disposable demo workspace in seconds.

## 10. Core product story in one paragraph

PaperBinder is a multi-tenant document workspace that groups files into binders, controls access by role, and gives reviewers a clear place to navigate, inspect, and manage content. The public experience should show the real application quickly, explain the demo honestly, and keep deeper architectural notes available without making them the main story.

## 11. Decision rules for future design choices

When a choice is ambiguous:
1. prefer visible product proof over explanation
2. prefer product language over systems language
3. prefer demotion over deletion for reviewer context
4. prefer calm credibility over visual novelty
5. prefer real scope honestly framed over invented scope
