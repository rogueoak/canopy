# 0011 - Radio Group

## Problem

With the Seeds recipe established in [0005](0005-button.md), add the **Radio Group** atom - 
single-choice selection from a small set (plans, options, segmented preferences). Radio Group
is the mutually-exclusive selection primitive for forms and later Twigs.

Independently shippable: one component, one PR. Follows the 0005 recipe - no new infra beyond
the Radix Radio Group primitive.

## Outcome

- `@rogueoak/canopy/seeds` exports accessible, themed `RadioGroup` + `RadioGroupItem`.
- Built on `@radix-ui/react-radio-group`; items pair with Label via `htmlFor`/`id`.
- Stories (default · selected · disabled item · disabled group · with Labels · both themes) and
  tests (render · selection · keyboard · a11y).
- README/Storybook updated; `0011` ticked.

## Scope

### In
- **RadioGroup** (root) + **RadioGroupItem** - Radix Radio Group; single-selection; roving
  keyboard focus (arrow keys move + select); per-item and whole-group `disabled`;
  focus-visible ring; selected indicator dot. Forwards `ref`, spreads native props.
- New dep on `@rogueoak/canopy`: `@radix-ui/react-radio-group`.
- Stories: default, selected, one disabled item, disabled group, items paired with Labels - 
  light and dark.
- Tests: render, selection, arrow-key roving focus, disabled (item + group), focus ring, aria.

### Out
- **Checkbox** (0009) and **Switch** (0010) - sibling selection atoms, separate specs.
- Twig-level FormField (label + control + error/help) → later.

## Approach

Follows the **0005 recipe**: cva for state variants → semantic-token utilities, `cn()` for
merging, semantic tokens only, theme-agnostic by construction. Radix Radio Group supplies the
roving-focus keyboard model. Selected dot/border uses `primary`; idle border uses `border` →
`border-strong`; focus uses `ring`; disabled uses `disabled` / `disabled-foreground`. Vitest +
Testing Library + user-event verifies arrow-key navigation.

## Acceptance

- [ ] `RadioGroup` + `RadioGroupItem` exported from `@rogueoak/canopy/seeds`, semantic tokens
      only, light **and** dark.
- [ ] Built on `@radix-ui/react-radio-group`; single-selection; arrow-key roving focus.
- [ ] Per-item and whole-group `disabled`; focus-visible ring; correct `role`/`aria-checked`.
- [ ] Forwards `ref`, spreads native props; items pair with Label.
- [ ] Stories cover states in both themes; tests (render + selection + keyboard + a11y) pass.
- [ ] README/Storybook updated; `0011` ticked.
- [ ] Developer sign-off in Storybook.
