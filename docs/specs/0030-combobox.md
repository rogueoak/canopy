# 0030 - combobox

## Problem

Canopy has a single-choice `Select` (0013), but no **combobox**: a field that lets a user
**type to filter** a list of options and pick from the filtered results, and - the part we most
need - pick **several** options that then show as removable **badges** in the field. Select is
built on `@radix-ui/react-select`, whose native surface is single-value and non-filterable;
0013 explicitly puts multi-select, filtering, and combobox behaviour out of scope. So today a
consumer who needs "search a long list" or "tag-style multi-pick" has to hand-roll it against a
raw popover, re-implementing keyboard navigation, filtering, and the selected-chip UI every
time - exactly the kind of thing the design system exists to own once.

This is for any form or filter surface with a list too long to scan or a field that takes more
than one value: assignee / label / tag pickers, faceted filters, "add people" inputs. The
priority for v1 is the **multi-select-with-badges** experience; single-select filtering falls
out of the same component for free.

## Outcome

- A new canopy component family, `Combobox`, exported from `@rogueoak/canopy`, that renders a
  field which opens a **filterable** popover list on focus/click and supports both
  **single-select** and **multi-select** from one API (a `multiple` prop or a discriminated
  value type - resolved in Approach).
- **Single-select**: choosing an option puts its label in the trigger and closes the popover,
  reading like `Select` but with a type-to-filter input at the top of the list.
- **Multi-select**: chosen options render as removable **`Badge` chips** inside the field; each
  chip has an accessible remove control, `Backspace` in the empty search input removes the last
  chip, and the popover **stays open** so several picks can be made in a row. Selected options
  show a check in the list and toggle off when re-picked.
