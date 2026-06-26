# 0018 — Skeleton

## Problem

With the Seeds recipe established in [0005](0005-button.md), add the **Skeleton** atom — a
loading placeholder that holds layout while content fetches (cards, lists, avatars). Skeleton is
the perceived-performance primitive reused across the catalogue.

Independently shippable: one component, one PR. Follows the 0005 recipe — pure CSS, no Radix.

## Outcome

- `@rogueoak/canopy/seeds` exports a themed `Skeleton`.
- Pure CSS shimmer/pulse on a muted fill; respects reduced-motion.
- Stories (block · text lines · avatar/circle · card composition · reduced-motion · both themes)
  and tests (render · reduced-motion · a11y-neutral).
- README/Storybook updated; `0018` ticked.

## Scope

### In
- **Skeleton** — a block element with a `muted` fill and an animated shimmer/pulse; sizing and
  shape come from passed `className` (width/height/rounded), so it composes into any
  placeholder. Decorative/`aria-hidden` by default (the loading region announces busy-ness, not
  the skeleton). Respects `prefers-reduced-motion` (shimmer reduced/stilled). Forwards `ref`,
  spreads native props.
- No new dep (pure CSS).
- Stories: single block, stacked text lines, circle (avatar), a card composition,
  reduced-motion — light and dark.
- Tests: render, reduced-motion respected, decorative (aria-hidden) by default.

### Out
- **Prebuilt skeleton templates** (SkeletonCard, SkeletonTable) → later Twig compositions.
- **Spinner** (0017) — sibling loading atom, separate spec.

## Approach

Follows the **0005 recipe**: cva (minimal — mostly a base) → semantic-token utilities, `cn()`
for merging, semantic tokens only, theme-agnostic by construction. Fill uses `muted`; the
shimmer sweeps a subtly lighter band and is gated behind `motion-safe` /
`prefers-reduced-motion` so reduced-motion users see a static or gently-pulsed block. Vitest +
Testing Library verifies the reduced-motion path and aria-hidden default.

## Acceptance

- [ ] `Skeleton` exported from `@rogueoak/canopy/seeds`, semantic tokens only, light **and** dark.
- [ ] Uses the `muted` token; shimmer/pulse respects `prefers-reduced-motion`.
- [ ] Decorative (`aria-hidden`) by default; shape/size driven by `className`.
- [ ] Forwards `ref`, spreads native props.
- [ ] Stories cover block/text/circle/card + reduced-motion in both themes; tests pass.
- [ ] README/Storybook updated; `0018` ticked.
- [ ] Developer sign-off in Storybook.
