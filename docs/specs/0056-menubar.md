# 0056 - Menubar

## Problem

Canopy has portalled overlay surfaces - `Dialog` (0021), `ResponsiveDialog`, and the
popover-backed `Combobox` (0030) - and navigation Branches like `TopNav` and `SideNav`, but no
**menu bar**: the horizontal strip of top-level menus (File / Edit / View ...) that a
desktop-style application puts along the top of its window. shadcn/ui ships a Menubar built on
`@radix-ui/react-menubar`; canopy has the sibling primitives that share its look (the raised,
portalled content styling used by `Dialog` and `Combobox`) but not the menu bar itself. A
consumer who wants an app-shell menu today has to hand-roll roving focus across triggers,
open-on-hover-when-a-sibling-is-open behaviour, portalled sub-menus, and the checkbox / radio /
shortcut item chrome - exactly the kind of composite the design system should own once.

This is for **application shells and desktop-like tools** built on canopy: an editor, a dashboard
builder, an admin console - anywhere a persistent horizontal command surface (with grouped items,
toggles, radios, and nested sub-menus) belongs at the top of the frame. It complements the
navigation Branches (`TopNav`, `SideNav`) rather than replacing them: those route between pages;
Menubar issues commands within a page.

## Outcome

- A new canopy Branch family, `Menubar`, exported from `@rogueoak/canopy/branches`, that renders a
  horizontal bar of top-level menu triggers with roving focus. Opening one menu and moving to a
  sibling trigger switches menus without a second click (native Radix Menubar behaviour).
- **Parts exported**: `Menubar` (root bar), `MenubarMenu`, `MenubarTrigger`, `MenubarContent`,
  `MenubarItem`, `MenubarCheckboxItem`, `MenubarRadioGroup`, `MenubarRadioItem`, `MenubarSub`,
  `MenubarSubTrigger`, `MenubarSubContent`, `MenubarSeparator`, `MenubarLabel`, and
  `MenubarShortcut`.
- **States**: items support `disabled` (inert, muted); `MenubarCheckboxItem` and
  `MenubarRadioItem` render a leading check / dot when checked and manage checked state through
  Radix; sub-menus open on hover / right-arrow and portal alongside the parent; `MenubarShortcut`
  renders a muted, right-aligned key hint.
- **a11y / roles**: Radix Menubar supplies `menubar` / `menu` / `menuitem` /
  `menuitemcheckbox` / `menuitemradio` roles, roving `tabindex`, `aria-haspopup` /
  `aria-expanded` on triggers, and full keyboard operation (Left/Right across triggers, Up/Down
  within a menu, Right/Enter into a sub-menu, Left/Escape out, type-ahead). Disabled items are
  skipped by keyboard navigation.
- **Theming**: styled with the 0005 recipe (full literal semantic-token Tailwind utilities,
  `cn()` merge, `forwardRef` + native prop spread), so it themes light/dark through the token
  layer with **no `dark:` on the common path**; portalled `MenubarContent` / `MenubarSubContent`
  use the raised-surface tokens (`bg-surface-raised`, `bg-muted-raised` on highlight) matching the
  other portalled overlays and inherit `.dark` from `<html>`.
- **Docs**: a Storybook catalog entry (Playground with a full File/Edit/View bar, plus
  checkbox-item, radio-group, sub-menu, disabled, and shortcut stories) in both themes; canopy
  `README.md` component list and the `overview/` living docs updated on completion.

## Scope

### In
- `packages/canopy/src/branches/Menubar.tsx` (+ `Menubar.test.tsx`) - the component family and
  its parts, exported from `packages/canopy/src/branches/index.ts`.
- All parts listed in Outcome, each a thin canopy-styled `forwardRef` wrapper over the matching
  `@radix-ui/react-menubar` primitive, using `React.ComponentRef` for the ref type and spreading
  native props. Portalled `MenubarContent` / `MenubarSubContent` render inside
  `MenubarPrimitive.Portal` and carry the raised-surface styling.
- One new runtime dependency on `@rogueoak/canopy`: **`@radix-ui/react-menubar`**, added to
  `packages/canopy/package.json` `dependencies` **and** externalized in
  `packages/canopy/tsup.config.ts` `external: [...]` (matching every other Radix dep), with
  `pnpm install` run at the repo root afterward.
