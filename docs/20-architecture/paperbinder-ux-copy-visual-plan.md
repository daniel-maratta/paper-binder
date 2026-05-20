# PaperBinder UX, Copy, and Visual Direction Plan

Status: Future-scope planning reference

This document defines UX, copy, positioning, visual direction, and accessibility guidance for a future refinement of PaperBinder's public-facing demo presentation.

Canonical V1 product, route, accessibility, and visual implementation contracts remain in:

- `docs/10-product/prd.md`
- `docs/10-product/information-architecture.md`
- `docs/10-product/ux-notes.md`
- `docs/10-product/accessibility.md`
- `docs/10-product/ui-ux-contract-v1.md`
- `docs/20-architecture/frontend-app-route-map.md`

The supported public test-deployment target is:

    https://paperbinder-test.danielmaratta.com/

A future owner-controlled public host may use:

    https://paperbinder.danielmaratta.com/

This document assumes PaperBinder is a working micro-SaaS demo: a small document and policy management application built to demonstrate production-minded software delivery, AI-assisted engineering practices, and Daniel Maratta's product/engineering judgment.

---

## 1. Core Diagnosis

The current site appears to work and contains the essential information, but the overall impression is too explanatory and too self-conscious.

The main issue is not that the UI is unclear. The issue is that the site’s narrative posture feels misaligned.

The current site seems to communicate something like:

    This is a SaaS demo built by AI. Here is what the AI did. Here is why this exists.

That is understandable, but it makes the site feel overly generated, defensive, and process-heavy.

The stronger posture is:

    PaperBinder is a small, working document and policy management demo with a product-shaped surface. I built it to demonstrate how I ship production-minded software with AI-assisted engineering.

The site should feel product-shaped first, portfolio-oriented second, and AI-assisted engineering case study third.

PaperBinder should not apologize for being a demo. It should present itself as a focused, intentionally scoped product-shaped build.

---

## 2. Recommended Positioning

PaperBinder should be positioned at the intersection of three things while preserving the existing V1 definition: a constrained multi-tenant SaaS demonstration, not a mature commercial product.

### 2.1 Product-Shaped Demo

PaperBinder is a document and policy management demo app.

It should be credible as a lightweight internal business tool for organizing documents, publishing policies, and managing operational knowledge.

Potential real-world use cases include:

- Employee handbooks
- Internal policy libraries
- Standard operating procedures
- Department-specific documentation
- Compliance notes
- Onboarding material
- Vendor process documentation
- Lightweight knowledge management for small teams

The demo must not claim maturity it does not have. It should show a plausible product surface while remaining honest about its deliberately constrained scope.

### 2.2 Software Craftsmanship Artifact

PaperBinder demonstrates more than UI assembly.

It should communicate that the build includes real software engineering concerns:

- Product scope
- Application architecture
- Authentication
- Multi-tenancy
- Role-aware workflows
- Deployment discipline
- CI/CD
- Documentation
- Operational thinking
- Maintainability
- Quality review

The emphasis should be that PaperBinder is small but serious.

### 2.3 AI-Assisted Delivery Case Study

PaperBinder should explain AI as part of the delivery model, not as the owner of the work and not as an in-app V1 feature.

Preferred framing:

    I used AI heavily during planning, implementation, review, and documentation — but kept the product decisions, architecture, and quality bar human-owned.

Avoid framing:

    AI built this app.

The point is not novelty for its own sake. The point is execution leverage.

---

## 3. Voice Direction

The site should use a hybrid voice:

- Product-oriented when describing what PaperBinder does
- First-person when describing why Daniel built it
- Engineering-oriented when describing how it was built
- Restrained and credible throughout

The tone should be:

- Clear
- Human
- Direct
- Calm
- Confident
- Practical
- Slightly editorial
- Not overhyped

The tone should not be:

- AI-generated sounding
- Corporate-compliance bland
- Startup-hype heavy
- Over-apologetic
- Over-explanatory
- Developer README-like
- Excessively meta

### 3.1 First-Person Usage

Use first person sparingly but deliberately.

Good:

    I built PaperBinder as a working micro-SaaS demo: a small document and policy management app with real product structure behind it.

Good:

    I used AI heavily during planning, implementation, review, and documentation — but kept the product decisions, architecture, and quality bar human-owned.

