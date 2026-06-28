# 0006 - Input

## Problem

With the Seeds recipe established in [0005](0005-button.md), grow the next atom: a text
**Input**. Forms are the backbone of rogueoak apps; Input is the field primitive every form
control and Twig (FormField, SearchBar) will build on.

Independently shippable: one component, one PR. Follows the 0005 recipe - no new infra.

## Outcome

- `@rogueoak/canopy/seeds` exports an accessible, themed `Input`.
- Styled with semantic tokens only; light/dark "just works" via 0004.
- Stories (states · sizes · both themes) and tests (render · states · a11y).
- README/Storybook updated; `0006` ticked.

## Scope

### In
- **Input** - text input; focus-visible ring; `invalid` (aria-invalid) and `disabled` states;
  sizes `sm` / `md` / `lg` consistent with Button. Forwards `ref`, spreads native props,
  `type` passthrough.
- Stories: default, focused, invalid, disabled, sizes - light and dark.
- Tests: render, value/onChange, disabled, invalid/aria, focus ring.

### Out
- **Label** (0007) - pairs with Input but ships separately.
- Textarea, Select, Checkbox, Switch → follow-up Seeds specs.
- Twig-level FormField (label + input + error + help) → later.

## Approach

Follows the **0005 recipe**: cva for size/state variants → semantic-token utilities, `cn()`
for merging, semantic tokens only, theme-agnostic by construction. Invalid state uses the
`danger`/`ring` tokens; focus uses `ring`. Vitest + Testing Library + user-event.

## Acceptance

- [ ] `Input` exported from `@rogueoak/canopy/seeds`, semantic tokens only, light **and** dark.
- [ ] Focus-visible ring; `disabled` and `invalid` (aria-invalid) states; `sm`/`md`/`lg`.
- [ ] Forwards `ref`, spreads native props.
- [ ] Stories cover states/sizes in both themes; tests (render + states + a11y) pass.
- [ ] README/Storybook updated; `0006` ticked.
- [ ] Developer sign-off in Storybook.
