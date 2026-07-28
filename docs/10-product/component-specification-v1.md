# Component Specification - V1
Status: Current V1 implementation contract, narrowed by the V1.1 presentation canon

## AI Summary

- Defines canonical component behavior for PaperBinder V1.
- Standardizes variants, states, accessibility, and usage constraints.
- Favors simple primitives and composition for implementation clarity.
- Aligns with V1 scope and deterministic UX goals.

This document defines canonical UI component behavior for PaperBinder.

Purpose:

- eliminate ambiguity during implementation
- standardize component behavior
- ensure accessibility and consistency
- support deterministic AI-assisted development

Components defined here are implementation primitives used throughout the UI.

The UI system should prefer **composition of simple primitives** over complex component abstractions.

---

# 1. Component Design Principles

All components should follow these principles:

Clarity
Interfaces must be immediately understandable.

Consistency
Components behave the same across all pages.

Accessibility
Keyboard navigation and semantic markup must be supported.

Minimalism
Components should avoid unnecessary visual decoration.

Predictability
Actions should produce immediate, visible feedback.

---

# 2. Button

Buttons represent primary user actions.

Variants:

    primary
    secondary
    danger

## Primary Button

Purpose:

Used for main user actions.

Examples:

`Provision tenant`

`Login`

Visual style:

    background: primary color
    text: white
    border: none

States:

    hover
        slightly darker background

    focus
        visible focus ring

    disabled
        reduced opacity
        cursor not-allowed

    loading
        spinner indicator
        click disabled

## Secondary Button

Purpose:

Less prominent actions.

Examples:

`Extend lease`

`Cancel`

Visual style:

    background: transparent
    border: subtle
    text: primary text color

## Danger Button

Purpose:

Destructive actions.

Examples:

`Delete user`

Visual style:

    background: error color
    text: white

---

# 3. Input Field

Standard text input.

Structure:

    label
    input
    helper text (optional)
    error message (optional)

Behavior:

Label must always be present.

Inputs must support keyboard navigation.

## Validation

Validation should occur:

- on form submit
- optionally on blur

Error state:

    border color: error
    error message displayed below field

Example message:

`Email is required.`

---

# 4. Form

Forms group related input fields and submission logic.

Form structure:

    title
    input fields
    primary submit button
    optional secondary actions

Guidelines:

- forms should not exceed ~6 fields
- validation errors appear inline
- server errors appear as alert banner

Submission state:

    button shows loading indicator
    form inputs disabled during submission

---

# 5. Alert

Alerts communicate system messages.

Variants:

    error
    success
    warning
    info

Structure:

    icon (optional)
    message text

Alerts should appear above the main content area.

Example error:

`Provisioning failed. Please try again.`

Alerts should not auto-dismiss unless informational.

Toast notifications:

- are separate from inline alerts and are used for async success, warning, error, and informational feedback
- appear as top-center overlays above page content
- auto-dismiss on a timed countdown, but always remain manually dismissible; the countdown pauses on hover or keyboard focus so a reader is never raced against the timer
- use conventional status coloring:
  - success: green
  - warning: yellow
  - error: red
  - info: blue

---

# 6. Banner

Banners communicate persistent system status.

Used primarily for:

- tenant lease status
- expiration warnings

Placement:

Top of tenant shell.

Example message:

`Tenant expires in 23 minutes.`

Extension-window warning:

Displayed only when the server-authoritative lease state reports that the extension window is open.

If the UI mentions upcoming eligibility before the window opens, it should stay qualitative unless an explicit contract field is added for that exact message.

Banner variants:

    neutral
    warning
    error

---

# 7. Table

Tables display structured lists.

Used for:

- binders
- documents
- users

Table structure:

    header row
    data rows

Requirements:

- column headers always visible
- rows keyboard navigable
- accessible markup (`table`, `thead`, `tbody`)
- search and filter controls are optional and are not required for the V1.1 presentation-alignment work

Columns should be left-aligned.

Avoid:

- dense tables
- complex nested rows

---

# 8. Card

Cards group related content.

Used for:

- dashboard widgets
- informational sections

Visual style:

    light background
    subtle border
    minimal shadow

Structure:

    title
    body content

---

# 9. Navigation

Navigation elements allow movement between pages.

Two navigation contexts exist:

Root host navigation
Tenant host navigation

## Root Navigation

Structure:

    logo
    navigation links
    login/logout action

Links:

    Start Demo
    About
    Reviewer Notes
    Repo
    Login/Logout

## Tenant Navigation

Structure:

    sidebar navigation
    top bar status

Sidebar links:

    Home
    Binders
    Users

---

# 10. Loading Indicators

Loading indicators communicate background operations.

Acceptable patterns:

Spinner

Skeleton placeholders

Example spinner placement:

- button loading state
- full page load
- table loading

Avoid:

- blocking entire page unnecessarily

---

# 11. Empty States

Empty states help guide users.

Example:

Binders page empty state:

`No binders exist yet.`

Optional guidance:

`Create a binder to organize documents.`

Empty states should be informative but minimal.

---

# 12. Error States

Error states must be explicit.

Sources of errors:

- API errors
- validation errors
- permission errors
- expired tenant

Errors should display:

- human-readable message
- minimal technical information

---

# 13. Not Found State

Used when resources do not exist.

Example:

`The requested resource could not be found.`

Avoid leaking internal system details.

---

# 14. Expired Tenant State

If a tenant lease expires:

Display page:

    title
        Tenant expired

    message
        This demo tenant has expired.

    action
        Return to root site.

No internal system details should be displayed.

---

# 15. Accessibility Requirements

All components must support:

Keyboard navigation

Visible focus state

Semantic HTML

Form labels and aria attributes where needed.

Focus order must follow logical layout order.

---

# 16. Implementation Guidance

Components should be implemented using:

`React + TypeScript`

Styling:

`Tailwind CSS`

Accessibility primitives:

`Radix UI`

This combination provides:

- accessible defaults
- predictable behavior
- minimal custom logic

This frontend stack baseline is adopted as part of the PaperBinder v1 UI contract.

## Responsive Breakpoints

Layout-collapsing CSS and JS viewport logic must reuse one of four canonical breakpoints — 420px, 768px, 1024px, and 1180px — rather than introducing a new value per component. See `docs/90-adr/ADR-0015-responsive-breakpoint-policy.md` for the full rationale, the exact meaning of each tier, and the reference QA widths used to verify them.

---

# 17. Versioning

This specification defines the component contract for:

PaperBinder V1.

Future versions may expand:

- component variants
- theme support
- richer interactions