Avoid:

    This application demonstrates an AI-assisted workflow where multiple agents collaborated to produce a micro-SaaS application.

Avoid:

    AI helped generate this application and its documentation.

### 3.2 Authorship

The site should make clear that Daniel is the accountable builder.

AI should be positioned as tooling and leverage, not as the authorial subject.

Preferred:

    I used AI to move faster while keeping architecture, product decisions, review, and accountability in human hands.

Avoid:

    AI generated the architecture, implementation, and documentation for this product.

---

## 4. Proposed Site Narrative

The homepage should answer four questions quickly.

### 4.1 What Is This?

PaperBinder is a document and policy management app.

It gives teams a structured place to organize internal documents, publish policies, and keep operational knowledge from scattering across folders, chats, and inboxes.

### 4.2 Why Did I Build It?

I built PaperBinder as a working micro-SaaS demo to show how I design, build, deploy, and document production-minded software with AI-assisted engineering.

### 4.3 What Does It Demonstrate?

PaperBinder demonstrates:

- Multi-tenant application structure
- Authentication
- Role-aware workflows
- CI/CD
- Deployment discipline
- Documentation
- Product judgment
- Practical UX/UI execution
- AI-assisted software delivery with human ownership

### 4.4 What Should Visitors Do?

Different visitors may have different goals.

For hiring, contracting, or professional evaluation:

    Review the build.

For product exploration:

    Explore the demo.

For those interested in the AI-assisted delivery process:

    Read the build notes.

For those interested in Daniel’s broader writing:

    Read related articles on danielmaratta.com.

---

## 5. Future Information Architecture Recommendation

Avoid placing every explanation on the landing page.

V1 route ownership remains unchanged unless a future implementation explicitly updates `docs/10-product/information-architecture.md`, `docs/20-architecture/frontend-app-route-map.md`, and the related frontend tests in the same change set.

Use a small, clear structure that separates product explanation, build explanation, and personal writing.

Preferred structure:

    Home
    Product
    Build
    Writing
    About

Alternative minimal structure:

    Home
    Demo
    Build
    Articles

Recommended future structure:

    Home
    Product
    Build
    Writing
    About

---

## 6. Future Page Purposes

### 6.1 Home

Purpose:

    Explain PaperBinder in 30 seconds.

Recommended sections:

    Hero
    What PaperBinder does
    Why I built it
    What it demonstrates
    CTA / links

The homepage should not feel like a full technical case study. It should orient the visitor quickly and let them choose where to go next, while preserving the existing root-host provisioning and login flow unless that route contract changes explicitly.

### 6.2 Product

Purpose:

    Explain the theoretical SaaS use case.

Recommended sections:

    Document organization
    Policy publishing
    Role-aware access
    Tenant/team separation
    Audit/review potential
    Example use cases

This future page should read like a product-oriented explanation of the demo, not a development diary.

### 6.3 Build

Purpose:

    Explain the software engineering achievement.

Recommended sections:

    Architecture
    AI-assisted workflow
    CI/CD and deployment
    Testing and review
    Documentation
    What I would build next

This is where the AI story belongs.

### 6.4 Writing

Purpose:

    Link PaperBinder to Daniel’s broader writing.

This page can be simple. It should point visitors toward articles on:

- AI-assisted software delivery
- Product thinking
- Practical SaaS architecture
- Building useful software with small teams
- Lessons learned from PaperBinder

Example copy:

    I write about AI-assisted software delivery, product strategy, and building useful software with small teams.

    PaperBinder is one practical example of that work.

### 6.5 About

Purpose:

    Connect PaperBinder to Daniel without turning the site into only a personal portfolio.

Example copy:

    I’m Daniel Maratta, a full-stack software engineer focused on building useful, maintainable software with strong product judgment and modern AI-assisted workflows.

---

## 7. Homepage Copy Draft

### 7.1 Hero

    # PaperBinder

    A small document and policy management app, built as a working micro-SaaS demo.

    PaperBinder gives teams a structured place to organize internal documents, publish policies, and manage operational knowledge without scattering it across folders, chats, and inboxes.

    I built it to demonstrate how I approach modern software delivery: clear product scope, production-minded architecture, documented decisions, CI/CD, deployment discipline, and AI-assisted engineering used as leverage rather than autopilot.

    [Provision new demo tenant and log in] [Read about the build]

