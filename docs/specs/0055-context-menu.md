# 0055 - ContextMenu

## Problem

Canopy has no **right-click (context) menu**. Dropdown-style menus in canopy are opened by
clicking a trigger (`DropdownMenu`, 0054); there is no primitive for the menu that opens on the
platform **contextmenu** event - the right-click / long-press affordance users expect on rows,
cards, canvas nodes, file items, and other direct-manipulation surfaces. Today a consumer who
wants "right-click this item for actions" has to hand-wire the native `contextmenu` event, cancel
the browser default, position a floating surface at the pointer, and re-implement the full
menu semantics (roving focus, type-ahead, checkbox/radio items, submenus, escape/outside-click
dismissal). That is exactly the primitive a design system should own once.

`ContextMenu` is the pointer-triggered sibling of `DropdownMenu` (0054): it exposes the **same
menu part surface** (`Item` / `CheckboxItem` / `RadioGroup` + `RadioItem` / `Sub` / `Label` /
`Separator` / `Group`) with the same canopy styling, but opens from the contextmenu event and
anchors to the pointer instead of a trigger button. It lives in the Branch layer alongside the
other portalled, interaction-owning components (`Dialog` 0031, `Combobox` 0030), and reuses the
raised-surface / `bg-muted-raised` hover idioms established for portalled menus. shadcn/ui ships
`context-menu` as a distinct component from `dropdown-menu` for this reason; canopy mirrors that
split so the two menus share styling but keep their own trigger semantics.

This is for any app with direct-manipulation surfaces: data-grid rows, file/asset lists, kanban
cards, canvas/diagram nodes, tree items - anywhere the natural gesture is "right-click for more".

## Outcome

- A new canopy component family, `ContextMenu`, exported from `@rogueoak/canopy/branches`, that
  opens a **portalled menu on the contextmenu event** (right-click / long-press) anchored at the
  pointer, and dismisses on escape, outside-click, or item selection.
- **Part surface** (mirrors `DropdownMenu` 0054, canopy-styled): `ContextMenu` (root),
  `ContextMenuTrigger` (the region that captures the contextmenu event), `ContextMenuContent`
  (portalled, positioned surface), `ContextMenuItem`, `ContextMenuCheckboxItem`,
  `ContextMenuRadioGroup`, `ContextMenuRadioItem`, `ContextMenuLabel`, `ContextMenuSeparator`,
  `ContextMenuGroup`, `ContextMenuSub`, `ContextMenuSubTrigger`, `ContextMenuSubContent`, and
  `ContextMenuShortcut` (a plain styled span for the trailing hint).
- **States**: items support `disabled` (inert, muted, non-focusable); `CheckboxItem` and
  `RadioItem` render a leading check/dot **indicator** when selected and toggle correctly;
  `SubTrigger` shows a trailing chevron and opens `SubContent` on hover/right-arrow.
- **A11y + keyboard**: correct `menu` / `menuitem` / `menuitemcheckbox` / `menuitemradio` roles
  (supplied by Radix), roving focus, type-ahead, arrow/enter/escape navigation, right/left-arrow
  to enter/leave submenus - all provided by `@radix-ui/react-context-menu` and guarded by
  observable tests.
- **Theming**: styled with the 0005 recipe (full literal semantic-token Tailwind utilities,
  `cn()` merge, `forwardRef` + native prop spread), so it themes light/dark through the token
  layer with **no `dark:` on the common path**; the portalled content uses `bg-surface-raised`
  with `bg-muted-raised` for item highlight/hover (the raised-surface rule), matching
  `DropdownMenu` exactly so the two menus are visually identical.
- **Motion**: content uses the shared pop-in/out menu animation, gated with
  `motion-reduce:animate-none`.
- **Docs**: a Storybook catalog entry (playground, with-icons/shortcuts, checkbox + radio items,
  submenu, disabled items, on a real target region); canopy `README.md` component list and the
  `overview/` living docs updated on completion.

## Scope

### In

- `packages/canopy/src/branches/ContextMenu.tsx` (+ `packages/canopy/src/branches/ContextMenu.test.tsx`)
  - the component family and all its parts.
- Barrel export: add the `ContextMenu*` components and their `*Props` types to
  `packages/canopy/src/branches/index.ts`.
- New runtime dependency **`@radix-ui/react-context-menu`**: add to
  `packages/canopy/package.json` `dependencies`, and add it to the `external: [...]` list in
  `packages/canopy/tsup.config.ts` (per the canopy externalization rule - deps are external,
  only first-party source is bundled). Run `pnpm install` at the repo root after.
