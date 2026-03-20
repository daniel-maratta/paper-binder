# UI/UX Contract - V1
Status: V1 (Implementation Contract)

## AI Summary

- Defines the minimum UI/UX implementation contract for PaperBinder V1.
- Aligns visual direction, tokens, layout shells, component primitives, and state behavior.
- Keeps UX deterministic, accessible, and scope-disciplined.
- Uses the PaperBinder + danielmaratta.com brand palette for cohesion.

This document defines the minimum UI/UX specification required to implement the PaperBinder demo interface.

It builds on the following documents:

- `docs/10-product/ui-style.md`
- `docs/10-product/ux-notes.md`
- `docs/10-product/information-architecture.md`
- `docs/10-product/accessibility.md`

This contract specifies the concrete visual tokens, layout expectations, component primitives, and interaction behavior required for implementation.

The goal is clarity, accessibility, and implementation simplicity.

---

# 1. Design Principles

PaperBinder V1 UI prioritizes:

- clarity
- minimalism
- accessibility
- fast load time
- professional appearance
- deterministic interactions

The interface should feel:

- calm
- technical
- structured
- trustworthy

Avoid:

- visual clutter
- decorative animation
- complex interaction patterns
- modal-heavy workflows

---

# 2. Brand Alignment

PaperBinder uses the same visual identity as danielmaratta.com.

## Color Palette

Light Gray
`#fafafa`

Charcoal Blue
`#102d45`

Vibrant Orange (accent)
`#f67d28`

Usage rules:

- Orange is used for CTAs and interactive highlights.
- Charcoal is used for primary text and dark backgrounds.
- Light Gray is the main application background.

---

# 3. Design Tokens

These tokens provide consistent styling across components.

## Color Tokens

    --color-bg: #fafafa
    --color-text: #102d45
    --color-primary: #f67d28
    --color-border: #e6e6e6
    --color-error: #b3261e
    --color-success: #2e7d32
    --color-warning: #f59e0b

## Typography

Primary font stack:

`system-ui, -apple-system, Segoe UI, Roboto, Inter, sans-serif`

Optional accent font:

`monospace`

Used for:

- IDs
- correlation identifiers
- technical metadata

## Typography Scale

    h1: 32px
    h2: 24px
    h3: 20px
    body: 16px
    small: 14px

## Spacing Scale

4px base grid:

    4px
    8px
    12px
    16px
    24px
    32px
    48px

## Border Radius

    small: 4px
    default: 6px
    large: 8px

## Shadows

Subtle elevation only:

    card shadow:
        0 1px 2px rgba(0,0,0,0.05)

Avoid deep shadow stacks.

---

# 4. Core Layout Model

PaperBinder has two host environments:

Root host
`lab.danielmaratta.com`

Tenant host
`{tenant}.lab.danielmaratta.com`

Each environment has a different shell layout.

---

# 5. Root Host Layout

Root pages are simple and marketing-light.

Layout:

    Header
        logo
        navigation
    Main content
        welcome / login / provision
    Footer (optional)

Primary CTA:

`Provision new demo tenant and log in`

Secondary action:

`Log in`

Navigation:

- About
- Repo
- Login / Logout

---

# 6. Tenant Host Layout

Tenant pages use a dashboard-style shell.

Layout:

    Top bar
        tenant name
        lease timer
        logout

    Side navigation
        Home
        Binders
        Users

    Main content
        page-specific view

The lease status banner is always visible in the tenant shell.

---

# 7. Page-Level Layouts

## Welcome Page

Purpose: explain the demo and allow provisioning.

Sections:

    intro text
    challenge widget
    primary CTA
    login option

## Login Page

Fields:

    username
    password
    challenge verification

On success:

Redirect to tenant subdomain.

## Tenant Dashboard

Content:

    lease status
    quick links
    binder summary

## Binders List

Displays:

    binder list table

Columns:

    binder name
    document count
    created date

## Binder Detail

Displays:

    document list

## Document View

Displays:

    read-only document

Markdown rendering.

## Tenant Users

Admin-only page.

Displays:

    user list
    role assignment

---

# 8. Component Primitives

All UI elements should be built from a small set of primitives.

## Button

Variants:

    primary
    secondary
    danger

States:

    hover
    focus
    disabled
    loading

Primary button uses orange accent.

## Input

Standard text input with:

- label
- helper text
- inline validation

Error states display:

- red border
- error text

## Alert

Used for:

- error messaging
- system notices
- lease expiration warnings

## Banner

Used for:

- tenant lease status
- expiration warnings

Banner is persistent at top of tenant shell.

## Table

Used for:

- binder lists
- document lists
- user lists

Requirements:

- sortable columns (optional)
- accessible markup
- responsive collapse if needed

## Card

Used for:

- dashboard widgets
- grouped content

Minimal visual styling.

---

# 9. State Matrix

Every page must define behavior for these states.

Loading

Display simple skeleton or spinner.

Empty

Provide helpful message.

Example:

`No binders exist yet.`

Error

Display ProblemDetails message.

Forbidden

Show permission error.

Not Found

Display safe generic message.

Expired Tenant

Show expiration notice with guidance.

---

# 10. Responsive Behavior

PaperBinder is desktop-first.

Breakpoints:

    mobile: <640px
    tablet: 640-1024px
    desktop: >1024px

Behavior:

Mobile:

- stacked layout
- collapsible nav

Tablet:

- compact sidebar

Desktop:

- full layout

---

# 11. Motion and Interaction

Motion should be minimal.

Allowed:

- hover transitions
- button feedback
- loading indicators

Avoid:

- animated page transitions
- decorative motion

Honor:

`prefers-reduced-motion`

---

# 12. Accessibility Requirements

Minimum accessibility targets:

- keyboard navigation
- visible focus indicators
- semantic HTML
- descriptive labels
- ARIA where required

Color contrast must meet WCAG AA guidelines.

Error messages must not rely on color alone.

---

# 13. Implementation Guidance

Recommended stack:

`React + TypeScript`

Styling:

`Tailwind CSS`

Component primitives:

`Radix UI`

Reasons:

- accessible defaults
- small bundle
- modern patterns
- easy customization

This frontend stack baseline is adopted as part of the PaperBinder v1 UI contract.

---

# 14. Non-Goals for V1

The following are intentionally excluded:

- full design system
- dark mode
- advanced animation
- drag-and-drop interaction
- complex filtering UI

---

# 15. Future Evolution

Future versions may introduce:

- richer binder interactions
- document editing
- AI-assisted classification
- deeper visual branding
- multi-theme support