### 7.2 What PaperBinder Is

    ## What PaperBinder is

    PaperBinder is a lightweight SaaS-style application for managing internal documents and policies.

    In a real organization, a tool like this could support employee handbooks, standard operating procedures, compliance notes, onboarding material, vendor policies, or department-specific documentation.

### 7.3 Why I Built It

    ## Why I built it

    I wanted a focused product small enough to ship, but realistic enough to show the work behind a real application.

    PaperBinder is not just a static portfolio piece. It has the shape of a real SaaS product: authentication, tenancy, structured workflows, deployment infrastructure, documentation, and a clear path for future expansion.

### 7.4 How AI Fit Into the Work

    ## How AI fit into the work

    AI helped accelerate planning, implementation, documentation, and review.

    The important part is not that AI generated code. The important part is the operating model: using AI to move faster while keeping architecture, product decisions, quality control, and accountability in human hands.

### 7.5 What This Demonstrates

    ## What this demonstrates

    - Product scoping and UX judgment
    - Full-stack SaaS architecture
    - Multi-tenant application structure
    - Authentication and role-aware access patterns
    - CI/CD and deployment to a live test environment
    - Documentation that supports future maintainability
    - AI-assisted development with human review

---

## 8. Product Page Copy Draft

    # Product

    PaperBinder is a lightweight document and policy management app for teams that need a clearer place to keep operational knowledge.

    It is intentionally small, but the product shape is real: organize documents, publish policies, separate team or tenant context, and provide a foundation for review-oriented workflows.

    ## Organize internal documents

    Keep important internal material in one structured place instead of spreading it across folders, inboxes, chats, and shared drives.

    ## Publish policies

    Give policies a more intentional home. A tool like PaperBinder could support employee handbooks, SOPs, compliance notes, and departmental guidance.

    ## Support team-aware workflows

    PaperBinder is designed around SaaS-style structure, including the idea that different teams or tenants should have their own working context.

    ## Built for extension

    The demo is intentionally scoped, but the product direction is clear. Post-V1 versions could explore approvals, audit trails, document versioning, policy acknowledgements, reminders, and richer permission models only after updated PRD and ADR approval where required.

---

## 9. Build Page Copy Draft

    # Build

    PaperBinder is a working micro-SaaS demo built to show how I approach product-minded software engineering.

    The goal was not to build the largest possible application. The goal was to build something focused, coherent, deployed, documented, and credible.

    ## Engineering focus

    PaperBinder demonstrates full-stack SaaS structure, authentication, multi-tenant application thinking, role-aware workflows, CI/CD, deployment configuration, and maintainability-oriented documentation.

    ## AI-assisted delivery

    I used AI throughout the build process for planning, implementation support, review, documentation, and critique.

    That does not mean the work was handed off blindly. The important pattern is human-owned direction with AI-assisted acceleration.

    ## Quality bar

    The project emphasizes clear scope, documented decisions, reviewable implementation, and a deployment path that resembles how real software is shipped.

    ## What I would build next

    If PaperBinder were developed beyond V1 demo scope, the next priorities would likely include richer document versioning, approval workflows, policy acknowledgement tracking, audit history, and stronger administrative controls. Those remain future-scope candidates, not current V1 commitments.

---

## 10. Writing Page Copy Draft

    # Writing

    PaperBinder connects to a broader set of questions I am exploring around software, AI, product execution, and small-team delivery.

    I write about how AI changes the way software gets planned, built, reviewed, and shipped — especially when the goal is not just faster code, but better product execution.

    Related articles will be published on danielmaratta.com.

    [Visit danielmaratta.com]

---

## 11. About Page Copy Draft

    # About

    I’m Daniel Maratta, a full-stack software engineer focused on building useful, maintainable software with strong product judgment and modern AI-assisted workflows.

    PaperBinder is one of my working software demos. It exists to show not just what I can build, but how I think through product scope, architecture, implementation, documentation, deployment, and review.

    I am especially interested in small, focused products that solve real operational problems without becoming bloated or overcomplicated.

---

## 12. Visual Direction

The site should feel:

