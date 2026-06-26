# 0015 — Avatar

## Problem

With the Seeds recipe established in [0005](0005-button.md), add the **Avatar** atom — a user
image with a graceful initials fallback for headers, comment rows, and member lists. Avatar is
the identity primitive reused across the catalogue.

Independently shippable: one component, one PR. Follows the 0005 recipe — no new infra beyond
the Radix Avatar primitive.

## Outcome

- `@rogueoak/canopy/seeds` exports an accessible, themed Avatar family
  (`Avatar`, `AvatarImage`, `AvatarFallback`).
- Built on `@radix-ui/react-avatar`; image with initials fallback while loading or on error.
- Stories (image · fallback initials · sizes · shapes · both themes) and tests (render ·
  fallback · a11y).
- README/Storybook updated; `0015` ticked.

## Scope

### In
- **Avatar family** — Radix Avatar: root + image + fallback. Fallback shows initials (or a
  placeholder) when the image is missing, loading, or errors. Sizes `sm` / `md` / `lg`; shape
  `circle` / `square` (rounded). Forwards `ref`, spreads native props.
- New dep on `@rogueoak/canopy`: `@radix-ui/react-avatar`.
- Stories: with image, fallback initials, each size, each shape — light and dark.
- Tests: render image, fallback on error/missing src, sizes/shapes, `alt`/aria.

### Out
- **Avatar group / stacked avatars** and **presence/status badge overlay** → later (Twig or a
  follow-up Seed).

## Approach

Follows the **0005 recipe**: cva for size/shape variants → semantic-token utilities, `cn()` for
merging, semantic tokens only, theme-agnostic by construction. Radix Avatar handles the
load/error → fallback swap. Fallback surface uses `muted` / `muted-foreground`; ring/border (if
any) uses `border`. Vitest + Testing Library verifies the fallback path.

## Acceptance

- [ ] Avatar family exported from `@rogueoak/canopy/seeds`, semantic tokens only, light **and**
      dark.
- [ ] Built on `@radix-ui/react-avatar`; image renders, initials fallback on missing/error.
- [ ] Sizes `sm`/`md`/`lg`; shapes circle/square; accessible `alt`.
- [ ] Forwards `ref`, spreads native props.
- [ ] Stories cover image/fallback/sizes/shapes in both themes; tests (render + fallback + a11y)
      pass.
- [ ] README/Storybook updated; `0015` ticked.
- [ ] Developer sign-off in Storybook.
