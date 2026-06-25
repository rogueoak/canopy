# 0004 — Dark destructive hover was invisible (danger-hover == danger)

Source: designer review of PR #7 (Button, spec 0005) — a **major**. Surfaced by the first
real component to render the destructive role; the Foundations swatches never showed it.

## Symptom

The destructive Button had no visible hover in **dark** mode. Pressing/hovering it did nothing
visually, while in light mode it darkened correctly (`danger.600` → `.700`).

## Root cause

Two compounding gaps in the Roots token layer:

1. **Collision.** In `.dark`, `color-danger` resolved to `danger.300` and `color-danger-hover`
   *also* resolved to `danger.300` — identical fills, so `hover:bg-danger-hover` was a no-op.
   The dark `danger` base sits at `.300` (not `.400` like success/warning) so the near-black
   `danger-foreground` keeps AA; the dark hover was left at `.300` and never differentiated.
2. **The guard didn't catch it.** `tokens.test.ts`'s AA contrast guard checks every role pair
   in both themes, and the dark-coverage guard checks that each dark override *differs from its
   light value*. Neither checks that a role's **hover/active differ from its own base within a
   theme**. So a hover equal to its base passed every test.

There was also no `danger-active` at all, so the most consequential button gave no press state
(unlike primary/secondary) — a related minor from the same review.

## Fix

Token layer (`packages/roots/tokens/color/`):
- Dark `danger-hover`: `danger.300` → **`danger.200`** (lifts toward light, like the other
  near-black-foreground roles; AA improves).
- Added **`danger-active`**: light `danger.800` (deepens `600 → 700 → 800` like primary/
  secondary), dark `danger.100` (continues the dark `.300 → .200 → .100` lighten-on-press path).

Guard (`packages/roots/tokens.test.ts`):
- New describe — **base/hover/active resolve to distinct hexes within each theme** (light and
  dark), for primary/secondary/danger. This directly closes the gap that let the collision ship.
- Added `danger-foreground` on `danger-active` to the AA contrast pairs.

Component (`packages/canopy/src/seeds/Button.tsx`):
- Destructive variant gains `active:bg-danger-active`, matching primary/secondary.

## Learning

Rolled into `overview/learnings.md`: **guard interaction states for within-theme distinctness,
not just cross-theme difference and AA.** A swatch grid renders each token in isolation, so a
hover that equals its base looks fine there — only a real interactive component reveals it.
Expect the first component that exercises a role to expose token gaps the Foundations stories
can't; treat that as the token layer's true acceptance test.