- Calm
- Credible
- Slightly editorial
- Structured
- Software-product-like
- Human-owned
- Production-minded

The site should not feel:

- Like an AI startup hype page
- Like a generic SaaS template
- Like a corporate compliance portal
- Like a developer README rendered as a website
- Like a static portfolio page with no product substance

The visual system should support clarity first, then attractiveness.

The design should use hierarchy, spacing, type, and restrained accent color rather than heavy decoration.

---

## 13. Visual References

These are conceptual references, not designs to copy.

### 13.1 Linear

Useful reference qualities:

- Restraint
- Sharp hierarchy
- Clean product confidence
- Strong spacing discipline

### 13.2 Notion

Useful reference qualities:

- Document clarity
- Calm knowledge-management feel
- Simple structure
- Low-friction reading

### 13.3 Basecamp

Useful reference qualities:

- Human product voice
- Practical use-case framing
- Clear value communication
- Less generic SaaS energy

### 13.4 Stripe Docs

Useful reference qualities:

- Technical credibility
- Clear information architecture
- Useful density without clutter
- Strong documentation feel

### 13.5 Personal Portfolio / Case Study Sites

Useful reference qualities:

- Human authorship
- Project explanation
- Professional credibility
- Connection to Daniel’s broader work

---

## 14. Design System Recommendations

Canonical V1 tokens and component rules live in `docs/10-product/ui-ux-contract-v1.md` and `docs/10-product/component-specification-v1.md`. The recommendations below are design-direction inputs for a future refinement, not a parallel token contract.

### 14.1 Color

Use a restrained palette with one confident accent.

Recommended direction:

    Background: warm off-white or very light gray
    Primary text: near-black
    Secondary text: muted gray/slate
    Surface: white or very lightly tinted cards
    Borders: subtle gray
    Accent: restrained orange
    Secondary accent: muted blue or slate

Because Daniel’s personal brand includes bright pastel/neon orange, orange can become a subtle signature color.

Use orange for:

- Primary CTA
- Active navigation
- Small section markers
- Icon accents
- Thin dividers
- Focus highlights, where accessible
- Select callout emphasis

Avoid using orange for:

- Large uncontrolled background areas
- Long text blocks
- Low-contrast foreground/background combinations
- Decorative clutter

### 14.2 Typography

Typography should feel editorial and product-oriented.

Recommendations:

- Use a clear sans-serif for UI and body copy.
- Use strong type hierarchy.
- Keep line lengths readable.
- Avoid dense paragraphs.
- Prefer short sections with meaningful headings.
- Consider a slightly more distinctive heading style if it remains legible.

Suggested hierarchy:

    H1: large, confident, concise
    H2: clear section framing
    H3: card or subsection title
    Body: readable, comfortable line height
    Caption: subdued but accessible
    Eyebrow: optional, sparingly used

### 14.3 Spacing

Use whitespace to reduce the feeling of over-explanation.

Recommendations:

- Increase vertical spacing between major sections.
- Keep cards breathable.
- Avoid cramped multi-column layouts on smaller screens.
- Use max-width containers for text-heavy sections.
- Keep hero copy narrow enough to feel intentional.

### 14.4 Surfaces and Cards

Cards should group concepts, not become text dumps.

Good card pattern:

    Title
    One-sentence or two-sentence explanation
    Optional icon or small accent

Avoid cards with:

- Long paragraphs
- Multiple unrelated ideas
- Excessive badges
- Heavy borders
- Strong shadows everywhere

### 14.5 Buttons and CTAs

Primary CTA:

    Provision new demo tenant and log in

Secondary CTA:

    Read about the build

Other possible supporting links:

    Explore the demo
    View product notes
    Read the build notes
    Visit danielmaratta.com

Buttons should be obvious, keyboard-accessible, and high-contrast.

### 14.6 Screenshots and Product UI Fragments

If available, include two or three product screenshots.

Recommended screenshot captions:

    A simple dashboard for internal document management.

    Policy-oriented workflows that could support review and publication.

    Tenant-aware structure suitable for SaaS-style applications.

Screenshots help the site feel real. They reduce the need for explanatory copy.

---

## 15. Component-Level Recommendations

### 15.1 Hero

Current likely issue:

    Too much explanation too early.

