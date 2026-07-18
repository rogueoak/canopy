# 0069 - NavigationMenu

## Problem

Canopy has an application chrome tier - `TopNav` (0025) for the bar, `SideNav` (0026) for the
rail, `Dialog` (0024) and `ResponsiveDialog` for overlays - but no **site navigation menu with
dropdown mega-menus**. `TopNav` today renders a **flat row of links** (`TopNavLink`): good for
"Home / Docs / Pricing", but there is no first-class way to expose a **grouped, hover/focus
dropdown** ("Products" opening a panel of categorized links, a "Solutions" mega-menu) with the
correct roving-focus keyboard model, an animated **active indicator** under the open item, and a
**portalled viewport** that positions and sizes to the open content. A consumer who needs that
today has to hand-roll the WAI-ARIA menubar-style interaction against raw elements -
re-implementing arrow-key traversal, hover-intent, focus management, and the indicator - exactly
the once-owned behaviour a design system exists to provide.

This is for the marketing/site header and any top-level navigation surface with more than a
handful of destinations: product menus, "Solutions" and "Resources" mega-menus, docs section
switchers. It belongs in canopy because Radix ships `@radix-ui/react-navigation-menu` - the same
Radix + 0005-recipe stack every canopy component already uses - and shadcn's registry has no such
part in this repo yet, leaving a gap between the flat `TopNavLink` and a full navigation menu.
`NavigationMenu` slots between `TopNav` (0025) and `SideNav` (0026) as the missing horizontal
navigation primitive, and `TopNav` refactors to compose it where a menu adds value.

## Outcome

- A new canopy Branch family, `NavigationMenu`, exported from `@rogueoak/canopy/branches`, built
  on `@radix-ui/react-navigation-menu`, with parts: `NavigationMenu`, `NavigationMenuList`,
  `NavigationMenuItem`, `NavigationMenuTrigger`, `NavigationMenuContent`, `NavigationMenuLink`,
  `NavigationMenuIndicator`, and `NavigationMenuViewport`.
- **Dropdown mega-menu**: a `NavigationMenuTrigger` opens its `NavigationMenuContent` on
  hover/focus/click; content is any layout of `NavigationMenuLink`s (a simple column or a
  multi-column mega-menu). Only one item is open at a time; moving between triggers switches the
  open panel.
- **Active indicator**: `NavigationMenuIndicator` renders an arrow/underline that tracks the
  currently open trigger, and `NavigationMenuViewport` is the portalled, size-and-position-synced
  container the active content renders into.
- **Plain links**: a `NavigationMenuItem` may hold a bare `NavigationMenuLink` (no trigger/content)
  for a flat destination, with `active` surfacing `data-active` + `aria-current="page"` styling in
  lockstep (mirroring `TopNavLink`'s active idiom).
- **Keyboard + a11y**: Radix supplies the navigation-menu roles and roving focus - arrow keys move
  between triggers, `Enter`/`Space` open content, `Escape` closes and returns focus to the trigger,
  `Tab` moves into open content. Correct `aria-expanded` on triggers and a labelled `<nav>`.
- **Theming**: styled with the 0005 recipe (full-literal semantic-token utilities, `cn()` merge,
  `forwardRef` + native prop spread, `React.ComponentRef`), so it themes light/dark through the
  token layer with **no `dark:` on the common path**; the portalled viewport themes correctly (it
  inherits `.dark` from `<html>`, like `DialogContent` / `SelectContent`).
- **Motion**: content enter/leave and the viewport resize use existing token animations gated with
  `motion-reduce:animate-none`; no new keyframe.
- **TopNav refactor**: `TopNav` (0025) composes `NavigationMenu` for its links area where a
  dropdown adds value, **keeping its public API and responsive mobile collapse unchanged**.
- **Docs**: a Storybook catalog entry (playground, simple dropdown, multi-column mega-menu, plain
  links, active item, disabled trigger) plus canopy `README.md` and the `overview/` living docs
  updated on completion.

## Scope

### In
- `packages/canopy/src/branches/NavigationMenu.tsx` (+ `NavigationMenu.test.tsx`) - the component
  family and its eight parts, exported from `packages/canopy/src/branches/index.ts` (component and
  prop types).
- New runtime dependency **`@radix-ui/react-navigation-menu`**: added to
  `packages/canopy/package.json` `dependencies` AND externalized in `packages/canopy/tsup.config.ts`
  `external: [...]` (per the canopy externalization rule), with `pnpm install` run at the repo root.
- Parts: `NavigationMenu` (root `<nav>`), `NavigationMenuList`, `NavigationMenuItem`,
  `NavigationMenuTrigger` (with chevron), `NavigationMenuContent`, `NavigationMenuLink` (supports
  `active` + `asChild`), `NavigationMenuIndicator`, `NavigationMenuViewport` (portalled). All styled
  with full-literal semantic-token classes, `cn()` merge, `forwardRef`, native prop spread.
- **TopNav (0025) refactor**: `TopNavLinks` internals updated to compose `NavigationMenu` for the
  links area where a dropdown adds value; `TopNav`'s **public API is unchanged** (all existing
  exports, prop shapes, `aria-current` active idiom, and the mobile disclosure collapse behaviour
  preserved), with `TopNav.test.tsx` still green.
