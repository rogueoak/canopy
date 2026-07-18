# 0050 - scroll-area

## Problem

Canopy has several components that wrap long, scrollable content - `Combobox` (0030) option
lists, `SideNav` (a long nav column), `Dialog` (0028) bodies - but no owned **scroll container**.
Today that content falls back to the browser's native overflow scrollbars, which look different
in every browser (chunky on Windows, overlay on macOS, unstyled on Linux), ignore the token
layer entirely, and can't be made to read as part of the design system in light or dark. shadcn
fills this exact gap with a `ScrollArea` built on `@radix-ui/react-scroll-area`; canopy has no
equivalent, so any surface that needs a themed, consistent scroll region has to either accept the
native bar or hand-roll a custom one.

This is for any surface that renders more content than fits: menu/list popovers, nav rails,
dialog and drawer bodies, code/log panels, tables of contents. The priority is a **thin, themed,
cross-browser scrollbar** that hides until needed and matches the token layer, so scrollable
regions across canopy look like one system rather than the host OS.

## Outcome

- A new canopy component family, `ScrollArea`, exported from `@rogueoak/canopy` (via the
  `branches` barrel), that wraps arbitrary content in a custom, cross-browser scroll container:
  a viewport plus a styled `ScrollBar`.
- **Parts**: `ScrollArea` (the root - renders Radix `Root` + `Viewport`, spreads children into
  the viewport, and includes a vertical `ScrollBar` and the `Corner` by default) and `ScrollBar`
  (the draggable bar, orientation `vertical` (default) or `horizontal`).
- **Styling**: a thin themed scrollbar - a slim track with a `bg-border` thumb that rounds
  (`rounded-full`) and sits flush to the edge; the native OS scrollbar is suppressed so only the
  themed bar shows. Both orientations supported, plus the `Corner` where they meet.
- **Behaviour**: the bar follows Radix's default hover/scroll reveal; content scrolls with wheel,
  touch, and keyboard as the native viewport does; caller sets the region's height/max-height via
  `className` and the viewport handles overflow.
- **a11y**: the scroll viewport keeps native keyboard scrolling and focusability; the scrollbar
  parts are presentational (Radix marks them so assistive tech reads the content, not the bar).
  No roles are invented; observable tests assert the content renders and remains reachable.
- **Theming**: styled with the 0005 recipe (full literal semantic-token utilities, `cn()` merge,
  `forwardRef` + native prop spread), so it themes light/dark through the token layer with no
  `dark:` on the common path; the `bg-border` thumb reads correctly in both themes.
- **Docs**: a Storybook catalog entry (vertical list, horizontal row, both scrollbars, inside a
  bordered card) in both themes; canopy README component list and the `overview/` living docs
  updated on completion.

## Scope

### In
- `packages/canopy/src/branches/ScrollArea.tsx` (+ `ScrollArea.test.tsx`) - the component family
  and its parts, exported from `packages/canopy/src/branches/index.ts` (`ScrollArea`, `ScrollBar`
  and their prop types).
- Two parts: **`ScrollArea`** (Radix `Root` + `Viewport` wrapper that renders children inside the
  viewport and ships a vertical `ScrollBar` + `Corner` by default) and **`ScrollBar`** (Radix
  `Scrollbar` + `Thumb`, `orientation` `vertical | horizontal`, thin `bg-border` thumb).
- One new runtime dependency on `@rogueoak/canopy`: **`@radix-ui/react-scroll-area`**, added to
  `packages/canopy/package.json` dependencies AND externalized in
  `packages/canopy/tsup.config.ts` `external: [...]` alongside the other Radix deps (run
  `pnpm install` at the repo root after).
- Styling via the 0005 recipe: full literal token classes, `cn()` merge (caller `className`
  wins), `forwardRef` + native prop spread on every part, semantic tokens only, no `dark:` on the
  common path, `React.ComponentRef` for ref typing.
- Storybook stories in `apps/storybook/src/ScrollArea.stories.tsx`: Playground, vertical list
  (long content), horizontal row, both scrollbars together, inside a bordered card / raised
  surface - light and dark.
- Tests: renders children into the viewport; children stay in the document (content reachable);
  vertical and horizontal `ScrollBar` render with the thumb; token thumb class present; `cn()`
  className merge (caller wins); `ref` forwarding to the root; native prop spread.
- Canopy `README.md` component list + `overview/features.md` (new capability) and
  `overview/architecture.md` (new `@radix-ui/react-scroll-area` primitive in the dependency
  footprint) updated on completion.

### Out
- **Auto-hide / custom reveal timing** and a `type` prop passthrough tuning (Radix `type`:
  `hover | scroll | auto | always`) beyond exposing the sensible default - deeper reveal
  configuration is a clean follow-up.
- **Scroll-to / imperative scroll APIs**, scroll-position events, and shadow/fade edge hints -
  deferred to a later spec.
- **Virtualization** of long lists - `ScrollArea` is a styled container only; windowing large
  datasets stays with the caller / a future component.
- Changing unrelated components - `ScrollArea` is additive; `Combobox` (0030), `SideNav`,
  `Dialog` (0028) are not rewired to use it in this spec (adopting it inside them is a separate
  follow-up).
- Introducing a second primitive library - v1 stays on the Radix stack that matches every
  existing canopy component.

## Approach