Recommended structure:

    Eyebrow: Working micro-SaaS demo
    Headline: Document and policy management, built with production-minded software discipline.
    Body: Two or three short sentences.
    CTAs: Provision new demo tenant and log in / Read the build notes

Example:

    Working micro-SaaS demo

    Document and policy management, built with production-minded software discipline.

    PaperBinder gives teams a structured place to organize internal documents, publish policies, and keep operational knowledge from scattering across folders, chats, and inboxes.

    I built it to demonstrate how I use AI-assisted engineering to ship focused, maintainable software without giving up human ownership of product and architecture decisions.

### 15.2 Feature Cards

Use feature cards for product concepts:

    Organize internal documents
    Publish policies
    Separate team workspaces
    Support role-aware access
    Build on SaaS architecture
    Explore post-V1 approvals and audit trails

Each card should be short.

### 15.3 AI Explanation Section

Do not lead with AI.

Place AI explanation after the product has been established.

The first screen should communicate:

    This is a product-shaped software build.

A later section can communicate:

    AI was part of the workflow.

### 15.4 Build Summary

Use this section to connect the demo to professional evaluation.

Recommended content:

    PaperBinder demonstrates product scoping, application architecture, multi-tenant SaaS structure, CI/CD, deployment, documentation, and AI-assisted software delivery with human review.

### 15.5 Footer

The footer should be simple.

Potential footer links:

    Product
    Build
    Writing
    Daniel Maratta
    GitHub or source link, if public
    Contact, if desired

Avoid cluttering the footer with excessive meta explanation.

---

## 16. Copy Rules for Rewrite

These rules should govern the copy rewrite.

1. Lead with the product, not the AI process.
2. Use first person when explaining why Daniel built it.
3. Use product language when explaining what PaperBinder does.
4. Use engineering language when explaining how PaperBinder was built.
5. Avoid over-explaining implementation details on the homepage.
6. Avoid making AI the grammatical subject of most sentences.
7. Prefer “I used AI to...” over “AI built...”
8. Do not apologize for the product being a demo.
9. Make theoretical real-world use cases concrete but modest.
10. Keep homepage sections short enough to scan.
11. Use plain, confident sentences.
12. Avoid filler phrases such as “leveraging cutting-edge AI” unless they are grounded and necessary.
13. Avoid generic SaaS claims such as “transform your workflow” or “revolutionize document management.”
14. Do not imply PaperBinder is a mature commercial product if it is not.
15. Do not bury the product definition beneath process notes.
16. Use “demo” honestly, but do not use it defensively.
17. Keep Daniel’s authorship visible but not self-indulgent.
18. Use CTAs that match visitor intent.
19. Prefer concrete nouns over abstract claims.
20. Make the build credible through specificity, not hype.

---

## 17. Visual Rules for Redesign

These rules should govern the visual redesign.

1. The site should feel like a credible small SaaS-style demo, not a generated demo.
2. Use whitespace, hierarchy, and restrained contrast rather than dense explanatory blocks.
3. Use orange as a signature accent, not a dominant theme.
4. Prefer editorial layouts over generic SaaS hero clichés.
5. Use screenshots or product UI fragments to make the app feel tangible.
6. Avoid excessive badges, pills, gradients, and AI-themed visual tropes.
7. Every section should have one clear job.
8. Each page should support both skim-reading and deeper reading.
9. Technical details belong on the Build page, not the hero.
10. The visual design should support Daniel’s authorship without making the site feel like only a personal blog.
11. Avoid heavy-handed animation.
12. Maintain excellent mobile layout behavior.
13. Preserve fast load times.
14. Avoid decorative elements that reduce readability.
15. Use consistent spacing and component patterns.
16. Ensure buttons, links, and navigation states are obvious.
17. Avoid low-contrast text.
18. Do not rely on color alone to communicate state.
19. Keep the UI stable and predictable.
20. Prioritize clarity over novelty.

---

## 18. Documentation Alignment Decisions

These decisions keep this future-scope plan aligned with the existing V1 documentation surface.