- Storybook stories in `apps/storybook/src/` importing from `@rogueoak/canopy/branches`.
- Stories: Playground, SimpleDropdown, MegaMenu (multi-column content), PlainLinks (bare links, no
  dropdown), ActiveItem, DisabledTrigger - shown in both themes via the toolbar (no per-story theme
  code).
- Tests: renders the `<nav>` and list; a trigger opens its content on interaction and closes
  others; `active` link exposes `aria-current="page"`; keyboard (arrow between triggers, `Enter`
  opens, `Escape` closes and returns focus); disabled trigger is inert; `className` merge (caller
  wins); `ref` forwarding on each styled part; `asChild` on `NavigationMenuLink`. Plus a `TopNav`
  regression test proving the refactor kept the public API and mobile collapse.
- Canopy `README.md` component list, `overview/features.md` (new capability), and
  `overview/architecture.md` (new primitive `@radix-ui/react-navigation-menu` in the canopy
  dependency footprint) updated on completion.

### Out
- **Router integration** - `NavigationMenuLink` stays router-agnostic via `asChild`; no bundled
  `Link` adapter (matches `TopNavLink`).
- **A general application menubar / command menu** (⌘K, app menu bar with sub-menus) - that is
  `@radix-ui/react-menubar` / `cmdk` territory and a separate later spec.
- **Mobile-specific accordion rendering** of the mega-menu - `NavigationMenu` v1 is the horizontal
  desktop menu; the mobile collapse story stays TopNav's existing disclosure panel (deferred:
  a responsive accordion variant is a clean follow-up).
- **Changing any unrelated component** - the only existing component touched is `TopNav` (0025),
  and only its links-area internals; `SideNav`, `Dialog`, and the Seeds/Twigs are untouched.
- **Introducing a second primitive library** - v1 stays on the Radix stack that matches every
  existing canopy component.

## Approach

**Primitive stack: `@radix-ui/react-navigation-menu` + the 0005 recipe.** Canopy is built entirely
on Radix primitives with the 0005 recipe, and this Branch follows suit. Radix
`NavigationMenu` owns the hard parts: the WAI-ARIA navigation-menu semantics, roving focus and
arrow-key traversal between triggers, hover-intent + focus open/close, single-open coordination,
the `Indicator` that tracks the active trigger, and the portalled `Viewport` that positions and
size-syncs to the open content (exposing the `--radix-navigation-menu-viewport-width/height` CSS
vars). We add only canopy styling. The dependency is added to canopy `dependencies` and
externalized in `tsup.config.ts` alongside the other Radix deps (bundling it would risk a duplicate
in the consumer graph). **This new dependency should be weighed by the security and architecture
review personas** as an addition to canopy's dependency footprint (it is a small, first-party Radix
package, exactly the missing primitive).

**Part surface (mirrors the Radix/shadcn navigation menu, canopy-styled).**
- `NavigationMenu` - the root `NavigationMenu.Root` rendered as a labelled `<nav>`; thin
  `relative z-10 flex` wrapper. Renders the `NavigationMenuViewport` after its list by default so
  the portalled content has a positioned container.
- `NavigationMenuList` - `NavigationMenu.List`, a `flex` row (`gap-1`) of items.
- `NavigationMenuItem` - `NavigationMenu.Item`, an unstyled list wrapper.
- `NavigationMenuTrigger` - `NavigationMenu.Trigger` styled like a ghost nav control
  (`rounded-md px-3 py-2 text-body-sm text-text-muted hover:text-text`, focus-visible ring,
  `disabled:*` inert, a trailing chevron SVG that rotates on `data-state="open"` with
  `motion-reduce:*` guarding the transform).
- `NavigationMenuContent` - `NavigationMenu.Content`, the panel that mounts into the viewport;
  enter/leave use the existing pop/fade token animations gated `motion-reduce:animate-none`. Any
  layout of links (single column or a multi-column mega-menu grid) composes inside.
- `NavigationMenuLink` - `NavigationMenu.Link`; a nav link with `active` driving `data-active` +
  `aria-current="page"` and the active token styling in lockstep (idle muted, active `text-text`),
  and `asChild` to wrap a router `<Link>` (mirrors `TopNavLink`).
- `NavigationMenuIndicator` - `NavigationMenu.Indicator`, the arrow/underline that tracks the open
  trigger, styled with `bg-border`/`bg-surface-raised` and a small rotated marker.