- Storybook story `apps/storybook/src/ContextMenu.stories.tsx`, importing from
  `@rogueoak/canopy/branches`; no per-story theme code (light/dark driven by the toolbar).
- Stories: **Playground** (a target region that opens a basic action menu), **WithIconsAndShortcuts**
  (leading icons + `ContextMenuShortcut` trailing hints), **CheckboxItems**, **RadioItems**,
  **Submenu** (nested `Sub`/`SubTrigger`/`SubContent`), **DisabledItems**, and **OnCard** (menu
  wired to a realistic card/row target).
- Tests: contextmenu event on the trigger opens the menu (menu role appears); `Escape` and
  outside-click close it; selecting an `Item` fires its handler and closes; a `disabled` item is
  inert (no handler, not focusable); `CheckboxItem` toggles its checked state and exposes
  `menuitemcheckbox`; `RadioItem` selection exposes `menuitemradio` and updates the group;
  submenu opens and its items are reachable; keyboard navigation (arrow/enter/escape) works;
  `className` merge (caller wins) on `Content` and `Item`; `ref` forwarding on styled wrappers.
- Docs on completion: canopy `README.md` component list, `docs/overview/features.md` (new
  right-click menu capability), and `docs/overview/architecture.md` (record the new
  `@radix-ui/react-context-menu` primitive in the canopy dependency footprint).

### Out

- **Changing or extracting `DropdownMenu` (0054)** - `ContextMenu` is additive and stands on its
  own Radix primitive; the two share styling **idioms** (copied token classes) but are not
  refactored into a shared internal base in this spec. A later spec may lift a shared menu-parts
  helper if the duplication proves costly. No other component is touched.
- **Custom pointer/long-press tuning** (touch long-press delay, custom anchor offset math) -
  v1 uses the Radix primitive's built-in contextmenu handling and positioning.
- **Nested-beyond-one-level submenu ergonomics** - submenus are supported (Radix handles arbitrary
  depth), but only single-level nesting is exercised in stories/tests for v1.
- **Virtualized / very long menus** - flat menus for v1.
- Introducing a second primitive library - v1 stays on the Radix + 0005-recipe stack that every
  existing canopy component uses.

## Approach

**Primitive stack: `@radix-ui/react-context-menu` + the 0005 recipe.** Canopy is built entirely
on Radix primitives; the context menu follows suit. `@radix-ui/react-context-menu` provides the
contextmenu-event trigger, pointer-anchored collision-aware positioning, portalling, roving focus,
type-ahead, submenu machinery, and the full `menu` / `menuitem` / `menuitemcheckbox` /
`menuitemradio` role set. It is the pointer-triggered counterpart to the dropdown primitive used
in 0054 and shares an almost identical part API, so `ContextMenu` mirrors that surface part-for-part
and only differs in the trigger (a captured region rather than a button). Being Radix-portalled
under `<body>` with `.dark` on `<html>`, the content themes correctly with no per-portal wiring
(the portal-theming learning).

**New dependency (flag for review).** `@radix-ui/react-context-menu` is added as a runtime
**dependency** of `@rogueoak/canopy` and externalized in `tsup.config.ts` alongside the other
Radix packages (deps are external; only first-party source is bundled). It is a small, first-party
Radix package from the same family already vendored across canopy, so the added surface is minimal -
but the security and architecture personas should still weigh the new-dependency footprint in
review (one more package in the consumer graph, recorded in `overview/architecture.md`).

**Part surface (mirrors `DropdownMenu` 0054, canopy-styled).**
- `ContextMenu` - `ContextMenuPrimitive.Root` (owns open state).
- `ContextMenuTrigger` - the region that captures the contextmenu gesture; supports `asChild`
  via the primitive so callers can attach it to any element (a row, card, canvas node).
- `ContextMenuContent` - the `ContextMenuPrimitive.Content` wrapped in `Portal`, styled to match
  `DropdownMenuContent`: `z-50 min-w-[8rem] overflow-hidden rounded-md border border-border
  bg-surface-raised p-1 text-text shadow-md`, plus the pop-in/out menu animation gated with
  `motion-reduce:animate-none`.
- `ContextMenuItem` / `ContextMenuCheckboxItem` / `ContextMenuRadioItem` - styled rows with
  `bg-muted-raised` highlight on focus (the raised-surface rule, not `bg-muted`), the shared
  disabled idiom for menu rows (`data-[disabled]:pointer-events-none data-[disabled]:opacity-50`),
  and a leading indicator slot for the check/dot on the checkbox/radio variants.
