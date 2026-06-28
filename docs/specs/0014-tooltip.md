# 0014 - Tooltip

## Problem

With the Seeds recipe established in [0005](0005-button.md), add the **Tooltip** atom - a small
hover/focus hint for icon buttons, truncated text, and terse labels. Tooltip is the lightweight
contextual-help primitive used across the catalogue.

Independently shippable: one component, one PR. Follows the 0005 recipe - no new infra beyond
the Radix Tooltip primitive.

## Outcome

- `@rogueoak/canopy/seeds` exports an accessible, themed Tooltip family
  (`TooltipProvider`, `Tooltip`, `TooltipTrigger`, `TooltipContent`).
- Built on `@radix-ui/react-tooltip`; portalled content styled with raised-surface tokens,
  configurable delay, optional arrow.
- Stories (default · with arrow · sides/placements · both themes) and tests (render · hover/focus
  open · a11y).
- README/Storybook updated; `0014` ticked.

## Scope

### In
- **Tooltip family** - Radix Tooltip: provider (shared delay) + root + trigger + portalled
  content with an optional arrow. Opens on hover and keyboard focus, closes on blur/escape
  (Radix); `delayDuration` passthrough; side/align passthrough. Forwards `ref`, spreads native
  props.
- New dep on `@rogueoak/canopy`: `@radix-ui/react-tooltip`.
- Stories: default, with arrow, different sides/placements - light and dark.
- Tests: render, opens on hover and focus, content has tooltip semantics, escape closes.

### Out
- **Popover / HoverCard / rich interactive content** → separate, later specs (tooltips hold
  short, non-interactive text only).

## Approach

Follows the **0005 recipe**: cva for variants → semantic-token utilities, `cn()` for merging,
semantic tokens only, theme-agnostic by construction. Portalled `TooltipContent` and arrow use
`surface-raised` + `border` + an elevation shadow with `text`; an inverted variant can use
`overlay` / `text-inverted` if desired. Vitest + Testing Library + user-event verifies
hover/focus open.

## Acceptance

- [ ] Tooltip family exported from `@rogueoak/canopy/seeds`, semantic tokens only, light **and**
      dark.
- [ ] Built on `@radix-ui/react-tooltip`; portalled content uses `surface-raised`/`border`/shadow.
- [ ] Opens on hover **and** keyboard focus; configurable delay; optional arrow.
- [ ] Correct tooltip role/aria; escape/blur closes (verified in tests).
- [ ] Stories cover placements/arrow in both themes; tests (render + open + a11y) pass.
- [ ] README/Storybook updated; `0014` ticked.
- [ ] Developer sign-off in Storybook.