- Storybook stories in `apps/storybook/src/Menubar.stories.tsx` importing from
  `@rogueoak/canopy/branches`: **Playground** (full File/Edit/View bar), **CheckboxItems**,
  **RadioGroup**, **SubMenu** (nested), **DisabledItems**, **WithShortcuts** - each rendering in
  light and dark via the toolbar, no per-story theme code.
- Tests (Vitest + Testing Library): renders the `menubar` role and top-level `menuitem` triggers;
  clicking a trigger opens its menu (`menu` role appears) and items render; keyboard Left/Right
  moves between triggers and Up/Down/Enter operates items; a `MenubarCheckboxItem` toggles its
  checked state (controlled and uncontrolled); a `MenubarRadioItem` selects within its group; a
  `disabled` item is inert (does not fire `onSelect`); a sub-menu opens and its items render;
  `className` merge lets the caller win; `ref` forwards to the underlying element.
- canopy `README.md` component list, `docs/overview/features.md` (new Menubar capability), and
  `docs/overview/architecture.md` (the new `@radix-ui/react-menubar` runtime dependency in the
  canopy footprint) updated on completion.

### Out
- **Context menu** (right-click `@radix-ui/react-context-menu`) and a standalone
  **DropdownMenu** - related but distinct primitives; separate follow-up specs. Menubar covers the
  horizontal-bar case only.
- **Application shell / window chrome** (title bar, traffic-light controls, resizable frame) -
  Menubar is the menu strip, not the window; composing it into a full app-shell layout is a later
  Branch.
- **Icons inside items** beyond what a caller passes as children - Menubar styles the item slots
  (leading indicator column, trailing shortcut) but does not ship an icon set.
- **Changing** `TopNav`, `SideNav`, `Dialog`, `Combobox`, or any other existing component -
  Menubar is purely additive; no other component's public API changes.

## Approach

**Primitive stack: `@radix-ui/react-menubar` + the 0005 recipe.** Canopy is built entirely on
Radix primitives, and Menubar is a first-class Radix package that already implements roving focus
across triggers, the open-sibling-on-hover behaviour, portalled content and sub-content, and the
checkbox / radio / label / separator item roles. Each canopy part is a thin `forwardRef` wrapper
that applies full literal semantic-token utility classes and spreads native props onto the Radix
primitive - the same pattern as the other portalled Branches. Because the primitive is portalled
under `<body>` with `.dark` on `<html>`, the content themes correctly with no per-portal wiring
(same note as `Dialog` / `Combobox`).

**New dependency - flag for review.** `@radix-ui/react-menubar` is a new runtime dependency of
`@rogueoak/canopy`. It is added to `dependencies` in `packages/canopy/package.json` and
externalized in `tsup.config.ts` alongside the existing `@radix-ui/*` deps (never bundled, so the
consumer installs one copy), per the canopy externalization rule. It is a small, first-party Radix
package from the same family already pervasively used across canopy, so the added surface is
minimal - but the **security and architecture personas should weigh the new-dependency footprint
in review**, and `docs/overview/architecture.md` records it.

**Part surface (mirrors the shadcn Menubar, canopy-styled).**
- `Menubar` - the root bar: `MenubarPrimitive.Root` styled as a horizontal flex strip with
  `bg-surface`, a `border-border` bottom edge / rounded container, `rounded-md`, and item gap.
- `MenubarMenu` / `MenubarRadioGroup` - non-visual grouping primitives re-exported as-is.
- `MenubarTrigger` / `MenubarSubTrigger` - the clickable labels: `text-label text-text`, padded,
  `rounded-sm`, `data-[state=open]:bg-muted` highlight, focus-visible ring, and
  `data-[disabled]:text-disabled-foreground`. `MenubarSubTrigger` adds a trailing chevron.
- `MenubarContent` / `MenubarSubContent` - `MenubarPrimitive.Content` / `SubContent` inside
  `MenubarPrimitive.Portal`, styled `z-50 min-w-[12rem] rounded-md border border-border`
  `bg-surface-raised p-1 text-text shadow-md` - the same raised-overlay chrome as the other
  portalled surfaces.
- `MenubarItem` / `MenubarCheckboxItem` / `MenubarRadioItem` - the rows: `rounded-sm px-2 py-1.5`
  `text-body-sm`, `focus:bg-muted-raised` highlight (raised-surface rule, not `bg-muted`),
  `data-[disabled]:pointer-events-none data-[disabled]:opacity-50`. Checkbox / radio items reserve
  a leading indicator column (`MenubarPrimitive.ItemIndicator` with a check / dot).
