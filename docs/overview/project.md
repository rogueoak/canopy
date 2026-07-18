# Project

## Status

**1.0.0 - shipped.** The component library is feature-complete: all four tiers are live and
published to npm under the `@rogueoak` scope - Roots (tokens), 18 Seeds, 14 Twigs, and 26
Branches (58 components in all), plus the `@rogueoak/icons` set. The remaining tier, Boughs
(page scaffolds), and the native/Swift target are the future direction; the web library is done.

## Mission

**Canopy** is the design system for the **rogueoak** org - the source of truth for the look
and feel of rogueoak's products and website. It exists so every rogueoak interface is built
from one considered, earthy foundation instead of being reinvented per app.

## What it is

- A **tree-themed, atomic** design system: Roots (tokens) → Seeds (atoms) → Twigs
  (molecules) → Branches (organisms) → Boughs (templates); **Canopy** is the whole.
- Built on **Radix + shadcn + Tailwind v4 + TypeScript**.
- A **semantic token layer** (Roots) that every component styles against - never raw
  values - so theming (light/dark, future brands) is a token concern, not a component one.
- Shipped as **versioned npm packages** under the `@rogueoak` scope: `@rogueoak/roots`
  (tokens), `@rogueoak/canopy` (components), and `@rogueoak/icons` (icons).
- Showcased in **Storybook on GitHub Pages**.

## Principles

- **Foundation first.** Get colour, type, and spacing right and locked before building
  components on top of them.
- **Always working software and working docs.** Every change keeps the README and these
  living docs truthful to what actually works - docs never outrun the software.
- **Future-proof tokens.** Roots is a Style Dictionary source of truth, so a native (Swift)
  target can be added later without rewriting tokens.

## Direction

Built spec-by-spec via Spectra, foundation-first: README → skeleton → Roots → theming →
Seeds → higher composition layers. See [`docs/specs/`](../specs) for the spec trail and the
README roadmap for current status.
