# 0010 — Switch

## Problem

With the Seeds recipe established in [0005](0005-button.md), add the **Switch** atom — a toggle
for instant on/off settings (notifications, feature flags) where a checkbox's "submit later"
semantics don't fit. Switch is the on/off primitive for settings rows and later Twigs.

Independently shippable: one component, one PR. Follows the 0005 recipe — no new infra beyond
the Radix Switch primitive.

## Outcome

- `@rogueoak/canopy/seeds` exports an accessible, themed `Switch`.
- Built on `@radix-ui/react-switch`; pairs with Label via `htmlFor`/`id`.
- Stories (on · off · disabled · with Label · both themes) and tests (render · toggle · a11y).
- README/Storybook updated; `0010` ticked.

## Scope

### In
- **Switch** — Radix Switch; on/off states; `disabled`; focus-visible ring; animated thumb.
  Forwards `ref`, spreads native props.
- New dep on `@rogueoak/canopy`: `@radix-ui/react-switch`.
- Stories: on, off, disabled, paired with a Label — light and dark.
- Tests: render, toggle (controlled + uncontrolled), disabled, focus ring, aria.

### Out
- **Checkbox** (0009) and **Radio Group** (0011) — sibling selection atoms, separate specs.
- Twig-level FormField (label + control + error/help) → later.

## Approach

Follows the **0005 recipe**: cva for state variants → semantic-token utilities, `cn()` for
merging, semantic tokens only, theme-agnostic by construction. On-track uses `primary`;
off-track uses `muted` / `border`; thumb uses `surface`; focus uses `ring`; disabled uses
`disabled` / `disabled-foreground`. Vitest + Testing Library + user-event.

## Acceptance

- [ ] `Switch` exported from `@rogueoak/canopy/seeds`, semantic tokens only, light **and** dark.
- [ ] Built on `@radix-ui/react-switch`; on / off / disabled.
- [ ] Focus-visible ring; correct `role`/`aria-checked` (verified in tests).
- [ ] Forwards `ref`, spreads native props; pairs with Label.
- [ ] Stories cover all states in both themes; tests (render + toggle + a11y) pass.
- [ ] README/Storybook updated; `0010` ticked.
- [ ] Developer sign-off in Storybook.
