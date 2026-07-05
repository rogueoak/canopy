# 0021 - SearchBar

## Problem

With the Twigs composition recipe established in [0020](0020-form-field.md), add the
**SearchBar** Twig - the search-input molecule reused in toolbars, command launchers, and
filter headers. It composes the **Input** Seed with a leading search icon, an optional clear
affordance (the **Button** Seed, ghost/icon), and an optional **Keyboard** shortcut hint
(e.g. `⌘K`), wiring them into one accessible search control.

Independently shippable: one composition, one PR. Follows the 0020 recipe - composes Seeds,
adds no token.

## Outcome

- `@rogueoak/canopy/twigs` exports a themed, accessible `SearchBar`.
- A search field with a leading magnifier icon, an optional clear (×) button that appears when
  there is a value, and an optional trailing shortcut hint rendered with `Keyboard`.
- Stories (default · with value + clear · with shortcut hint · disabled · both themes) and
  tests (renders search input, clear appears with value and clears it, onSearch on submit,
  disabled).
- Storybook **Twigs** section updated.

## Scope

### In

- **SearchBar** - composes Input + a leading search icon + optional clear Button + optional
  `Keyboard` hint:
  - `type="search"`, `role="searchbox"` semantics; accessible name (`aria-label` default
    "Search", overridable).
  - **Controlled or uncontrolled** value (`value`/`defaultValue` + `onValueChange`), mirroring
    the native input contract.
  - **Clear** - when there is a value and not disabled, a ghost icon Button (×) appears; click
    clears the value, fires `onValueChange('')`, and returns focus to the input. Hidden when
    empty. Has its own accessible name ("Clear search").
  - **onSearch** - fired on Enter / form submit with the current value (the input is wrapped in
    a `<form role="search">` so Enter submits).
  - **shortcutHint** - optional; when set, renders a `Keyboard` at the trailing edge (purely
    visual; SearchBar does not bind the key - display-only, like Keyboard 0019). Hidden while
    there is a value (the clear button takes that slot).
  - Leading **search icon** - hand-rolled inline SVG (no icon library), `currentColor`, muted.
  - Forwards `ref` to the underlying `<input>`; spreads native input props.
- Stories: default, typed value with clear, with `shortcutHint="⌘K"`, disabled - light + dark.
- Tests: renders a search input; clear button shows with a value and clears + refocuses;
  `onSearch` fires on submit with the value; clear hidden when empty/disabled.

### Out

- **Shortcut key binding** (focusing the bar on `⌘K`) - the hint is display-only; binding is
  the consumer's (or a later hook). Out of scope, matching Keyboard 0019.
- **Suggestions / autocomplete / async results dropdown** - that is a Combobox organism
  (Branches), not this molecule.
- **Debounced live `onSearch`-while-typing** - consumer composes with `onValueChange`; SearchBar
  fires `onSearch` on submit only.

## Approach

Follows the **0020 recipe**: a composition of Seeds (Input, Button, Keyboard) styled with
semantic tokens only, `cn()` for merging, no new token, theme-agnostic by construction. The
input sits in a relatively-positioned `<form role="search">`; the leading icon and trailing
clear/hint are absolutely positioned, with the Input's horizontal padding widened to clear
them. The clear button reuses Button (`variant="ghost" size="icon"`) so its focus ring and
hover come for free. Vitest + Testing Library verify the search behaviour (clear, submit), not
the positioning.

## Acceptance

- [ ] `SearchBar` exported from `@rogueoak/canopy/twigs`; semantic tokens only, light **and**
      dark, no per-component theme code.
- [ ] Search input with a leading magnifier icon; accessible name defaulting to "Search".
- [ ] Controlled + uncontrolled value; `onValueChange` fires on input and on clear.
- [ ] Clear button appears only with a value (and not disabled), clears the value, and refocuses
      the input; has its own accessible name.
- [ ] `onSearch` fires on Enter / submit with the current value.
- [ ] Optional `shortcutHint` renders a `Keyboard` (display-only, hidden when there is a value).
- [ ] Forwards `ref` to the input; spreads native props.
- [ ] Stories cover default/value+clear/shortcut/disabled in both themes; tests
      (render + clear + submit + disabled) pass.
- [ ] Storybook **Twigs** section updated with a `Twigs/SearchBar` entry.
- [ ] Developer sign-off in Storybook.