- Preserve the existing PaperBinder definition: constrained multi-tenant SaaS demonstration, not a mature commercial product.
- Track deeper technical write-up material as future-scope content for technical readers; do not change V1 product definitions to support that future narrative.
- Keep the V1 root-host route contract and primary CTA unless `docs/10-product/information-architecture.md`, `docs/20-architecture/frontend-app-route-map.md`, tests, and implementation change together.
- Treat Product, Build, Writing, and About pages as post-V1 IA candidates until explicitly approved.
- Keep accessibility authority in `docs/10-product/accessibility.md`; this plan may set direction but must not redefine the V1 accessibility contract.
- Keep design tokens and component rules in `docs/10-product/ui-ux-contract-v1.md`; future visual work should refine that contract instead of creating parallel token definitions.
- Describe AI-assisted engineering as delivery process context only; no in-app AI feature ships in V1.
- Treat approvals, audit trails, document versioning, policy acknowledgements, reminders, and richer permission models as post-V1 candidates that require PRD and ADR updates where applicable.
- Describe public hosts as supported targets or future owner-controlled hosts, not as release evidence that a host is currently running.

---

## 19. Accessibility Direction

PaperBinder's public-facing site and app should follow the baseline in `docs/10-product/accessibility.md` and the implementation details in `docs/10-product/ui-ux-contract-v1.md`.

Decision: use WCAG 2.2 AA-oriented implementation practices where feasible for touched UI, but do not claim formal WCAG 2.1 or 2.2 AA conformance, ADA compliance, or certification without a formal audit.

For this initiative, accessibility work should emphasize:

- keyboard reachability
- visible focus states
- semantic HTML and landmarks
- accessible labels and names
- contrast-aware color usage
- non-color-only state communication
- responsive and 200% zoom behavior
- reduced-motion support
- practical manual keyboard and screen-reader-label checks

---

## 20. Recommended Initiative Structure

Break the work into five concrete workstreams.

### 20.1 Workstream 1: Positioning and Voice

Recommended outputs:

    docs/20-architecture/paperbinder-ux-copy-visual-plan.md
    docs/10-product/prd.md, only if product scope changes
    docs/10-product/ux-notes.md, only if canonical UX rules change

Goal:

    Define what PaperBinder is, who it is for, how personal the voice should be, and how AI should be discussed.

### 20.2 Workstream 2: Site Information Architecture

Recommended outputs:

    docs/10-product/information-architecture.md
    docs/20-architecture/frontend-app-route-map.md
    frontend route tests, if routes change

Goal:

    Separate product explanation, build explanation, and personal writing links.

### 20.3 Workstream 3: Copy Rewrite

Recommended outputs:

    src/PaperBinder.Web root-host copy updates
    docs/10-product/ux-notes.md, if copy rules become canonical
    docs/20-architecture/paperbinder-ux-copy-visual-plan.md, if future-scope copy examples change

Goal:

    Rewrite copy before touching visual design.

### 20.4 Workstream 4: Visual Design Pass

Recommended outputs:

    docs/10-product/ui-style.md
    docs/10-product/ui-ux-contract-v1.md
    docs/10-product/component-specification-v1.md

Goal:

    Define spacing, typography, color, cards, buttons, screenshots, responsive behavior, and accessibility constraints.

### 20.5 Workstream 5: Implementation Pass

Recommended outputs:

    docs/20-architecture/paperbinder-ux-copy-visual-plan.md
    docs/10-product/accessibility.md
    relevant tests and validation notes

Goal:

    Apply copy and visual changes without destabilizing the app.

---

## 21. Codex Implementation Instructions

Use the following instructions for Codex or another implementation agent.

    Implement the PaperBinder UX/copy refinement initiative.

    Do not change application behavior, authentication, routing, tenancy, data flows, deployment configuration, database schema, or CI/CD infrastructure unless explicitly instructed.

    First update site copy and information architecture according to this plan plus the canonical product and route docs.

    Then make a restrained visual polish pass using the existing frontend stack and design constraints.

    The homepage should lead with PaperBinder as a document and policy management demo app, then explain that it is a working micro-SaaS demo built by Daniel Maratta to demonstrate production-minded AI-assisted software delivery.

    Reduce AI-centric phrasing. Do not make AI the grammatical subject of most sentences. Prefer first-person authorship where appropriate.

    Preserve clarity. Improve attractiveness through hierarchy, whitespace, typography, restrained accent color, responsive layout, accessible components, and product screenshots or UI fragments where available.

    Maintain accessibility awareness and WCAG 2.2 AA-oriented practices without making formal compliance claims.

    Verify keyboard navigation, screen-reader labels, color contrast, semantic heading structure, responsive behavior, and reduced-motion support.

    After implementation, provide:

    1. Summary of copy changes
    2. Summary of visual changes
    3. Accessibility considerations
    4. Screenshots or local preview notes
    5. Files changed
    6. Known tradeoffs
    7. Manual testing performed

