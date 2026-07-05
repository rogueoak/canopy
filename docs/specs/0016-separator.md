# 0016 - Separator

## Problem

With the Seeds recipe established in [0005](0005-button.md), add the **Separator** atom - a thin
divider between content groups (menu sections, toolbar clusters, list groupings). Separator is
the structural hairline reused across the catalogue.

Independently shippable: one component, one PR. Follows the 0005 recipe - no new infra beyond
the Radix Separator primitive.

## Outcome

- `@rogueoak/canopy/seeds` exports an accessible, themed `Separator`.
- Built on `@radix-ui/react-separator`; horizontal/vertical, decorative vs semantic.
- Stories (horizontal · vertical · decorative · semantic · both themes) and tests (render ·
  orientation · role/a11y).
- README/Storybook updated; `0016` ticked.

## Scope

### In
- **Separator** - Radix Separator; `orientation` horizontal / vertical; `decorative` flag
  (decorative → no role; semantic → `role="separator"` with orientation aria). Forwards `ref`,
  spreads native props.
- New dep on `@rogueoak/canopy`: `@radix-ui/react-separator`.
- Stories: horizontal, vertical, decorative, semantic - light and dark.
- Tests: render, orientation, decorative vs semantic role/aria.

### Out
- **Labelled/"or" dividers** (text in the middle of the rule) → later (a Twig composing
  Separator + text).

## Approach

Follows the **0005 recipe**: cva for orientation variants → semantic-token utilities, `cn()`
for merging, semantic tokens only, theme-agnostic by construction. The rule uses the `border`
token (`border-strong` available where a heavier divider is wanted). Radix handles the
decorative vs semantic ARIA distinction. Vitest + Testing Library verifies role/orientation.

## Acceptance

- [ ] `Separator` exported from `@rogueoak/canopy/seeds`, semantic tokens only, light **and** dark.
- [ ] Built on `@radix-ui/react-separator`; horizontal **and** vertical.
- [ ] Decorative (no role) vs semantic (`role="separator"` + orientation) handled correctly.
- [ ] Uses the `border` token; forwards `ref`, spreads native props.
- [ ] Stories cover orientations/modes in both themes; tests (render + orientation + a11y) pass.
- [ ] README/Storybook updated; `0016` ticked.
- [ ] Developer sign-off in Storybook.
