# 03. Visual System

## 1. Visual objective

Adopt the core feel of the Slate Professional references:
- dark, restrained, premium-feeling homepage
- light, calm, product-first application surfaces
- cool blue emphasis instead of warm orange dominance
- cleaner hierarchy with stronger contrast and fewer explainer blocks

PaperBinder should feel more product-grade and less like a reviewer demo console.

## 2. Overall visual model

## Public site
Dark hero / dark marketing shell with blue glow, subtle gradients, clean white type, restrained line work, and product screenshot emphasis.

## Authenticated product
Light workspace surfaces with white backgrounds, cool-gray cards, dark text, and navy actions.

This split is useful because it:
- makes the public site feel deliberate and premium
- keeps the actual product UI practical and readable
- aligns well with the reference set already chosen

## 3. Color direction

These are directional tokens, not final code values.

## Core neutrals
- `bg.canvas.dark`: deep midnight navy
- `bg.canvas.light`: soft cool white
- `surface.default`: white
- `surface.subtle`: cool gray-blue
- `border.subtle`: faint cool gray
- `text.strong`: near-black navy
- `text.muted`: blue-gray

## Brand / emphasis
- `accent.primary`: restrained slate navy
- `accent.glow`: desaturated electric blue used sparingly in hero backgrounds
- `accent.success`: muted green
- `accent.warning`: subdued amber
- `accent.info`: cool blue

## Explicit direction
- orange should no longer be the dominant accent
- keep colored status badges, but cool and desaturate them
- use glow/gradient sparingly and mainly on the public hero

## 4. Typography

## Desired feel
Firm, clean, product-led, modern, restrained.

## Rules
- reduce reliance on tiny all-caps metadata
- use larger, clearer section headings
- keep body copy short and calm
- use stronger weight contrast between headline, subhead, and support text
- let one headline do the work instead of stacking too many labels

## Hierarchy model
- H1: bold, decisive, minimal
- H2: strong but calm
- H3/card titles: medium-bold
- metadata labels: small, subdued, sentence-case or restrained uppercase only where useful

## 5. Layout principles

## Public pages
- wider hero with screenshot overlap
- fewer equally weighted cards
- clearer vertical rhythm
- explicit section transitions

## Product pages
- calmer shell
- less top-heavy metadata
- clearer action grouping
- denser, more useful grids

## 6. Component direction

## Header
Public header should feel simple, stable, and product-grade:
- left-aligned wordmark
- center/right nav
- primary CTA on the right
- minimal chrome

## Buttons
- primary: dark navy fill with white text
- secondary: transparent or white with subtle border
- large radius but not playful
- generous padding

## Cards
- softer elevation
- clearer edge definition
- fewer nested explanatory panels
- white/light surfaces in product UI
- larger hero/device frame treatment on homepage

## Banners
- session/lease banners should remain visible but visually calmer
- use subtle tinted backgrounds rather than dominant warm blocks
- keep the main action obvious

## Tables/lists
- increase polish through spacing, row hover affordance, stronger headings, and cleaner status treatments
- do not over-card everything if a list/table is the clearer pattern

## Status badges
- neutral by default
- soft tints with dark text
- avoid overly saturated chips

## 7. Screenshot strategy

The actual app should be the main proof device.

## Required screenshot uses
- homepage hero screenshot
- one supporting product section screenshot or crop
- optional workflow strip with binder/document/admin states

## Screenshot treatment
- use realistic device/frame treatment only if it improves presentation
- do not stylize so heavily that the UI looks fake
- consider subtle callout annotations for:
  - binders
  - access control
  - visibility
  - session handling

## 8. App-shell redesign rules

## Current problem
The workspace shell gives too much priority to:
- tenant slug
- hostnames
- ids
- contract-oriented helper text

## Target direction
The shell should prioritize:
- page title
- user-relevant actions
- content visibility
- recent work
- access controls

## Demotion strategy
Implementation metadata should be:
- moved lower on the page
- collapsed into an info drawer/panel
- shown only when useful for reviewers
- retained in local/reviewer contexts, not primary product chrome

## 9. Mobile direction

- collapse public-site sections more aggressively
- tighten explanatory copy
- keep the primary CTA above the fold
- do not let notes or helper panels dominate small screens
- preserve screenshot proof even on mobile, though simplified

## 10. Motion and polish

Keep motion minimal.
Use only for:
- hover clarity
- subtle panel entrance
- screenshot glow/hero polish
- feedback states on buttons

Avoid:
- decorative animation
- large parallax effects
- anything that makes the demo feel less serious

## 11. Visual acceptance criteria

The redesign succeeds visually when:
- the homepage reads as a product page within 3 seconds
- the current orange/cream “demo environment” feeling is gone
- the app feels calmer and more credible without losing clarity
- screenshots do more explanatory work than panels of text
- reviewer detail is available, but no longer visually dominant