---

## 22. Manual UX Review Checklist

Use this checklist after implementation.

### 22.1 Narrative

- Does the homepage explain what PaperBinder is within the first few seconds?
- Does the site lead with product value before AI process?
- Is Daniel’s authorship clear?
- Is AI framed as leverage rather than author?
- Is the demo status honest but not apologetic?
- Are real-world use cases concrete and modest?
- Are CTAs clear?

### 22.2 Information Architecture

- If future IA expansion is approved, are Home, Product, Build, Writing, and About clearly separated?
- Does each page have a distinct purpose?
- Is technical detail kept out of the hero?
- Is the AI process discussed in the right place?
- Are visitors able to choose between the demo flow, build notes, and articles without weakening the V1 provisioning path?

### 22.3 Copy

- Is the copy concise?
- Are paragraphs short?
- Are headings meaningful?
- Is first person used deliberately?
- Are generic AI/SaaS clichés removed?
- Are product claims accurate?
- Is the writing recognizably human?

### 22.4 Visual Design

- Does the site feel more attractive without becoming flashy?
- Is the orange accent restrained and intentional?
- Is whitespace improved?
- Is hierarchy clear?
- Are cards used appropriately?
- Are screenshots or product fragments included where useful?
- Does the design feel like a credible small SaaS-style demo?

### 22.5 Accessibility

- Can the site be navigated by keyboard?
- Are focus states visible?
- Does text contrast meet AA expectations?
- Are headings semantic and ordered?
- Are buttons and links accessible?
- Are forms labeled?
- Are images given appropriate alt text?
- Does the layout work at 200% zoom?
- Does the site respect reduced-motion preferences?
- Are new interactive components checked for tab order and screen-reader labels?

---

## 23. Implementation Guardrails

Do not let this initiative expand into a full product rebuild.

Do not change:

- Authentication behavior
- Authorization behavior
- Tenant model
- Database schema
- Deployment topology
- CI/CD behavior
- Core app flows
- Backend architecture

Allowed changes:

- Public-facing site copy
- Page structure
- Marketing/demo page layout
- Navigation labels
- Visual hierarchy
- Typography
- Spacing
- Colors within existing design constraints
- Component presentation
- Accessibility improvements
- Static explanatory content
- Links to Daniel’s main site
- Screenshots or demo imagery, if available

Potentially allowed with review:

- Small route additions for Product, Build, Writing, or About pages
- Minor component extraction for maintainability
- Design token cleanup
- Accessibility-focused markup improvements

---

## 24. Definition of Done

The initiative is complete when:

- The homepage clearly explains PaperBinder as a document and policy management app.
- The homepage explains why Daniel built it without over-centering AI.
- The site separates product, build, writing, and about content.
- The copy feels human, confident, and restrained.
- The visual design feels more polished and product-like.
- The orange accent is used intentionally and accessibly.
- Technical detail is available but not forced into the hero.
- AI-assisted delivery is explained as a human-owned operating model.
- Accessibility checks have been performed.
- Keyboard navigation has been manually verified.
- Screen-reader labels have been manually reviewed for new interactive components.
- Mobile and 200% zoom behavior have been checked.
- No core app behavior has been destabilized.
- Codex or the implementation agent has provided a summary of changes, files changed, accessibility notes, and known tradeoffs.

---

## 25. Core Principle

Do not start with colors or layout.

Start by deciding what the site is allowed to say.

The current visual blandness is likely downstream of the voice being too explanatory. Once the copy has a confident product/portfolio posture, the visual layer will be easier to improve.

PaperBinder should communicate:

    This is a focused product-shaped SaaS build.

    I built it with real software discipline.

    I used AI as leverage, not as a substitute for judgment.

    The result is small, clear, deployed, documented, and credible.