**Primitive stack: Radix ScrollArea (the shadcn scroll container).** Canopy is built entirely on
Radix primitives with the 0005 recipe; the scroll area follows suit. `@radix-ui/react-scroll-area`
provides the cross-browser mechanics - a `Root`, a focusable `Viewport` that owns overflow and
native keyboard/wheel/touch scrolling, a `Scrollbar` + `Thumb` for the custom bar, and a `Corner`
where the two bars meet - while suppressing the native OS scrollbar so only the themed bar shows.
It is added as a runtime **dependency** of `@rogueoak/canopy` and externalized in tsup exactly
like the other Radix deps, per the canopy externalization rule. Because Radix portals nothing here
(the viewport is inline) and light/dark is a token-layer property, the bar themes correctly with
no per-instance theme wiring.

**Part surface (mirrors the shadcn scroll-area, canopy-styled).** A small two-part family:
- `ScrollArea` - the root. Renders `ScrollAreaPrimitive.Root` with a base `relative overflow-hidden`
  and the caller's sizing via `className`, wraps `children` in `ScrollAreaPrimitive.Viewport`
  (base `h-full w-full rounded-[inherit]`), and by default renders a vertical `ScrollBar` and the
  `ScrollAreaPrimitive.Corner`. Forwards `ref` to the root and spreads native props.
- `ScrollBar` - `ScrollAreaPrimitive.Scrollbar` + `ScrollAreaPrimitive.Thumb`, taking an
  `orientation` prop (default `vertical`). Vertical: a thin vertical track (`h-full w-2.5`) with
  a `flex-1 rounded-full bg-border` thumb; horizontal: a thin horizontal track (`h-2.5 flex-col`)
  with the same `bg-border` thumb. Both use `touch-none select-none` and a small padding so the
  thumb sits as a slim rounded bar flush to the edge. Forwards `ref`, spreads native props.

**Styling & recipe.** FULL LITERAL token utility strings (so Tailwind v4's scanner emits each -
no dynamic class names), `cn()` merge on every part with caller `className` winning, `forwardRef`
with a native prop spread, `React.ComponentRef` for ref types, and no `dark:` on the common path.
The only color token in play is `bg-border` for the thumb, which reads correctly in both themes
through the token layer; the track stays transparent so the bar reads as part of the surface it
sits on (base or raised).

**Accessibility.** Radix keeps the viewport natively scrollable and focusable, preserving keyboard
scrolling; the `Scrollbar`/`Thumb`/`Corner` are presentational so assistive tech reads the content
rather than the bar. No ARIA roles are invented. Per the repo learning that a11y is guarded by
observable outcomes, the tests assert the content renders inside the viewport and remains in the
document (reachable), not that a scaffolding class exists.

**Motion.** None beyond Radix's built-in hover/scroll reveal of the bar; no custom keyframes are
added, so there is nothing to gate behind `motion-reduce`.

**Trade-offs.**
- *New dep (`@radix-ui/react-scroll-area`)*: one more runtime dependency on canopy, but it is the
  exact missing primitive - small, widely used, and consistent with the Radix family already in
  the tree; vendoring cross-browser scroll mechanics would be far more code to own. Flagged for
  the security / architecture personas to weigh the new-dependency surface in review.
- *Default vertical bar baked into the root vs fully manual composition*: `ScrollArea` renders a
  vertical `ScrollBar` + `Corner` by default so the common case is one line, while `ScrollBar`
  stays exported for horizontal / both-axis composition. Slightly less explicit, but matches the
  shadcn ergonomics callers expect.
- *Container only (no virtualization / imperative scroll)*: keeps v1 small and dependency-light;
  large-dataset windowing and scroll-position APIs are deferred so the component stays a pure
  styled container.

## Acceptance

- [ ] `ScrollArea` and `ScrollBar` (and their prop types) ship from `@rogueoak/canopy` (exported
      via `branches/index.ts`), built on `@radix-ui/react-scroll-area` (added to
      `packages/canopy/package.json` dependencies AND externalized in
      `packages/canopy/tsup.config.ts`); no `dark:` on the common path.
- [ ] `ScrollArea` wraps children in a scrollable viewport and renders a vertical `ScrollBar` +
      `Corner` by default; the caller sets height/max-height via `className` and content overflows
      into the themed scroll region.
- [ ] `ScrollBar` supports `orientation` `vertical` (default) and `horizontal`, each with a thin
      `rounded-full bg-border` thumb; the native OS scrollbar is suppressed so only the themed bar
      shows, and it reads correctly in light and dark.
- [ ] Recipe obeyed: full literal token classes, `cn()` merge with caller `className` winning,
      `forwardRef` + native prop spread on every part, `React.ComponentRef` ref typing, semantic
      tokens only.
- [ ] a11y: the viewport stays natively scrollable and focusable (keyboard scrolling preserved),
      the scrollbar parts are presentational, and content remains reachable; no invented roles.
- [ ] Storybook catalog entry with vertical-list, horizontal-row, both-scrollbars, and
      inside-a-bordered-card stories in light and dark; `pnpm storybook` build is green.
- [ ] Tests cover: children render into the viewport and stay in the document; vertical and
      horizontal `ScrollBar` render with the thumb; token thumb class present; `cn()` className
      merge (caller wins); `ref` forwarding; native prop spread.
- [ ] `pnpm install`, `pnpm build`, `pnpm test`, and `pnpm lint` all pass from the repo root.
- [ ] Canopy `README.md` component list includes ScrollArea; `overview/features.md` (new
      capability) and `overview/architecture.md` (new `@radix-ui/react-scroll-area` primitive in
      the canopy dependency footprint) updated on completion; `0050` ticked.