- `NavigationMenuViewport` - `NavigationMenu.Viewport`, the portalled, size-synced container
  (`bg-surface-raised border border-border rounded-md shadow-md`, width/height driven by the Radix
  CSS vars), positioned under the list. Being portalled under `<body>` with `.dark` on `<html>`, it
  themes correctly with no per-portal wiring.

**TopNav refactor (API-preserving).** `TopNavLinks` currently renders a flat responsive row/panel
of `TopNavLink`s. The refactor lets that links area compose `NavigationMenu` where a dropdown adds
value (grouped destinations), while the **public surface of `TopNav` is unchanged**: `TopNav`,
`TopNavBrand`, `TopNavLinks`, `TopNavLink`, `TopNavActions`, `TopNavMenuButton` and their prop types
keep their signatures, the `aria-current` active idiom is preserved, and the mobile `md:hidden`
disclosure panel (menu button + `aria-expanded`/`aria-controls` + Esc/outside-click + focus-return)
still governs the small-screen collapse. Flat-link usage of `TopNav` continues to work verbatim;
the menu is additive. This is called out explicitly so the refactor is judged on preserving 0025's
contract.

**Styling & recipe.** FULL LITERAL token-utility strings (so Tailwind v4's scanner emits each -
including the responsive/`data-state` literals), `cn()` merge with caller-wins, `forwardRef` on
every styled wrapper with native prop spread, `React.ComponentRef` for ref typing, semantic tokens
only, and **no `dark:` on the common path**. Raised/portalled surfaces use `bg-surface-raised` per
the raised-surface rule.

**Accessibility.** Radix supplies the navigation-menu roles, `aria-expanded` on triggers, roving
focus, arrow-key traversal, `Escape`-to-close-with-focus-return, and the labelled structure; we add
the accessible `<nav>` name and the `active` -> `aria-current="page"` mapping. Every a11y promise is
guarded by **observable tests** (open on interaction, `aria-current` present, keyboard traversal
and Escape behaviour, disabled trigger inert), per the repo learning that a11y is proven by
outcomes, not scaffolding.

**Motion.** Content enter/leave and viewport resize reuse existing token animations
(`animate-pop-in/out` / `animate-fade-in/out`) and are gated with `motion-reduce:animate-none`; the
chevron rotation is gated `motion-reduce:*`. No new keyframe is introduced.

## Acceptance

- [ ] `NavigationMenu`, `NavigationMenuList`, `NavigationMenuItem`, `NavigationMenuTrigger`,
      `NavigationMenuContent`, `NavigationMenuLink`, `NavigationMenuIndicator`, and
      `NavigationMenuViewport` ship from `@rogueoak/canopy/branches` (exported via
      `branches/index.ts`, component + prop types), built on `@radix-ui/react-navigation-menu`.
- [ ] `@radix-ui/react-navigation-menu` is added to `packages/canopy/package.json` `dependencies`
      AND externalized in `packages/canopy/tsup.config.ts`; `pnpm install` run at the root.
- [ ] Recipe obeyed: full-literal semantic-token classes, `cn()` merge (caller wins), `forwardRef`
      + native prop spread, `React.ComponentRef` typing, semantic tokens only, and **no `dark:` on
      the common path**; the portalled viewport themes correctly light and dark.
- [ ] A trigger opens its `NavigationMenuContent` on interaction and switches the open panel when
      moving between triggers; the `NavigationMenuIndicator` tracks the open trigger.
- [ ] Keyboard + ARIA: arrow keys move between triggers, `Enter`/`Space` opens content, `Escape`
      closes and returns focus to the trigger; triggers expose `aria-expanded`; the root is a
      labelled `<nav>`.
- [ ] A plain `NavigationMenuLink` with `active` exposes `aria-current="page"` + active styling in
      lockstep; a disabled trigger is inert.
- [ ] `NavigationMenuLink` supports `asChild`; `className` merges with caller winning; `ref`
      forwards on each styled part.
- [ ] **TopNav (0025) refactor**: its links area composes `NavigationMenu` where a dropdown adds
      value; TopNav's public API (all exports/prop shapes, `aria-current` idiom) and the mobile
      responsive collapse are unchanged; `TopNav.test.tsx` stays green.
- [ ] Storybook catalog entry with Playground, SimpleDropdown, MegaMenu, PlainLinks, ActiveItem,
      and DisabledTrigger stories in both themes; the Storybook build is green.
- [ ] Tests cover: renders nav + list, trigger opens content + switches panels, `active` ->
      `aria-current`, keyboard traversal + `Enter` opens + `Escape` closes/returns focus, disabled
      trigger inert, `className` merge, `ref` forwarding, `asChild` on link, and the TopNav
      API/collapse regression. `pnpm test` / `pnpm lint` / `pnpm build` pass from the root.
- [ ] Canopy `README.md` component list includes NavigationMenu; `overview/features.md` (new
      capability) and `overview/architecture.md` (new primitive `@radix-ui/react-navigation-menu` in
      the canopy dependency footprint) updated on completion.
