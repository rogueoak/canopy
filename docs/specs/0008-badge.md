# 0008 - Badge

## Problem

Round out the first Seeds batch with **Badge** - a small, non-interactive label for status and
metadata. It's the first component to exercise the semantic **status** tokens
(`success`/`warning`/`danger`/`info`) end-to-end, proving they read correctly in both themes.

Independently shippable: one component, one PR. Follows the [0005](0005-button.md) recipe - no
new infra, no Radix (it's presentational).

## Outcome

- `@rogueoak/canopy/seeds` exports a themed `Badge`.
- Variants map to semantic role/status tokens; light/dark "just works" via 0004.
- Stories (every variant, both themes) and tests (render · variant classes).
- README/Storybook updated; `0008` ticked - first Seeds batch complete.

## Scope

### In
- **Badge** - variants `neutral` / `primary` / `success` / `warning` / `danger` / `info`,
  using the semantic status tokens. Optional subtle vs. solid emphasis if it stays within the
  token set without bespoke values. Renders as `span` (presentational); `asChild` optional.
- Stories: every variant, light and dark.
- Tests: render, variant→class mapping.

### Out
- Interactive/dismissible chips (a Twig) → later.
- Count/notification dot variants → follow-up if needed.

## Approach

Follows the **0005 recipe**: cva variant→semantic-token mapping, `cn()`, semantic tokens only,
theme-agnostic by construction. No Radix needed (non-interactive). The status variants are the
first real consumers of the functional ramps' semantic roles - stories in both themes are the
verification that those roles are legible.

## Acceptance

- [ ] `Badge` exported from `@rogueoak/canopy/seeds`, semantic tokens only, light **and** dark.
- [ ] Variants `neutral`/`primary`/`success`/`warning`/`danger`/`info` via status tokens.
- [ ] Stories cover every variant in both themes; tests (render + variants) pass.
- [ ] README/Storybook updated; `0008` ticked.
- [ ] Developer sign-off in Storybook.
