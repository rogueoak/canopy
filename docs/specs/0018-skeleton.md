# 0018 - Skeleton

## Problem

With the Seeds recipe established in [0005](0005-button.md), add the **Skeleton** atom - a
loading placeholder that holds layout while content fetches (cards, lists, avatars). Skeleton is
the perceived-performance primitive reused across the catalogue.

Independently shippable: one component, one PR. Follows the 0005 recipe - pure CSS, no Radix.

## Outcome

- `@rogueoak/canopy/seeds` exports a themed `Skeleton`.
- Pure CSS pulse on a `muted-raised` fill; respects reduced-motion.
- Stories (block · text lines · avatar/circle · card composition · both themes) and tests
  (render · reduced-motion · a11y-neutral).
- Storybook updated.

## Scope

### In
- **Skeleton** - a block element with a `muted-raised` fill and an `animate-pulse`; sizing and
  shape come from passed `className` (width/height/rounded), so it composes into any
  placeholder. Decorative/`aria-hidden` by default (the loading region announces busy-ness, not
  the skeleton). Respects `prefers-reduced-motion` (the pulse is stilled). Forwards `ref`,
  spreads native props.
- No new dep (pure CSS).
- Stories: single block, stacked text lines, circle (avatar), a card composition - light and dark.
- Tests: render, reduced-motion respected, decorative (aria-hidden) by default.

### Out
- **Prebuilt skeleton templates** (SkeletonCard, SkeletonTable) → later Twig compositions.
- **A sweeping shimmer band** → out of scope; the pulse (opacity) is the chosen treatment.
- **Spinner** (0017) - sibling loading atom, separate spec.

## Approach

Follows the **0005 recipe**: `cn()` merge, semantic-token utilities only, theme-agnostic by
construction. Fill uses **`muted-raised`** (not base `muted`, which collapses to the same
`stone.900` as `surface` in dark and would make a skeleton on a card invisible - feedback 0006);
`muted-raised` steps off both the page canvas and a raised surface in either theme. The pulse is
`animate-pulse`, gated with `motion-reduce:animate-none` so reduced-motion users see a static
block. Vitest + Testing Library verifies the reduced-motion class and the aria-hidden default.

## Acceptance

- [ ] `Skeleton` exported from `@rogueoak/canopy/seeds`, semantic tokens only, light **and** dark.
- [ ] Uses the `muted-raised` token (visible on any surface in both themes); the pulse respects
      `prefers-reduced-motion`.
- [ ] Decorative (`aria-hidden`) by default; shape/size driven by `className`.
- [ ] Forwards `ref`, spreads native props.
- [ ] Stories cover block/text/circle/card in both themes; tests pass.
- [ ] Storybook updated.
- [ ] Developer sign-off in Storybook.
