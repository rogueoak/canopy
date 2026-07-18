# 0066 - command

## Problem

Canopy already vendors `cmdk` and wraps it - but only *inside* `Combobox` (0030), where the
`ComboboxContent` / `ComboboxInput` / `ComboboxList` / `ComboboxItem` / `ComboboxEmpty` wrappers
are declared module-internal and are explicitly **not** a public contract (0030 Approach, and its
Out item "Extracting a standalone `Command` palette component ... a general Command Seed can be
lifted out later if wanted"). So today a consumer who wants a **command palette** - the Cmd+K
"jump to anything / run any action" menu that has become a standard product surface - has no
canopy component for it. They would have to reach past the design system to `cmdk` directly and
re-style every part against the token layer, or misuse `Combobox` (a form field, not an action
menu) for a job it was never shaped for. shadcn ships a dedicated `Command` + `CommandDialog`
pair for exactly this gap; canopy has the primitive but not the component.

This is the follow-up 0030 promised. `Command` is for any "palette" or "quick action" surface:
Cmd+K global search, an action menu, a keyboard-first navigator, an inline filterable command
list embedded in a page. It composes the same `cmdk` primitive the whole system already depends
on (no new runtime dependency), pairs with `Dialog` (0034) for the Cmd+K overlay, and reuses the
`Keyboard` (0021) shortcut chrome. It also lets `Combobox` (0030) stop hand-rolling its own
inline cmdk wrappers and consume the shared `Command` parts instead - one styled cmdk surface,
owned once.

## Outcome

- A new canopy Branch family, `Command`, exported from `@rogueoak/canopy/branches`, that renders a
  filterable command list on `cmdk`: a search `CommandInput`, a scrollable `CommandList`, a
  no-results `CommandEmpty`, grouped `CommandGroup`s, selectable `CommandItem`s, a
  `CommandSeparator`, and a trailing `CommandShortcut` for per-item key hints.
- A `CommandDialog` composition: `Command` mounted inside `Dialog` (0034) so a caller wires
  `Cmd+K` to open a centered, portalled, focus-trapped palette overlay with the search input
  auto-focused - the standard command-menu experience - without re-plumbing the Dialog shell.
- **Standalone use**: `Command` also renders inline (not only in a dialog) as an embedded
  filterable list, styled on a `bg-surface-raised` card matching the Combobox popover.
- **Filtering + keyboard + a11y**: typing narrows the list via cmdk's matcher; an empty result
  shows the `CommandEmpty` slot; full keyboard operation (arrow/enter, type-ahead) through cmdk's
  listbox semantics; correct `combobox` (input) / `listbox` (list) / `option` (item) roles and
  active-descendant highlighting. `CommandDialog` carries a labelled `DialogTitle` (visually
  hidden by default) so the overlay is announced.
- **Theming**: every part is styled with the 0005 recipe - full literal semantic-token Tailwind
  utilities, `cn()` merge, `forwardRef` + native prop spread, `React.ComponentRef` refs - so it
  themes light/dark through the token layer with **no `dark:` on the common path**; the portalled
  `CommandDialog` themes correctly because `.dark` lives on `<html>` (same note as `DialogContent`
  and `SelectContent`). Item highlight uses `bg-muted-raised` (raised-surface rule), not
  `bg-muted`.
- **Refactor with no API change**: `Combobox` (0030) is updated to consume the new `Command`
  parts in place of its private inline cmdk wrappers. `Combobox`'s public surface
  (`Combobox`, `ComboboxProps`, `ComboboxSingleProps`, `ComboboxMultipleProps`, `ComboboxOption`)
  is **unchanged** - same props, same behavior, same tests pass.
- **Docs**: a Storybook catalog entry with inline, dialog (Cmd+K), grouped, with-shortcuts, and
  empty-state stories; canopy `README.md` component list and the `overview/` living docs updated
  on completion.

## Scope

### In
- `packages/canopy/src/branches/Command.tsx` (+ `Command.test.tsx`) - the `Command` part family
  and the `CommandDialog` composition, exported from `packages/canopy/src/branches/index.ts`.
- Parts: `Command`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandGroup`, `CommandItem`,
  `CommandSeparator`, `CommandShortcut`, and `CommandDialog` - each a canopy-styled `forwardRef`
  wrapper over the matching `cmdk` part (`Command.Root` / `.Input` / `.List` / `.Empty` /
  `.Group` / `.Item` / `.Separator`), with `CommandShortcut` a plain styled `span` and
  `CommandDialog` a `Dialog` (0034) + `Command` composition.
- Exported prop types for each part (`CommandProps`, `CommandInputProps`, `CommandListProps`,
  `CommandEmptyProps`, `CommandGroupProps`, `CommandItemProps`, `CommandSeparatorProps`,
  `CommandShortcutProps`, `CommandDialogProps`) via `branches/index.ts`.
- **Refactor `Combobox`** (`packages/canopy/src/branches/Combobox.tsx`): replace its private
  `ComboboxContent` / `ComboboxInput` / `ComboboxList` / `ComboboxItem` / `ComboboxEmpty` inline
  cmdk wrappers with the shared `Command` parts (the Popover shell, the root's selection state,
  the multi-select `Badge` chips, and the whole public surface stay exactly as they are). The
  existing `Combobox.test.tsx` suite must pass unchanged.
- **No new runtime dependency**: `cmdk` is already a canopy dependency (externalized in
  `tsup.config.ts`); `Dialog` (0034) is already an internal Branch. Nothing added to
  `package.json` or `tsup.config.ts`.
- Storybook story `apps/storybook/src/Command.stories.tsx`: Playground (inline), Dialog (Cmd+K
  open on keypress), Grouped (`CommandGroup` headings + `CommandSeparator`), WithShortcuts
  (`CommandShortcut` using `Keyboard`), and Empty (no-results) - each in both themes via the
  toolbar (no per-story theme code).
- Tests: renders with `combobox`/`listbox`/`option` roles; typing filters the list; selecting an
  item fires `onSelect`; empty filter shows `CommandEmpty`; `CommandDialog` opens/closes and the
  input is focused when open; `CommandShortcut` renders its hint; groups render headings;
  `className` merges (caller wins); refs forward; keyboard arrow/enter navigation selects.
- Canopy `README.md` component list gains Command; `overview/features.md` (new command-palette
  capability) and `overview/architecture.md` (Command as the shared cmdk surface that Combobox now
  consumes - note `cmdk` is reused, no new dep) updated on completion.

### Out
- **Async / remote command sources** (debounced fetch, loading state, pagination) - v1 filters a
  caller-supplied in-memory list, exactly like Combobox v1; an async follow-up is a clean later
  spec.
- **Global Cmd+K key binding wiring** - `CommandDialog` is a controlled overlay (`open` /
  `onOpenChange`); the app owns the keydown listener that flips it. A built-in
  `useCommandShortcut` hook is deferred; the Dialog story demonstrates the pattern.
- **Nested / multi-page command stacks** (drill-down "pages" with a back stack) - flat, single-
  level list for v1; the page-stack pattern is a later addition.
- **Virtualized lists** - flat rendering for v1 (cmdk supports virtualization when needed).
- **Changing `Combobox`'s public API** - the refactor is internal only; `Combobox`,
  `ComboboxProps`, `ComboboxSingleProps`, `ComboboxMultipleProps`, and `ComboboxOption` keep
  their exact signatures and behavior, and the 0030 test suite passes as-is.
- **Introducing a second primitive library** - v1 stays on the `cmdk` + Radix (`Dialog`) stack
  already in canopy; no new dependency of any kind.

## Approach

**Primitive stack: `cmdk` + `Dialog` (0034), no new dependency.** Canopy already ships `cmdk`
(added for 0030 and externalized in `tsup.config.ts`) and a Radix-based `Dialog` Branch (0034).
`Command` is the missing *public* wrapper family over `cmdk`, and `CommandDialog` is the small
composition that drops a `Command` into a `Dialog`. This is deliberately additive and reuses
what canopy owns - no library is introduced, so there is no new-dependency surface for
security/architecture to weigh (the one thing to flag in review is the **reuse**: Combobox and
Command now share a single styled cmdk surface, so a change to `Command` part styling affects
Combobox too - intentional, and covered by both test suites).

**Layer: Branch.** `Command` owns interaction state (search text, active-descendant highlight
via cmdk) and `CommandDialog` owns a portal (through `Dialog`), and both compose lower Seeds
(`Keyboard` 0021 in the shortcut story, `Badge`/`Command` in Combobox). That is the Branch tier
by the same rule that puts `Combobox` and `Dialog` there; it may import Seeds, never the reverse.

**Part surface (mirrors the shadcn Command, canopy-styled).** Each is a `forwardRef` wrapper with
`React.ComponentRef<typeof CommandPrimitive.X>` refs and a full native prop spread:
- `Command` - `Command.Root`, the stateful list container:
  `flex h-full w-full flex-col overflow-hidden rounded-md bg-surface-raised text-text` (the same
  raised-surface card the Combobox popover uses, so inline and in-dialog read identically).
- `CommandInput` - `Command.Input` with a leading magnifier glyph and a `border-b border-border`
  underline, matching the current Combobox search box:
  `flex h-10 w-full rounded-md bg-transparent py-3 text-sm text-text outline-none
  placeholder:text-text-muted disabled:cursor-not-allowed disabled:opacity-50`.
- `CommandList` - `Command.List`, scroll region: `max-h-72 overflow-y-auto overflow-x-hidden p-1`.
- `CommandEmpty` - `Command.Empty`: `py-6 text-center text-sm text-text-muted`.
- `CommandGroup` - `Command.Group` with a muted heading:
  `overflow-hidden p-1 text-text
  [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5
  [&_[cmdk-group-heading]]:text-caption [&_[cmdk-group-heading]]:text-text-muted`.
- `CommandItem` - `Command.Item`, selectable option; highlight uses the **raised-surface** fill
  (raised-surface rule):
  `relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm
  text-text outline-none data-[selected=true]:bg-muted-raised data-[selected=true]:text-text
  data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50`.
- `CommandSeparator` - `Command.Separator`: `-mx-1 h-px bg-border`.
- `CommandShortcut` - a plain styled `span` for the trailing key hint:
  `ml-auto text-caption tracking-widest text-text-muted` (callers may pass `Keyboard` (0021)
  children for rendered keycaps).
- `CommandDialog` - a `Dialog` (0034) wrapping a `Command`: a visually hidden `DialogTitle` for
  the accessible name, `DialogContent` sized for a palette (`overflow-hidden p-0`), the `Command`
  filling it, and pass-through `open` / `onOpenChange`. Props extend `DialogProps` plus the
  `Command` children.

**Styling & recipe.** FULL LITERAL token-utility strings on every part (so Tailwind v4's scanner
emits each), `cn()` merge with caller `className` winning, `forwardRef` + native prop spread on
every styled wrapper, semantic tokens only, and **no `dark:` on the common path** - identical to
0005 / 0030 / 0034. The portalled `CommandDialog` themes correctly with zero per-portal wiring
because `.dark` sits on `<html>`. Item highlight is `bg-muted-raised` (not `bg-muted`) per the
raised-surface learning, matching how `ComboboxItem` highlights today.

**Combobox refactor (API-preserving).** `Combobox` keeps its Popover shell, its selection state
machine, its `multiple` `Badge`-chip rendering, and its entire exported surface. Only the inline
cmdk wrappers change: `ComboboxContent` mounts `Command` instead of a bare `CommandPrimitive`,
and `ComboboxInput` / `ComboboxList` / `ComboboxItem` / `ComboboxEmpty` are replaced by
`CommandInput` / `CommandList` / `CommandItem` / `CommandEmpty` (the `selected` leading-check
behavior of `ComboboxItem` is preserved by composing a `CommandItem` with the same check gutter).
The 0030 `Combobox.test.tsx` suite is the contract that proves the refactor changed nothing
observable; it runs unchanged.

**Accessibility.** cmdk supplies the `combobox` (input) / `listbox` (list) / `option` (item)
roles, active-descendant management, and type-ahead. `CommandDialog` adds a labelled (visually
hidden) `DialogTitle` so the overlay is announced, and inherits Dialog's focus trap and Escape /
outside-click close. `CommandItem` renders `disabled` items inert (`data-disabled` -> no pointer
events, dimmed). All a11y promises are guarded by observable tests (roles present, `onSelect`
fires on click and on Enter, dialog focuses the input on open), per the repo learning that a11y
is proven by outcomes, not by asserting class names.

**Motion.** None of its own; `CommandDialog`'s open/close animation is whatever `Dialog` (0034)
already provides (gated `animate-dialog-*` with `motion-reduce:animate-none`). No new keyframes.

## Acceptance

- [ ] `Command`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandGroup`, `CommandItem`,
      `CommandSeparator`, `CommandShortcut`, and `CommandDialog` (plus their prop types) ship from
      `@rogueoak/canopy/branches` via `branches/index.ts`; each is a `forwardRef` wrapper over the
      matching `cmdk` part with full literal semantic-token classes, `cn()` merge, native prop
      spread, and `React.ComponentRef` refs - **no `dark:` on the common path**.
- [ ] **No new dependency**: `cmdk` and `Dialog` (0034) are reused; `package.json` and
      `tsup.config.ts` are unchanged.
- [ ] **Inline**: `Command` renders a filterable list on a `bg-surface-raised` card; typing in
      `CommandInput` narrows it; an empty filter shows `CommandEmpty`.
- [ ] **Dialog**: `CommandDialog` opens/closes via `open`/`onOpenChange`, mounts the palette in a
      portalled, focus-trapped, labelled overlay, and focuses the search input when open.
- [ ] Roles + keyboard: `combobox` (input), `listbox` (list), `option` (item) roles present;
      arrow/enter navigation moves the active item and Enter fires `onSelect`; `disabled`
      `CommandItem`s are inert.
- [ ] Highlight uses `bg-muted-raised` (raised-surface rule), not `bg-muted`;
      `CommandGroup` renders its heading and `CommandSeparator` renders a `border`-tone rule;
      `CommandShortcut` renders its trailing hint (and accepts `Keyboard` children).
- [ ] **Combobox refactor**: `Combobox` now composes the `Command` parts internally; its public
      surface (`Combobox`, `ComboboxProps`, `ComboboxSingleProps`, `ComboboxMultipleProps`,
      `ComboboxOption`) and behavior are **unchanged**, and the existing `Combobox.test.tsx` suite
      passes as-is.
- [ ] Storybook catalog entry with Playground (inline), Dialog (Cmd+K), Grouped, WithShortcuts,
      and Empty stories, all rendering in both themes via the toolbar; `pnpm storybook` build is
      green.
- [ ] Tests cover: roles present, typing filters, `onSelect` on click and Enter, empty state,
      dialog open/close + input focus, group headings, shortcut render, `className` merge (caller
      wins), ref forwarding. `pnpm test` / `pnpm lint` / `pnpm build` pass from the root.
- [ ] Canopy `README.md` component list includes Command; `overview/features.md` (command-palette
      capability) and `overview/architecture.md` (Command as the shared cmdk surface Combobox now
      consumes - `cmdk` reused, no new dependency) updated on completion.
- [ ] All source and text ASCII-only (Trellis rule).
