# 0012 - Textarea

## Problem

With the Seeds recipe established in [0005](0005-button.md) and Input shipped in
[0006](0006-input.md), add the **Textarea** atom for multi-line free text (comments,
descriptions, messages). Textarea mirrors Input's states so forms feel consistent.

Independently shippable: one component, one PR. Follows the 0005 recipe - no new infra.

## Outcome

- `@rogueoak/canopy/seeds` exports an accessible, themed `Textarea`.
- Styled with semantic tokens only; mirrors Input's focus / invalid / disabled states.
- Stories (default · focused · invalid · disabled · both themes) and tests (render · states ·
  a11y).
- Storybook updated.

## Scope

### In
- **Textarea** - multi-line text input; focus-visible ring; `invalid` (aria-invalid) and
  `disabled` states. A sensible `min-height` floor and user-`resize-y`; **no size variants** - a
  single height suits a multi-line field, and consumers set `rows` for a taller default. Forwards
  `ref`, spreads native props (incl. `rows`).
- Stories: default, focused, invalid, disabled - light and dark.
- Tests: render, value/onChange, disabled, invalid/aria, focus ring.

### Out
- **Size variants** (`sm`/`md`/`lg`) → not applicable to a multi-line field; height is driven by
  `min-height` + `rows`, not a fixed control height like Input.
- **Auto-resize** (grow-to-content) → out of scope; consumers set `rows` and CSS `resize`. A
  controlled auto-grow behaviour can be a follow-up if demand warrants.
- **Label** (0007) - pairs with Textarea but ships separately.
- Twig-level FormField (label + control + error/help) → later.

## Approach

Follows the **0005 recipe**: `cn()` merge, semantic-token utilities only, theme-agnostic by
construction. Reuses Input's token mapping for visual parity - invalid uses `danger` / `ring`;
focus uses `ring`; disabled uses `disabled` / `disabled-foreground`; placeholder uses
`text-muted`. No cva (no variants); a single token base plus `min-h-*` + `resize-y`. Vitest +
Testing Library + user-event.

## Acceptance

- [ ] `Textarea` exported from `@rogueoak/canopy/seeds`, semantic tokens only, light **and** dark.
- [ ] Focus-visible ring; `disabled` and `invalid` (aria-invalid) states; `min-height` + resize.
- [ ] Visual parity with Input; auto-resize and size variants noted as out of scope.
- [ ] Forwards `ref`, spreads native props.
- [ ] Stories cover the states in both themes; tests (render + states + a11y) pass.
- [ ] Storybook updated.
- [ ] Developer sign-off in Storybook.
