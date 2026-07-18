# 0054 - DropdownMenu

## Problem

Canopy has portalled overlays - `Dialog` (0021) and `ResponsiveDialog` - and a filterable
picker in `Combobox` (0030), but no **actions menu**: the button-triggered popup of commands
that every app surface needs (a row's "..." menu, a user-avatar menu, a toolbar overflow). Today
a consumer who wants a menu of actions - with checkable items, radio choices, nested submenus,
keyboard navigation, and type-ahead - has to hand-roll it against a raw popover, re-implementing
roving focus, `menu`/`menuitem` roles, typeahead, and submenu positioning every time. That is
exactly the reusable, accessibility-heavy surface a design system should own once.

The upstream shadcn dropdown-menu covers this on Radix, but is unstyled scaffolding that ships
palette utilities and `dark:` variants; it does not conform to the canopy 0005 recipe (semantic
tokens only, no `dark:` on the common path, `cn()` merge, `forwardRef` + native prop spread). So
canopy cannot simply vendor it - the gap is a canopy-styled, token-themed DropdownMenu family
that themes light/dark through the token layer and reads native to the catalogue.

This is for any surface that presents a short list of commands off a trigger: table row actions,
account menus, toolbar overflow, "more options" affordances. It is a **Branch** (0030-tier) - it
owns interaction state and portals - and sits beside `Combobox` (0030) and `Dialog` (0021) in the
branch layer, reusing the same Radix + portal + `.dark` theming approach.

## Outcome

- A new canopy component family, `DropdownMenu`, exported from `@rogueoak/canopy/branches`, that
  renders an actions menu opened from a `DropdownMenuTrigger` (works with `asChild` over a canopy
  `Button`), with a portalled, collision-aware `DropdownMenuContent`.
- **Parts exported**: `DropdownMenu` (Root), `DropdownMenuTrigger`, `DropdownMenuContent`,
  `DropdownMenuItem`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioGroup`,
  `DropdownMenuRadioItem`, `DropdownMenuLabel`, `DropdownMenuSeparator`, `DropdownMenuShortcut`,
  `DropdownMenuGroup`, `DropdownMenuSub`, `DropdownMenuSubTrigger`, `DropdownMenuSubContent`.
- **Items**: a plain `DropdownMenuItem` fires an action and closes; a `DropdownMenuCheckboxItem`
  toggles a leading check and stays open; a `DropdownMenuRadioGroup` of `DropdownMenuRadioItem`s
  shows a leading dot for the selected one; a `DropdownMenuLabel` is a non-interactive section
  heading, `DropdownMenuSeparator` a divider, and `DropdownMenuShortcut` a muted trailing hint
  (e.g. a keyboard shortcut). `DropdownMenuSub` / `SubTrigger` / `SubContent` nest a submenu that
  opens on hover/right-arrow.
- **States**: hover/focus highlight on items uses `bg-muted-raised` (raised-surface rule);
  `disabled` items render inert (`disabled:opacity-50 disabled:cursor-not-allowed`), keep their
  check/dot fill, and are skipped by keyboard navigation and typeahead.
- **a11y / keyboard**: correct `menu` / `menuitem` / `menuitemcheckbox` / `menuitemradio` roles
  and `aria-checked` from Radix; full keyboard operation (arrow up/down to move, right/left to
  open/close submenus, `Enter`/`Space` to activate, `Escape` to close, `Home`/`End`) and
  **typeahead** (type to jump to a matching item), with focus returning to the trigger on close.
- **Theming**: styled with the 0005 recipe (full literal semantic-token utilities, `cn()` merge,
  `forwardRef` + native prop spread), so it themes light/dark through the token layer with no
  `dark:` on the common path; the portalled content inherits `.dark` from `<html>` and themes
  correctly with no per-portal wiring (same as `DialogContent` / `SelectContent`).
- **Docs**: a Storybook catalog entry (playground, checkbox items, radio group, submenu,
  with-shortcuts, disabled items - light and dark); canopy `README.md` component list and the
  `overview/` living docs updated on completion.

## Scope

### In

- `packages/canopy/src/branches/DropdownMenu.tsx` (+ `DropdownMenu.test.tsx`) - the component
  family and all its parts, exported from `packages/canopy/src/branches/index.ts`.
- All parts listed in Outcome: Root, Trigger, Content, Item, CheckboxItem, RadioGroup, RadioItem,
  Label, Separator, Shortcut, Group, Sub, SubTrigger, SubContent - each canopy-styled with the
  0005 recipe and forwarding `ref` + spreading native props (`DropdownMenuShortcut` is a plain
  styled `span`; the rest wrap the matching Radix primitive).
- One new runtime dependency on `@rogueoak/canopy`: **`@radix-ui/react-dropdown-menu`** (the
  portalled menu primitive with roles, roving focus, typeahead, and submenu positioning). It is
  added to `packages/canopy/package.json` dependencies **and** externalized in
  `packages/canopy/tsup.config.ts` `external: [...]` alongside the other Radix deps; run
  `pnpm install` at the repo root after.
- `DropdownMenuTrigger` supports `asChild` so it composes over a canopy `Button` (0005) without
  nesting buttons; `DropdownMenuContent` is portalled, `surface-raised` + `border-border` +
  `shadow-md`, with `sideOffset` and collision avoidance from Radix.
- Item hover/focus highlight uses `bg-muted-raised` (raised-surface rule); `disabled` items use
  the toggle disabled tokens (`disabled:opacity-50 disabled:cursor-not-allowed`).
- Storybook story in `apps/storybook/src/DropdownMenu.stories.tsx` importing from
  `@rogueoak/canopy/branches`. Stories: **Playground**, **CheckboxItems**, **RadioGroup**,
  **Submenu**, **WithShortcuts**, **DisabledItems** - no per-story theme code (toolbar drives
  light/dark).
- Tests (Vitest + Testing Library, importing from `./DropdownMenu`): trigger opens the menu and
  `menu` role appears; `menuitem` click fires its handler and closes; `menuitemcheckbox` toggles
  `aria-checked` and stays open (controlled **and** uncontrolled); `menuitemradio` group selects
  one (controlled + uncontrolled); disabled item is inert (no handler fire) and keeps its state;
  keyboard - arrow navigation moves focus, `Enter` activates, `Escape` closes and returns focus
  to the trigger; submenu opens; `className` merge (caller wins); `ref` forwarding on styled
  parts.
- Docs on completion: canopy `README.md` component list adds DropdownMenu;
  `docs/overview/features.md` (new actions-menu capability) and `docs/overview/architecture.md`
  (new primitive `@radix-ui/react-dropdown-menu` in the canopy dependency footprint) updated.

### Out

- **Context menu** (right-click trigger via `@radix-ui/react-context-menu`) - a sibling menu
  surface with the same item vocabulary; a clean follow-up spec that can reuse these item styles.
- **Menubar** (a horizontal app menu bar via `@radix-ui/react-menubar`) - deferred; different
  root ergonomics.
- **Async / dynamic** item loading, virtualized long menus, and search/filter inside the menu -
  DropdownMenu renders a caller-supplied static item tree for v1 (that filtering surface is
  `Combobox`, 0030).
- **Icon slots as a typed API** - callers pass icons as children in v1; a dedicated icon prop is
  deferred.
- Changing any **unrelated component** - DropdownMenu is purely additive; `Dialog`, `Combobox`,
  `Select`, and `Button` are untouched.

## Approach

**Primitive stack: Radix DropdownMenu (the shadcn-on-Radix actions menu).** Canopy is built
entirely on Radix primitives with the 0005 recipe; the dropdown follows suit rather than
introducing a new primitive family. `@radix-ui/react-dropdown-menu` supplies the whole behaviour
we do not want to re-own: the portalled, collision-aware content shell; `menu` / `menuitem` /
`menuitemcheckbox` / `menuitemradio` roles with `aria-checked`; roving focus and full keyboard
navigation; **typeahead**; controlled + uncontrolled state for open, checkbox, and radio; and
submenu positioning (`Sub` / `SubTrigger` / `SubContent`). Being Radix-portalled under `<body>`
with `.dark` on `<html>`, its content themes correctly with no per-portal wiring (same note as
`DialogContent` in 0021 and `SelectContent` in 0013). The dep is added to canopy
`package.json` and **externalized in `tsup.config.ts`** so it is peer-resolved at the consumer,
matching every other Radix dep in the package (canopy externalization rule).

**Part surface (mirrors the shadcn dropdown-menu, canopy-styled).** Thin canopy wrappers over
each Radix part, aliased/styled to the branch layer:
- `DropdownMenu` = `DropdownMenuPrimitive.Root`; `DropdownMenuTrigger` =
  `DropdownMenuPrimitive.Trigger` (supports `asChild` for a canopy `Button`);
  `DropdownMenuGroup` = `...Group`; `DropdownMenuRadioGroup` = `...RadioGroup`; `DropdownMenuSub`
  = `...Sub` - re-exported as-is where no styling is needed.
- `DropdownMenuContent` - `DropdownMenuPrimitive.Content` inside `DropdownMenuPrimitive.Portal`,
  styled `z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-surface-raised
  p-1 text-text shadow-md` with a default `sideOffset`; `React.ComponentRef` typing.
- `DropdownMenuItem` - `...Item` styled as a focusable row: `relative flex cursor-pointer
  select-none items-center gap-2 rounded-sm px-2 py-1.5 text-body-sm text-text outline-none
  focus:bg-muted-raised focus:text-text data-[disabled]:opacity-50
  data-[disabled]:cursor-not-allowed` (Radix marks the highlighted item via `data-highlighted`,
  which is styled with `bg-muted-raised` per the raised-surface rule; disabled via
  `data-[disabled]`).
- `DropdownMenuCheckboxItem` / `DropdownMenuRadioItem` - same row styling with left padding for a
  leading `DropdownMenuPrimitive.ItemIndicator` (a `Check` for checkbox, a filled dot for radio);
  they stay open on activate and expose `aria-checked` from Radix.
- `DropdownMenuLabel` - `...Label` styled `px-2 py-1.5 text-label text-text-muted` (non-
  interactive heading); `DropdownMenuSeparator` - `...Separator` styled `-mx-1 my-1 h-px
  bg-border`.
- `DropdownMenuShortcut` - a plain `span` (not a Radix part) styled `ml-auto text-caption
  text-text-subtle tracking-widest`, for a trailing shortcut hint.
- `DropdownMenuSubTrigger` - `...SubTrigger` with the item row styling plus a trailing chevron and
  `data-[state=open]:bg-muted-raised`; `DropdownMenuSubContent` - `...SubContent` in a portal with
  the same surface styling as `DropdownMenuContent`.

**Styling & recipe.** FULL LITERAL semantic-token utility strings on every styled wrapper (so
Tailwind v4's scanner emits each class), `cn()` merge with the caller `className` winning,
`forwardRef` on every styled part with a native prop spread, `React.ComponentRef` for ref typing
(not deprecated `React.ElementRef`), and **no `dark:` on the common path** - light/dark is a
token-layer property, and the portalled content inherits `.dark` from `<html>`. Highlight uses
`bg-muted-raised` (raised surface), and disabled uses the toggle disabled pair
(`opacity-50` + `cursor-not-allowed`) so a disabled checkbox/radio item keeps its fill. Cursor
follows the `cursor-pointer` idiom Button established.

**Accessibility.** Radix provides the roles (`menu`, `menuitem`, `menuitemcheckbox`,
`menuitemradio`), `aria-checked`, roving focus, typeahead, and focus-return-to-trigger. We do not
re-implement any of it; we guard the promises with **observable tests** (menu role appears on
open, item click fires + closes, checkbox toggles `aria-checked` and stays open, radio selects
one, arrow/enter/escape keyboard works, disabled item does not fire), per the repo learning that
a11y is proven by outcomes, not by asserting a class exists.

**Motion.** Optional: the content may use the existing `animate-pop-in` / `animate-pop-out`
keyframes gated with `motion-reduce:animate-none`; no new keyframes are introduced. If open/close
animation is added it stays on the tokenized presets, never inline.

**Trade-offs.**
- *New dep (`@radix-ui/react-dropdown-menu`)*: one more runtime dep on canopy, but it is the
  exact missing primitive, small, widely used, and consistent with the Radix family already
  vendored; hand-rolling roving focus + typeahead + submenu positioning would be far more code to
  own and to get right for a11y. **Flagged for the security and architecture personas** to weigh
  the new-dependency surface in review.
- *Re-export vs wrap*: parts that need no styling (`Root`, `Trigger`, `Group`, `RadioGroup`,
  `Sub`) are re-exported directly to keep the surface thin; only visual parts are wrapped. Keeps
  the file small and the API a 1:1 mirror of the familiar shadcn menu.
- *Static item tree only*: no in-menu search/virtualization in v1 (that is `Combobox`, 0030);
  keeps this component focused on the actions-menu job.

## Acceptance

- [ ] `DropdownMenu` and all its parts (`DropdownMenuTrigger`, `DropdownMenuContent`,
      `DropdownMenuItem`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioGroup`,
      `DropdownMenuRadioItem`, `DropdownMenuLabel`, `DropdownMenuSeparator`,
      `DropdownMenuShortcut`, `DropdownMenuGroup`, `DropdownMenuSub`, `DropdownMenuSubTrigger`,
      `DropdownMenuSubContent`) ship from `@rogueoak/canopy/branches` (exported via
      `branches/index.ts` with their prop types).
