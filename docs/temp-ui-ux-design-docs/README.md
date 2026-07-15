# PaperBinder Redesign Document Set (Draft)

Status: Exploratory draft material for internal planning only. This folder is not active canon and is intentionally excluded from the main docs navigation surfaces.

This document set translates the current audit plus the supplied visual references into an implementation-oriented redesign package that must be reconciled against the real codebase before use.

## Intent

PaperBinder should present as a **polished, product-style multi-tenant document workspace** while remaining honest about what it currently is: a live, reviewable demo artifact with real software behind it.

The target is deliberately in-between:
- more product-first than the current reviewer-console presentation
- more credible and specific than a vague “secure documents” marketing shell
- less commercialized than a fake startup website
- more visually controlled, calmer, and more demoable than the current orange/cream presentation

## What this set includes

1. **`01-product-direction.md`**
   Core positioning, target audience, messaging hierarchy, narrative split, and non-goals.

2. **`02-information-architecture-and-copy.md`**
   Public-site IA, page structure, CTA strategy, and a first-pass copy deck.

3. **`03-visual-system.md`**
   Visual direction derived from the Slate Professional references, adapted for PaperBinder.

4. **`04-screen-specifications.md`**
   Page-by-page UX and layout guidance for marketing, demo-entry, and authenticated product surfaces.

5. **`05-codex-migration-plan-draft.md`**
   A realistic phased migration plan draft that must be verified and adjusted against the actual codebase.

## How to use this set

Treat these documents as:
- **directionally authoritative** on product framing, tone, and visual intent
- **structurally suggestive** on IA and page composition
- **non-authoritative** on route names, component names, state ownership, data contracts, and file paths until verified in code

Map the real application first, then refine this package into repo-accurate implementation plans.

## Source alignment

This document set is intentionally aligned to the provided audit:
- move the main path from onboarding mechanics to product proof
- show the real app earlier
- demote reviewer/architecture narration into a secondary lane
- shift the visual system toward white, blue, and cool neutrals
- reduce metadata-heavy app chrome
- preserve future commercialization optionality without pretending PaperBinder is already a mature software company