- `MenubarSeparator` - `-mx-1 my-1 h-px bg-border`.
- `MenubarLabel` - a muted, non-interactive group heading (`text-caption text-text-muted`).
- `MenubarShortcut` - a plain `<span>` (not a Radix part): `ml-auto text-caption`
  `text-text-subtle tracking-widest` for the right-aligned key hint.

**Styling & recipe.** FULL LITERAL token utility strings (so Tailwind v4's scanner emits each - no
dynamic class construction), `cn()` merge with caller `className` winning, `forwardRef` on every
styled wrapper with a native prop spread, `React.ComponentRef` ref types, semantic tokens only,
and **zero `dark:` on the common path** - identical to 0005 and the other portalled Branches.
Highlight / hover on the portalled content uses the **raised** tokens (`bg-muted-raised`), not
`bg-muted`, per the raised-surface learning.

**Accessibility.** Radix Menubar supplies the `menubar` / `menu` / `menuitem` /
`menuitemcheckbox` / `menuitemradio` roles, roving `tabindex`, `aria-haspopup` / `aria-expanded`
on triggers, type-ahead, and the full keyboard model (Left/Right across triggers, Up/Down within a
menu, Right/Enter into a sub-menu, Left/Escape out). These promises are **guarded by observable
tests** (roles appear on open, keyboard navigation moves focus and operates items, disabled items
are skipped and do not select) rather than by asserting class names, per the repo learning that
a11y is proven by outcomes.

**Motion.** Optional only: if enter/leave animation is added to the portalled content it uses the
existing `animate-pop-in` / `animate-pop-out` keyframes gated with `motion-reduce:animate-none`;
no new keyframes are introduced.

## Acceptance

- [ ] `Menubar` and all its parts (`MenubarMenu`, `MenubarTrigger`, `MenubarContent`,
      `MenubarItem`, `MenubarCheckboxItem`, `MenubarRadioGroup`, `MenubarRadioItem`, `MenubarSub`,
      `MenubarSubTrigger`, `MenubarSubContent`, `MenubarSeparator`, `MenubarLabel`,
      `MenubarShortcut`) ship from `@rogueoak/canopy/branches` (exported via
      `branches/index.ts`), built on `@radix-ui/react-menubar`.
- [ ] `@radix-ui/react-menubar` is added to `packages/canopy/package.json` `dependencies` **and**
      externalized in `packages/canopy/tsup.config.ts`; `pnpm install` reflects it in the lockfile.
- [ ] Recipe obeyed: full literal semantic-token classes, `cn()` merge (caller `className` wins),
      `forwardRef` + native prop spread, `React.ComponentRef` ref types, semantic tokens only, and
      **no `dark:` on the common path**; portalled content uses `bg-surface-raised` /
      `bg-muted-raised` and themes light **and** dark through the token layer.
- [ ] a11y / keyboard: `menubar` / `menu` / `menuitem` / `menuitemcheckbox` / `menuitemradio`
      roles present; Left/Right moves between triggers, Up/Down/Enter operates items, a sub-menu
      opens via Right/hover; roving focus and type-ahead work.
- [ ] `MenubarCheckboxItem` toggles checked (controlled **and** uncontrolled); `MenubarRadioItem`
      selects within its group; a `disabled` item is inert (no `onSelect`) and skipped by keyboard.
- [ ] Storybook catalog entry (`apps/storybook/src/Menubar.stories.tsx`) with Playground,
      CheckboxItems, RadioGroup, SubMenu, DisabledItems, and WithShortcuts stories rendering in
      both themes; the Storybook build is green.
- [ ] Tests listed in Scope pass: renders menubar + triggers, opens on click, keyboard navigation,
      checkbox/radio toggle (controlled + uncontrolled), disabled inert, sub-menu opens,
      `className` merge, `ref` forwarding.
- [ ] `pnpm install`, `pnpm build`, `pnpm test`, and `pnpm lint` are green from the repo root.
- [ ] Canopy `README.md` component list includes Menubar; `docs/overview/features.md` (new Menubar
      capability) and `docs/overview/architecture.md` (the new `@radix-ui/react-menubar` runtime
      dependency) updated on completion.