- `ContextMenuSubTrigger` / `ContextMenuSubContent` - same styling as content/item with a trailing
  chevron on the trigger; `ContextMenuLabel` (muted `text-caption`), `ContextMenuSeparator`
  (`-mx-1 my-1 h-px bg-border`), `ContextMenuGroup`, `ContextMenuRadioGroup`, and
  `ContextMenuShortcut` (a right-aligned `ml-auto text-caption text-text-subtle` span).

**Styling & recipe.** FULL LITERAL token utility strings on every styled part (so Tailwind v4's
scanner emits each class - no dynamic construction), `cn()` merge with caller `className` winning,
`forwardRef` on every styled wrapper with a native prop spread, `React.ComponentRef<typeof ...>`
for ref types (not the deprecated `React.ElementRef`), semantic tokens only, and **no `dark:` on
the common path**. The token classes are copied verbatim from `DropdownMenu` so an item, submenu,
separator, and shortcut read identically across the two menus.

**Accessibility.** Radix supplies the roles, roving focus, type-ahead, and keyboard model; the
spec adds nothing custom. The a11y promises are guarded by **observable tests** (menu role appears
on contextmenu, `menuitemcheckbox` / `menuitemradio` roles present and toggling, submenu items
reachable, keyboard navigation works), per the repo learning that a11y is proven by outcomes, not
by asserting that a class exists.

**Trade-offs.**
- *Separate component vs one shared menu base with `DropdownMenu`*: keeping `ContextMenu` on its
  own primitive with copied token classes duplicates a little styling, but each menu keeps its own
  trigger semantics and Radix primitive, and mirrors shadcn's split. Extracting a shared parts
  helper is deferred until the duplication is proven costly (recorded as Out).
- *New dep*: one more Radix package in the consumer graph; accepted because it is the exact missing
  primitive and hand-rolling contextmenu positioning + menu semantics would be far more code to own.

## Acceptance

- [ ] `ContextMenu` and all its parts ship from `@rogueoak/canopy/branches` (exported via
      `branches/index.ts`), built on `@radix-ui/react-context-menu` (added to
      `packages/canopy/package.json` dependencies **and** externalized in
      `packages/canopy/tsup.config.ts`); no `dark:` on the common path.
- [ ] The menu opens on the **contextmenu** event on `ContextMenuTrigger`, anchored at the pointer,
      and closes on `Escape`, outside-click, and item selection.
- [ ] Part surface present and styled to match `DropdownMenu`: `Content` uses `bg-surface-raised`
      with `bg-muted-raised` item highlight (raised-surface rule), `Separator`, `Label`, `Group`,
      `Sub`/`SubTrigger`/`SubContent`, and `Shortcut`.
- [ ] `disabled` items are inert (no handler, not focusable, muted); `CheckboxItem` toggles and
      exposes `menuitemcheckbox`; `RadioItem` selection updates the group and exposes
      `menuitemradio`; each shows its indicator when selected.
- [ ] Keyboard + ARIA: correct `menu` / `menuitem` / `menuitemcheckbox` / `menuitemradio` roles,
      roving focus, arrow/enter/escape navigation, and right/left-arrow enter/leave a submenu.
- [ ] Recipe obeyed: full literal semantic-token classes, `cn()` merge (caller `className` wins),
      `forwardRef` + native prop spread, `React.ComponentRef` ref types; content motion gated with
      `motion-reduce:animate-none`.
- [ ] Storybook catalog entry with Playground, WithIconsAndShortcuts, CheckboxItems, RadioItems,
      Submenu, DisabledItems, and OnCard stories; renders light **and** dark from the toolbar;
      `pnpm storybook` build is green.
- [ ] Tests cover: contextmenu opens the menu, Escape + outside-click close, item select fires +
      closes, disabled item inert, checkbox toggles, radio selects, submenu opens and its items are
      reachable, keyboard navigation works, `className` merge (caller wins), `ref` forwarding.
- [ ] `pnpm install && pnpm build && pnpm test && pnpm lint` all pass from the repo root.
- [ ] Canopy `README.md` component list includes ContextMenu; `docs/overview/features.md` (new
      right-click menu capability) and `docs/overview/architecture.md` (new
      `@radix-ui/react-context-menu` primitive in the canopy dependency footprint) updated on
      completion.
