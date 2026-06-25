# 0013 — Select

## Problem

With the Seeds recipe established in [0005](0005-button.md), add the **Select** atom — a
single-choice dropdown for longer option lists where a Radio Group would be too tall (country,
status, category). Select is the menu-style field primitive for forms and later Twigs.

Independently shippable: one component, one PR. Follows the 0005 recipe — no new infra beyond
the Radix Select primitive.

## Outcome

- `@rogueoak/canopy/seeds` exports an accessible, themed Select family
  (`Select`, `SelectTrigger`, `SelectContent`, `SelectItem`, plus value/group/label parts).
- Built on `@radix-ui/react-select`; portalled content styled with raised-surface tokens.
- Stories (default · open · selected · disabled · disabled item · invalid · both themes) and
  tests (render · selection · keyboard · a11y).
- README/Storybook updated; `0013` ticked.

## Scope

### In
- **Select family** — Radix Select: trigger + portalled content + items (with grouping/labels
  and a selected indicator). Keyboard open/close + arrow navigation + typeahead (Radix);
  `disabled` trigger and `disabled` items; `invalid` (aria-invalid) trigger mirroring Input;
  focus-visible ring on trigger. Forwards `ref`, spreads native props.
- New dep on `@rogueoak/canopy`: `@radix-ui/react-select`.
- Stories: default, open, selected, disabled trigger, disabled item, invalid — light and dark.
- Tests: render, open/select, arrow-key + typeahead navigation, disabled, invalid/aria, focus.

### Out
- **Multi-select / combobox / async search** → separate, later specs (different interaction
  model).
- **Label** (0007) — pairs with Select but ships separately.
- Twig-level FormField (label + control + error/help) → later.

## Approach

Follows the **0005 recipe**: cva for state variants → semantic-token utilities, `cn()` for
merging, semantic tokens only, theme-agnostic by construction. Trigger mirrors Input's token
mapping (border, `ring`, `danger` for invalid, `disabled`). Portalled `SelectContent` uses
`surface-raised` + `border` + an elevation shadow; items use `text`, with hover/active via
`muted` / `accent` highlight and selected via `primary`. Vitest + Testing Library + user-event.

## Acceptance

- [ ] Select family exported from `@rogueoak/canopy/seeds`, semantic tokens only, light **and**
      dark.
- [ ] Built on `@radix-ui/react-select`; portalled content uses `surface-raised`/`border`/shadow.
- [ ] Keyboard open/select/typeahead; `disabled` trigger + items; `invalid` (aria-invalid).
- [ ] Focus-visible ring on trigger; correct roles/aria (verified in tests).
- [ ] Stories cover states in both themes; tests (render + selection + keyboard + a11y) pass.
- [ ] README/Storybook updated; `0013` ticked.
- [ ] Developer sign-off in Storybook.
