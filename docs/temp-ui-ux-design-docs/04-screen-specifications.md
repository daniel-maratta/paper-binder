# 04. Screen Specifications

## 1. Homepage

## Goal
Present PaperBinder as a real, product-style document workspace and direct the user toward the live demo.

## Must-have elements
- top navigation
- strong headline and one supporting paragraph
- primary CTA: Start Demo
- secondary CTA: Learn more
- large product screenshot
- three proof points
- short capability section
- honest closing section
- footer

## Content priority
1. what PaperBinder is
2. what the user can do in it
3. visible proof from the actual app
4. how to start the demo
5. where reviewer notes live

## Remove or avoid
- provisioning mechanics in hero copy
- architecture-first language
- heavy sidebar/tab framing on public pages
- overly operational forms above the fold

## 2. Demo-entry page

## Goal
Start a disposable workspace with minimal friction and clear context.

## Layout
Prefer a centered or asymmetric two-column layout over the current left-nav instructional layout.

## Must-have elements
- compact title and intro
- new workspace card
- existing login card
- temporary/disposable note
- production-safe challenge handling
- optional reviewer link

## Demote
- local-only implementation notes
- server routing explanation
- checkpoint/contract wording

## 3. About page

## Goal
Explain scope honestly without turning the page into technical narration.

## Sections
- what PaperBinder is
- what the demo demonstrates
- what is intentionally out of scope
- how to explore the product
- optional link to reviewer notes

## 4. Reviewer-notes page

## Goal
Give technically minded evaluators the implementation context they want without forcing it on everyone else.

## Suggested content
- demo scope
- tenant/session lifecycle notes
- route/redirect notes
- architecture summary
- known constraints
- link-outs to deeper docs

## 5. Workspace dashboard

## Goal
Make the first authenticated screen feel like useful software immediately.

## Recommended layout
- top page title and compact session status
- primary metric cards or summary row
- recent binders / recent documents
- quick actions
- optional access summary
- demoted workspace/session metadata

## Recommended changes from current state
- reduce the prominence of lease/session copy
- move tenant slug/host info out of the primary hero region
- let recent content and actions sit higher
- keep session extension visible but calmer

## Suggested dashboard modules
- visible binders
- documents
- users
- time remaining
- recent binders
- recent documents (if available)
- review binders CTA
- manage users CTA

## 6. Binders list

## Goal
Make binders feel like the product’s core organizing object.

## Layout
- clear page title
- search and filters on one line
- polished list/table
- obvious create action where allowed
- status visible but not noisy

## Improvements
- stronger row hierarchy
- clearer binder type/category treatment
- calmer status chips
- reduce explanatory blocks unless there is a true empty state

## 7. Binder detail

## Goal
Show the binder as a workspace container, not just a static record.

## Recommended structure
- binder title and summary
- document list with statuses
- right-side or secondary panel for binder metadata
- actions relevant to the binder
- optional document preview entry point

## Demote
- raw IDs
- long system labels
- contract narration

## 8. Document detail

## Goal
Make document detail one of the most convincing product screens.

## Recommended structure
- document title + status
- document metadata summary row
- markdown/source preview surface
- relationship context (binder, created date, supersedes)
- primary back/navigation action

## Improvements from current state
- strengthen the reading surface
- reduce the sense that the user is reading a diagnostic card
- keep the markdown/source area visually generous and editorial

## 9. Users / access management

## Goal
Use access management as a B2B trust signal.

## Recommended structure
- page title + concise support text
- user list/table
- role badges
- invite/create action
- impersonation or elevated action pattern with careful explanation
- clear states for permission limits

## Improvements
- less prose
- more admin-grade clarity
- stronger row and action grouping
- calmer warnings and permission notes

## 10. Session and expiry states

## Goal
Retain the credibility of session/lease behavior without letting it dominate every screen.

## Rules
- session banners should be visible and understandable
- expired state should be clear and responsible
- extension actions should be obvious
- implementation wording should stay secondary

## 11. Metadata handling rules

### Keep visible only when it helps the task
- status
- created date
- visible counts
- role
- document relationship signals

### Hide, collapse, or demote
- long hostnames
- internal identifiers
- verbose routing notes
- technical contract descriptions
- tenant boundary explanation in primary content regions

## 12. Responsive behavior

## Public pages
- keep headline, CTA, and screenshot high
- reduce support copy
- stack proof points cleanly
- do not let notes push the main CTA too low

## Product pages
- preserve action hierarchy
- keep summary cards readable
- let tables/lists collapse thoughtfully
- maintain a strong document-reading surface on narrow layouts

## 13. Acceptance criteria by screen

### Homepage
A first-time visitor should understand within seconds that PaperBinder is a secure document workspace and that a live demo exists.

### Demo page
A visitor should be able to start a disposable workspace without parsing architecture language.

### Dashboard
A user should see recent work and next actions before implementation metadata.

### Binders
The binder list should feel like a deliberate product module, not a scaffold.

### Document detail
The document screen should feel like a convincing content-review surface.

### Users
The access screen should communicate trustworthy administrative capability.
