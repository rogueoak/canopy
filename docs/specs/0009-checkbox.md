# 0009 - Checkbox

## Problem

With the Seeds recipe established in [0005](0005-button.md), grow the next form atom: a
**Checkbox**. Boolean selections (terms, filters, toggle lists) are everywhere in rogueoak
apps; Checkbox is the field primitive those controls and later Twigs build on.

Independently shippable: one component, one PR. Follows the 0005 recipe - no new infra beyond
the Radix Checkbox primitive.

## Outcome

- `@rogueoak/canopy/seeds` exports an accessible, themed `Checkbox`.
- Built on `@radix-ui/react-checkbox`; pairs with Label via `htmlFor`/`id`.
- Stories (checked · unchecked · indeterminate · disabled · with Label · both themes) and
  tests (render · state changes · a11y).
- README/Storybook updated; `0009` ticked.

## Scope

### In
- **Checkbox** - Radix Checkbox; `checked` / `unchecked` / `indeterminate` states; `disabled`;
  focus-visible ring; check + indeterminate indicator icons. Forwards `ref`, spreads native
  props.
- New dep on `@rogueoak/canopy`: `@radix-ui/react-checkbox`.
- Stories: checked, unchecked, indeterminate, disabled, paired with a Label - light and dark.
- Tests: render, toggle (controlled + uncontrolled), indeterminate, disabled, focus ring,
  aria.

### Out
- **Switch** (0010) and **Radio Group** (0011) - sibling selection atoms, separate specs.
- Twig-level FormField (label + control + error/help) → later.

## Approach

Follows the **0005 recipe**: cva for state variants → semantic-token utilities, `cn()` for
merging, semantic tokens only, theme-agnostic by construction. Checked fill uses `primary` /
`primary-foreground`; border uses `border` → `border-strong`; focus uses `ring`; disabled uses
`disabled` / `disabled-foreground`. Vitest + Testing Library + user-event.

## Acceptance

- [x] `Checkbox` exported from `@rogueoak/canopy/seeds`, semantic tokens only, light **and** dark.
- [x] Built on `@radix-ui/react-checkbox`; checked / unchecked / indeterminate / disabled.
- [x] Focus-visible ring; correct `role`/`aria-checked` (verified in tests).
- [x] Forwards `ref`, spreads native props; pairs with Label.
- [x] Stories cover all states in both themes; tests (render + states + a11y) pass.
- [x] Storybook updated (`Seeds/Checkbox`). README roadmap is layer-based - central reflection handles the roadmap.
- [ ] Developer sign-off in Storybook.
