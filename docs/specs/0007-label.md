# 0007 — Label

## Problem

With [0005](0005-button.md)'s recipe and [0006](0006-input.md)'s Input in place, add the
**Label** atom that pairs with form fields. Correct labelling is the foundation of accessible
forms — Label is small but load-bearing for every field and Twig that follows.

Independently shippable: one component, one PR. Follows the 0005 recipe — no new infra beyond
the Radix Label primitive.

## Outcome

- `@rogueoak/canopy/seeds` exports an accessible, themed `Label`.
- Built on `@radix-ui/react-label`; pairs with Input via `htmlFor`.
- Stories (with/without required, paired with Input, both themes) and tests (render ·
  association · required).
- README/Storybook updated; `0007` ticked.

## Scope

### In
- **Label** — Radix Label; `htmlFor` association; optional `required` indicator (visual `*`
  with accessible semantics); styled via semantic text tokens.
- New dep on `@rogueoak/canopy`: `@radix-ui/react-label`.
- Stories: standalone, required, paired with an Input (htmlFor) — light and dark.
- Tests: render, `htmlFor` association (clicking label focuses input), required indicator.

### Out
- Twig-level FormField that composes Label + Input + error/help → later.
- Other form atoms → their own specs.

## Approach

Follows the **0005 recipe**: `cn()` + semantic-token utilities, theme-agnostic. Uses Radix
Label for correct association and click-to-focus behaviour. Required indicator is visual but
must not break the accessible name. Vitest + Testing Library + user-event verifies association.

## Acceptance

- [ ] `Label` exported from `@rogueoak/canopy/seeds`, semantic tokens only, light **and** dark.
- [ ] Built on `@radix-ui/react-label`; `htmlFor` focuses the paired control.
- [ ] Optional `required` indicator with accessible semantics.
- [ ] Stories cover standalone/required/paired in both themes; tests pass.
- [ ] README/Storybook updated; `0007` ticked.
- [ ] Developer sign-off in Storybook.