- [ ] Built on `@radix-ui/react-dropdown-menu`, added to `packages/canopy/package.json`
      dependencies **and** externalized in `packages/canopy/tsup.config.ts`.
- [ ] Recipe obeyed: full literal semantic-token utilities, `cn()` merge (caller `className`
      wins), `forwardRef` + native prop spread + `React.ComponentRef` on every styled part,
      **no `dark:` on the common path**; item highlight uses `bg-muted-raised`; disabled uses
      `disabled:opacity-50 disabled:cursor-not-allowed`.
- [ ] Portalled `DropdownMenuContent` themes correctly in light and dark via inherited `.dark`,
      with no per-portal theme wiring.
- [ ] a11y / keyboard: correct `menu` / `menuitem` / `menuitemcheckbox` / `menuitemradio` roles
      and `aria-checked`; arrow navigation, `Enter`/`Space` activate, `Escape` close (focus
      returns to trigger), and typeahead work; disabled items are inert and skipped.
- [ ] `DropdownMenuTrigger` composes over a canopy `Button` via `asChild` without nested buttons.
- [ ] Storybook catalog entry with Playground, CheckboxItems, RadioGroup, Submenu, WithShortcuts,
      and DisabledItems stories (light + dark from the toolbar); `pnpm storybook` build is green.
- [ ] Tests cover: trigger opens (menu role appears); item click fires + closes; checkbox item
      toggles `aria-checked` and stays open (controlled **and** uncontrolled); radio group selects
      one (controlled + uncontrolled); disabled item does not fire and keeps its state; keyboard
      arrow/enter/escape (focus returns to trigger); submenu opens; `className` merge; `ref`
      forwarding.
- [ ] `pnpm install && pnpm build && pnpm test && pnpm lint` all green from the repo root; text
      and source are ASCII-only.
- [ ] Canopy `README.md` component list includes DropdownMenu; `docs/overview/features.md` (new
      actions-menu capability) and `docs/overview/architecture.md` (new primitive
      `@radix-ui/react-dropdown-menu` in the canopy dependency footprint) updated on completion.