- **Filtering**: typing in the field narrows the list (cmdk's matcher); an empty result shows a
  friendly "no results" state. Filtering is client-side over provided options for v1.
- **Keyboard + a11y**: full keyboard operation (arrow/enter/escape, and the chip-removal keys
  above) via cmdk's listbox semantics; correct `combobox`/`listbox`/`option` roles,
  `aria-expanded`, `aria-multiselectable` when multiple, and labelled remove buttons. Works as a
  labelled form control (pairs with `Label` / `FormField`).
- **Theming**: styled with the 0005 recipe (semantic-token Tailwind utilities, `cn()` merge,
  `forwardRef` + native prop spread), so it themes light/dark through the token layer with no
  `dark:` on the common path; the portalled popover themes correctly like `SelectContent`.
- **Docs**: a Storybook catalog entry with single-select, multi-select-with-badges, disabled,
  invalid (`aria-invalid`), and long-list/empty-state stories; canopy README component list and
  the `overview/` living docs updated on completion.

## Scope

**In**
- `packages/canopy/src/seeds/Combobox.tsx` (+ `Combobox.test.tsx`) - the component family and
  its parts, exported from `packages/canopy/src/seeds/index.ts`.
- Both **single** and **multiple** selection modes in one public API; multi-select renders
  selected values as canopy `Badge` (0008) chips with a remove affordance.
- Client-side **filtering** over a caller-supplied option list, with an **empty state** slot.
- Two new runtime dependencies on `@rogueoak/canopy`: **`@radix-ui/react-popover`** (the
  portalled, positioned popover shell - the one Radix primitive canopy doesn't yet have) and
  **`cmdk`** (the filterable command/listbox: input, list, item, keyboard nav, matcher).
- Full keyboard + ARIA behaviour, `disabled` and `aria-invalid` states matching the Input/Select
  field styling for visual parity.
- Storybook stories (single, multi+badges, disabled, invalid, long-list, empty) and canopy
  README + `overview/features.md` / `overview/architecture.md` updates on completion.
- Tests: opens on interaction; typing filters; single-select sets value and closes; multi-select
  toggles, renders/removes badges, `Backspace` removes last chip, popover stays open; disabled
  is inert; a labelled remove button and the combobox roles are present.

**Out**
- **Async / remote options** (debounced fetch, loading state, pagination) - v1 filters a
  provided in-memory list; an `onSearch`/async source is a clean follow-up spec.
- **Free-text / creatable** entries ("add "foo" as new") - selection is from the given options
  only in v1.
- Extracting a standalone **`Command`** palette component (cmdk used on its own for a ⌘K menu) -
  v1 wraps cmdk *inside* Combobox; a general Command Seed can be lifted out later if wanted.
- **Grouped/virtualized** option lists - flat list for v1; grouping headers and virtualization
  are deferred (cmdk supports both when needed).
- Changing `Select` (0013) - Combobox is additive; Select stays the plain single-choice control.
- Introducing a second primitive library (e.g. Base UI) - v1 stays on the Radix + cmdk stack
  that matches every existing canopy component (decision recorded below).

## Approach

**Primitive stack: Radix Popover + cmdk (the shadcn-on-Radix combobox).** Canopy is built
entirely on Radix primitives with the 0005 recipe; the combobox follows suit rather than
introducing a second primitive family. `@radix-ui/react-popover` gives the portalled, collision-
aware popover shell (and, being Radix-portalled under `<body>` with `.dark` on `<html>`, themes
correctly - same note as `SelectContent` in 0013). `cmdk` provides the filterable listbox that
lives inside it: the search `Command.Input`, the `Command.List` / `Command.Item` with built-in
fuzzy matching, keyboard navigation, and the `Command.Empty` no-results slot. Both are added as
runtime **dependencies** of `@rogueoak/canopy` (externalized in tsup like the Radix deps, per the
canopy externalization rule). This was chosen over Base UI's purpose-built combobox to keep one
primitive family across the system; the cost is that the multi-select chip layer is composed by
us rather than native (see trade-offs).

**Part surface (mirrors the shadcn combobox, canopy-styled).** A small family so callers compose
like the other Seeds:
- `Combobox` - the stateful root: owns open state and the selected value(s), takes `options`
  (or accepts `ComboboxItem` children), `value`/`onValueChange`, `multiple`, `placeholder`,
  `disabled`, and standard field props. `multiple` switches the value shape (single `string`
  vs `string[]`) and the trigger rendering.
- `ComboboxTrigger` - the field button, styled to match `SelectTrigger` / `Input`
  (`border-border` / `bg-surface` / `text-text`, focus-visible ring, `disabled:*` token pair,
  `aria-invalid:` danger overrides, trailing chevron). In single mode it shows the selected
  label or a muted placeholder; in multiple mode it renders the selected **`Badge` chips**
  inline, wrapping to multiple rows, with the search input flowing after the last chip.
- `ComboboxContent` - the Radix `Popover.Content` wrapper (`surface-raised` + `border` +
  `shadow-md`, matched to `SelectContent`), width-synced to the trigger, housing the cmdk parts.
- `ComboboxInput` / `ComboboxList` / `ComboboxItem` / `ComboboxEmpty` - thin canopy-styled
  wrappers over the cmdk parts; `ComboboxItem` shows a leading check when selected and toggles
  selection (staying open in multiple mode).

**Multi-select badges (the priority path).** Selected values render as canopy `Badge`
components inside the trigger, each with a trailing remove button (an icon button with an
`aria-label` like `Remove {label}`). Removal paths: click the chip's remove control, or press
`Backspace` when the search input is empty to drop the last chip (the common tag-input idiom).
The popover stays open across picks in multiple mode; each `ComboboxItem` toggles rather than
commits-and-closes. Single mode keeps the `Select` behaviour: pick commits and closes.

**Styling & recipe.** FULL LITERAL token utility strings (so Tailwind v4's scanner emits each),
`cn()` merge, `forwardRef` on every styled wrapper with a native prop spread, no `dark:` on the
common path - identical to 0005/0013. Field states (`disabled`, `aria-invalid`) reuse the exact
token classes `SelectTrigger` uses so an invalid/disabled Combobox reads identically to an
invalid/disabled Select or Input.

**Accessibility.** cmdk supplies the `combobox`/`listbox`/`option` roles, active-descendant
management, and type-ahead; we add `aria-expanded` on the trigger, `aria-multiselectable` in
multiple mode, and ensure each chip's remove control is a real, labelled `button`. Guard the a11y
promises with observable tests (roles present, remove button labelled, keyboard toggle/remove
work), per the repo learning that a11y is guarded by outcomes, not scaffolding.

**Trade-offs.**
- *Radix + cmdk vs Base UI*: staying on Radix keeps one primitive family and the established
  recipe, at the cost of hand-composing the multi-select chip layer that Base UI ships natively.
  Accepted - consistency and a single mental model across canopy outweigh the extra chip code,
  which is small and reuses `Badge`. (Recorded decision; revisit only if multi-primitive support
  is wanted system-wide.)
- *One `multiple` prop vs two components*: a single component with a `multiple` switch keeps the
  surface small and mirrors native `<select multiple>`; the value-type discrimination is the cost
  (documented, and typed so `multiple` implies `string[]`).
- *Client-side filtering only*: simpler, no loading states; large/remote datasets wait for the
  async follow-up. Flagged in the story so it isn't mistaken for complete.
- *New deps (`cmdk`, `@radix-ui/react-popover`)*: two more runtime deps on canopy, but both are
  small, widely used, and exactly the missing primitives; vendoring either would be more code to
  own. Security/architecture personas should weigh the new-dependency surface in review.

## Acceptance

- [ ] `Combobox` and its parts ship from `@rogueoak/canopy` (exported via `seeds/index.ts`),
      built on `@radix-ui/react-popover` + `cmdk` (both added as dependencies and externalized in
      the tsup build); no `dark:` on the common path.
- [ ] **Single-select**: typing filters the list; picking an option sets the trigger label and
      closes the popover; an empty filter shows the no-results state.
- [ ] **Multi-select** (`multiple`): picked options render as removable `Badge` chips in the
      field; the popover stays open across picks; re-picking a selected option de-selects it and
      its chip disappears; selected items show a check in the list.
- [ ] Each chip has an accessible, labelled remove button; `Backspace` in the empty search input
      removes the last chip.
- [ ] `disabled` renders the field inert with the shared disabled tokens; `aria-invalid` applies
      the danger border/ring exactly as `SelectTrigger`/`Input` do.
- [ ] Keyboard + ARIA: correct `combobox`/`listbox`/`option` roles, `aria-expanded`, and
      `aria-multiselectable` in multiple mode; arrow/enter/escape navigation works.
- [ ] Storybook catalog entry with single, multi-select-with-badges, disabled, invalid, long-list,
      and empty-state stories; `pnpm storybook` build is green.
- [ ] Tests cover: opens on interaction, filtering, single-select sets+closes, multi-select
      toggle + badge add/remove + `Backspace`-removes-last + stays-open, disabled inert, roles and
      labelled remove button present. `pnpm test` / `lint` / `build` pass from the root.
- [ ] Canopy `README.md` component list includes Combobox; `overview/features.md` (new capability)
      and `overview/architecture.md` (new primitives `@radix-ui/react-popover` + `cmdk` in the
      canopy dependency footprint) updated on completion.
