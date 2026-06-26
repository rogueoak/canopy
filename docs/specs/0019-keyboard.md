# 0019 — Keyboard

## Problem

With the Seeds recipe established in [0005](0005-button.md), add the **Keyboard** atom — a small
presentational element that renders a keyboard key (`⌘K`, `Esc`, `Ctrl`) in help text, command
menus, and tooltips. It is the keyboard-hint primitive reused across the catalogue. (Named
`Keyboard`, not `Kbd` — the abbreviation isn't descriptive; it still renders the semantic
`<kbd>` element.)

Independently shippable: one component, one PR. Follows the 0005 recipe — presentational, no Radix.

## Outcome

- `@rogueoak/canopy/seeds` exports a themed `Keyboard`.
- A styled `<kbd>` using muted/border tokens; sizes consistent with the catalogue.
- Stories (single key · key combo · sizes · inline in text · both themes) and tests (render ·
  semantic element · sizes).
- Storybook updated.

## Scope

### In
- **Keyboard** — renders a semantic `<kbd>` element with a key-cap look (small fill, hairline
  border, subtle radius); sizes `sm` / `md`; composes (multiple `Keyboard` for a combo). Forwards
  `ref`, spreads native props.
- No new dep (presentational).
- Stories: single key, combo (e.g. `⌘` + `K`), each size, inline within a sentence — light and
  dark.
- Tests: render, renders a `<kbd>` element, sizes.

### Out
- **Shortcut/hotkey binding logic** (capturing or registering key presses) → out of scope;
  `Keyboard` is display-only.
- **Combo separators / auto-formatting** of key strings → consumer composes, or a later helper.

## Approach

Follows the **0005 recipe**: cva for size variants → semantic-token utilities, `cn()` for
merging, semantic tokens only, theme-agnostic by construction. Cap fill uses `muted` /
`muted-foreground`; outline uses `border`. Renders the native `<kbd>` element for correct
semantics. Vitest + Testing Library verifies the element and sizes.

## Acceptance

- [ ] `Keyboard` exported from `@rogueoak/canopy/seeds`, semantic tokens only, light **and** dark.
- [ ] Renders a semantic `<kbd>`; uses `muted` / `border` tokens; sizes `sm`/`md`.
- [ ] Display-only (no key-binding logic); composes for combos.
- [ ] Forwards `ref`, spreads native props.
- [ ] Stories cover single/combo/sizes/inline in both themes; tests (render + element + sizes)
      pass.
- [ ] Storybook updated with a `Seeds/Keyboard` section.
- [ ] Developer sign-off in Storybook.
