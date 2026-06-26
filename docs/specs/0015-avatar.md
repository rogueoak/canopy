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
- Stories (image · fallback initials · sizes · both themes) and tests (render · fallback · a11y).
- Storybook updated.

## Scope

### In
- **Avatar family** — Radix Avatar: root + image + fallback. Fallback shows initials (or a
  placeholder) when the image is missing, loading, or errors. Sizes `sm` / `md` / `lg` (the size
  also scales the fallback initials). Always a circle (`rounded-full`). Forwards `ref`, spreads
  native props.
- New dep on `@rogueoak/canopy`: `@radix-ui/react-avatar`.
- Stories: with image, fallback initials, each size — light and dark.
- Tests: fallback renders (jsdom never fires image load, so the fallback is the testable path),
  sizes, `alt`/aria.

### Out
- **Shape variants** (square / rounded-square) → deferred; most avatars are circles, so the root
  is `rounded-full` only for now. A `shape` variant can follow if demand warrants.
- **Avatar group / stacked avatars** and **presence/status badge overlay** → later (Twig or a
  follow-up Seed).

## Approach

Follows the **0005 recipe**: cva for the `size` variant → semantic-token utilities, `cn()` for
merging, semantic tokens only, theme-agnostic by construction. Radix Avatar handles the
load/error → fallback swap. Fallback surface uses `muted` / `muted-foreground`; the size's
font-size lives on the root so the initials inherit it and scale with the circle. Vitest +
Testing Library verifies the fallback path (jsdom can't load the image).

## Acceptance

- [ ] Avatar family exported from `@rogueoak/canopy/seeds`, semantic tokens only, light **and**
      dark.
- [ ] Built on `@radix-ui/react-avatar`; initials fallback on missing/error; image `object-cover`.
- [ ] Sizes `sm`/`md`/`lg` (initials scale with size); circle shape; accessible `alt`.
- [ ] Forwards `ref`, spreads native props.
- [ ] Stories cover image/fallback/sizes in both themes; tests (render + fallback + a11y) pass.
- [ ] Storybook updated.
- [ ] Developer sign-off in Storybook.
