# 0067 - Drawer

## Problem

Canopy owns modal surfaces at the centre and edges of the screen - the centred `Dialog` (0031)
and its responsive bottom-sheet form (`ResponsiveDialog`, 0031), plus the mobile off-canvas rail
inside `SideNav` (0026). But it has **no first-class Drawer**: a panel that anchors to an edge of
the viewport (bottom / top / left / right), slides in, and can be **dragged to dismiss** with a
finger. Today that experience is hand-built twice in the system - `SideNav` reaches straight into
`@radix-ui/react-dialog` to style a left off-canvas panel, and `ResponsiveDialog` styles a
bottom-anchored sheet on the same primitive - each re-deriving the anchor CSS, the scrim, the
grab-handle affordance, and the enter/exit motion, and neither offers the native **swipe-to-close**
gesture users expect from a phone sheet. shadcn closed exactly this gap by adopting **`vaul`**
(the drawer/sheet primitive with drag physics, velocity-based dismiss, and background-scaling)
rather than bending Radix Dialog into a drawer; canopy has the same gap and should close it the
same way.

This is for any surface that should enter from an edge and be dismissable by drag: mobile
navigation, filter/detail sheets, action sheets, cart/notification panels, and the two existing
consumers above. A shared Drawer lets those compose one owned, themed, gesture-aware primitive
instead of re-styling a modal per feature.

## Outcome

- A new canopy Branch family, `Drawer`, exported from `@rogueoak/canopy/branches`, built on
  **`vaul`**. Parts mirror the shadcn drawer so callers compose like the other portalled Branches:
  `Drawer`, `DrawerTrigger`, `DrawerContent`, `DrawerHeader`, `DrawerFooter`, `DrawerTitle`,
  `DrawerDescription`, `DrawerClose`, `DrawerOverlay`.
- **Direction**: a `direction` prop (`bottom` (default) / `top` / `left` / `right`) on the root
  anchors the panel to that edge; `DrawerContent` styles the matching full-bleed edge, rounded
  corners on the exposed side(s), and a grab-handle affordance on the drag axis. The drag-to-dismiss
  gesture and its velocity/threshold physics come from `vaul`.
- **States & behaviour**: open/close is controlled or uncontrolled (`open` / `defaultOpen` /
  `onOpenChange`, forwarded to vaul's root); modal focus trap, scroll lock, `Esc`, outside-click
  dismiss, and **drag-to-dismiss** all work; motion is gated with `motion-reduce:animate-none` so
  reduced-motion users get an instant, non-animated open/close.
- **A11y**: `DrawerContent` is a `role="dialog"` with `aria-modal`; `DrawerTitle` /
  `DrawerDescription` wire the accessible name/description (`aria-labelledby` / `aria-describedby`),
  and `DrawerClose` is a real labelled `button`. vaul supplies the trap, return-focus, and dismiss
  semantics; canopy guards them with observable tests.
- **Theming**: styled with the 0005 recipe (full literal semantic-token utilities, `cn()` merge,
  `forwardRef` + native prop spread), so it themes light/dark through the token layer with **no
  `dark:` on the common path**; the portalled panel/scrim theme correctly (`.dark` on `<html>`),
  reusing the existing `bg-overlay/80` scrim and the `animate-drawer-*` / `animate-bottom-sheet-*`
  motion tokens from the Roots preset.
- **Refactor (public APIs unchanged)**: `SideNav` (0026) consumes Drawer for its mobile off-canvas
  rail and `ResponsiveDialog` (0031) consumes Drawer for its mobile bottom sheet, both keeping their
  exact public component/prop surfaces and their current motion behaviour.
- **Docs**: a Storybook catalog entry with per-direction, header/footer, controlled, and
  reduced-motion stories; canopy `README.md` component list and the `overview/` living docs
  updated on completion.

## Scope

### In
- `packages/canopy/src/branches/Drawer.tsx` (+ `packages/canopy/src/branches/Drawer.test.tsx`) -
  the Drawer family and its parts, exported from `packages/canopy/src/branches/index.ts` (values
  `Drawer`, `DrawerTrigger`, `DrawerContent`, `DrawerHeader`, `DrawerFooter`, `DrawerTitle`,
  `DrawerDescription`, `DrawerClose`, `DrawerOverlay`; and the matching `*Props` types).
- A new runtime dependency **`vaul`** on `@rogueoak/canopy`: added to
  `packages/canopy/package.json` `dependencies` AND externalized in
  `packages/canopy/tsup.config.ts` `external: [...]` (same rule as the Radix deps and `cmdk`), with
  `pnpm install` run at the repo root after.
- `direction` (`bottom` | `top` | `left` | `right`, default `bottom`) driving the anchored edge,
  corner rounding, and grab-handle axis via **full literal** per-direction token-utility strings
  (no dynamically composed class names).
- **Refactor `SideNav` (0026)**: replace its inline `@radix-ui/react-dialog` mobile drawer with the
  new `Drawer` (`direction="left"`), preserving the exported component/prop surface exactly
  (`SideNav`, `SideNavHeader`, `SideNavFooter`, `SideNavSection`, `SideNavItem`, `SideNavTrigger`,
  `SideNavCollapseToggle`, `useSideNavCollapsed`, and every prop), the single `<nav>` landmark, the
  external-trigger return-focus behaviour, and the left-slide motion.
- **Refactor `ResponsiveDialog` (0031)**: replace its inline bottom-sheet `DialogPrimitive.Content`
  with `Drawer` (`direction="bottom"`) on the mobile path, preserving the exported surface exactly
  (`ResponsiveDialog*` parts and props, the Dialog one-for-one mirror) and the desktop `DialogContent`
  path, the grab handle, the built-in close, and the bottom-sheet motion.
- Storybook stories in `apps/storybook/src/Drawer.stories.tsx`: Playground, each Direction
  (bottom / top / left / right), WithHeaderFooter, Controlled, LongContent (scrollable), and
  ReducedMotion - light and dark via the toolbar, no per-story theme code.
- Tests in `Drawer.test.tsx`: trigger opens the drawer; `role="dialog"` present and labelled by
  `DrawerTitle`; `DrawerClose`/`Esc`/overlay click closes; controlled AND uncontrolled open;
  each `direction` renders its anchored content; `className` merge (caller wins); `ref` forwarding
  on `DrawerContent`; `motion-reduce` gate present. Plus the existing `SideNav`/`ResponsiveDialog`
  test suites stay green after the refactor.
- `README.md` component list, `docs/overview/features.md` (new Drawer capability + the two
  refactors), and `docs/overview/architecture.md` (the new `vaul` runtime dependency and its place
  in the Branch layer) updated on completion.

### Out
- **Snap points / multi-detent sheets** (partial-open resting positions, `snapPoints`,
  programmatic snap) - vaul supports them; deferred to a follow-up so v1 is a single open/closed
  drawer.
- **Nested / stacked drawers** and **background-scaling** of the page behind the sheet - deferred;
  v1 is a single drawer over the shared `bg-overlay/80` scrim.
- **Non-modal drawers** (page stays interactive behind an open drawer) - v1 is modal only.
- Changing the **public API** of `SideNav` (0026) or `ResponsiveDialog` (0031) - the refactor is
  internal only; their exported components, props, and motion behaviour are unchanged.
- Touching any **other** component, or introducing a second drawer primitive - v1 is `vaul` only.

## Approach

**Primitive stack: `vaul` + the canopy 0005 recipe.** vaul is the drawer/sheet primitive (built on
Radix Dialog under the hood) that adds the drag physics canopy can't get from raw Radix Dialog:
pointer-drag tracking, velocity- and threshold-based dismiss, and the anchored `direction` API.
Adopting it - rather than continuing to bend `@radix-ui/react-dialog` into an edge panel by hand -
is exactly the shadcn move and removes the duplicated anchor/scrim/motion code in `SideNav` and
`ResponsiveDialog`. `vaul` is added as a runtime **dependency** of `@rogueoak/canopy` and
**externalized in tsup** (peers + deps external, only first-party source bundled), matching the
Radix/`cmdk` treatment.

**Part surface (mirrors the shadcn drawer, canopy-styled).**
- `Drawer` - the stateful root: `vaul` `Drawer.Root`, forwarding `open` / `defaultOpen` /
  `onOpenChange` / `direction` (default `bottom`) / `modal` and standard props. Owns open state and
  the drag gesture.
- `DrawerTrigger` / `DrawerClose` - the vaul `Trigger` / `Close`; `DrawerClose` also ships as the
  built-in top-corner icon close inside `DrawerContent`, a real labelled `button`.
- `DrawerOverlay` - the vaul `Overlay` styled as the shared `fixed inset-0 z-50 bg-overlay/80`
  scrim, fading via `data-[state]` with `motion-reduce:animate-none` (identical to the Dialog /
  SideNav / ResponsiveDialog scrim in use today).
- `DrawerContent` - the vaul `Content` (portalled) styled per `direction` with **full literal**
  utility strings: bottom -> `inset-x-0 bottom-0 rounded-t-lg`; top -> `inset-x-0 top-0
  rounded-b-lg`; left -> `inset-y-0 left-0 rounded-r-lg`; right -> `inset-y-0 right-0
  rounded-l-lg`; each on `bg-surface-raised` + `border-border` + `text-text` + `shadow-lg`, with a
  grab-handle affordance (`bg-muted-raised`, the raised-surface rule) on the drag axis and the
  `animate-drawer-*` (side) / `animate-bottom-sheet-*` (bottom) motion tokens, gated with
  `motion-reduce:animate-none`. A `cva` maps `direction` -> its literal class string (no
  `rounded-${dir}`), `cn()` merges the caller `className` (caller wins).
- `DrawerHeader` / `DrawerFooter` - layout slots (the header stacks title + description; the footer
  stacks on mobile, right-aligns on `sm+`), reusing the Dialog slot idiom.
- `DrawerTitle` / `DrawerDescription` - the vaul `Title` / `Description` on `text-h4 text-text` /
  `text-body-sm text-text-muted`, wiring the dialog's accessible name/description.

**Refactors (APIs preserved).** `SideNav`'s mobile branch swaps its inline `DialogPrimitive.*`
off-canvas panel for `Drawer direction="left"` - keeping the single `<nav aria-label>` landmark,
the `onOpenAutoFocus`/`onCloseAutoFocus` external-trigger return-focus dance (vaul exposes the same
Radix escape hatches), and the left-slide motion; the exported `SideNav*` surface and every prop are
untouched. `ResponsiveDialog`'s mobile branch swaps its inline bottom-sheet `DialogPrimitive.Content`
for `Drawer direction="bottom"` - keeping the desktop `DialogContent` delegation, the grab handle,
the built-in close, and the bottom-sheet motion; the `ResponsiveDialog*` mirror and props are
untouched. Both keep their `useIsMobile()` breakpoint switch so exactly one surface mounts. The
existing test suites for both components must stay green, proving the public contract held.

**Styling & recipe.** FULL LITERAL semantic-token utility strings (so Tailwind v4's scanner emits
each), `cn()` merge with caller-wins, `forwardRef` on every styled wrapper with a native prop spread,
`React.ComponentRef` for ref types (not the deprecated `React.ElementRef`), semantic tokens only, and
**no `dark:` on the common path** - light/dark flips through the token layer; the portalled panel and
scrim theme correctly because `.dark` lives on `<html>`. Reuse the existing scrim and
`animate-drawer-*` / `animate-bottom-sheet-*` motion tokens rather than adding keyframes.

**Accessibility.** vaul provides the `role="dialog"` + `aria-modal`, focus trap, return-focus,
scroll lock, `Esc`, and outside-click dismiss; canopy adds `DrawerTitle`/`DrawerDescription` for
the accessible name/description and a labelled `DrawerClose` button. Guard these with observable
tests (dialog role present and labelled, close/`Esc`/overlay-click dismiss, keyboard reachable),
per the repo learning that a11y is proven by outcomes, not scaffolding.

**Trade-offs / review flags.**
- *New dependency `vaul`*: a new runtime dep on canopy and a second modal primitive family alongside
  Radix Dialog (vaul wraps Radix Dialog, so the mental model stays close). Accepted because the
  drag-to-dismiss gesture is the whole point and re-implementing pointer/velocity physics on raw
  Radix would be far more code to own. **Security and architecture personas should weigh the
  new-dependency surface** (bundle size, maintenance, transitive deps) in review.
- *Refactoring two shipped Branches*: risk is regressing `SideNav`/`ResponsiveDialog`. Mitigated by
  keeping their public APIs byte-for-byte and leaning on their existing test suites as the contract
  guard; the refactor lands only if those stay green.
- *Deferring snap points / nesting*: keeps v1 a simple single drawer; the vaul API leaves a clean
  path to add them later without breaking the surface.

## Acceptance

- [ ] `Drawer`, `DrawerTrigger`, `DrawerContent`, `DrawerHeader`, `DrawerFooter`, `DrawerTitle`,
      `DrawerDescription`, `DrawerClose`, `DrawerOverlay` (and their `*Props` types) ship from
      `@rogueoak/canopy/branches` via `packages/canopy/src/branches/index.ts`.
- [ ] Built on **`vaul`**, added to `packages/canopy/package.json` `dependencies` AND externalized
      in `packages/canopy/tsup.config.ts` `external`; `pnpm install` run at the repo root.
- [ ] `direction` (`bottom` default / `top` / `left` / `right`) anchors the panel to the matching
      edge with the correct rounding and grab-handle axis, using **full literal** token classes (no
      dynamically composed class names); recipe obeyed - `cn()` merge (caller wins), `forwardRef` +
      native prop spread, `React.ComponentRef`, semantic tokens only, **no `dark:` on the common
      path**.
- [ ] Open/close works controlled AND uncontrolled (`open` / `defaultOpen` / `onOpenChange`); the
      trigger opens it; `DrawerClose`, `Esc`, and overlay click all close it; drag-to-dismiss works
      via vaul.
- [ ] A11y: `DrawerContent` exposes `role="dialog"` with `aria-modal`, is labelled by `DrawerTitle`
      (and described by `DrawerDescription` when present); `DrawerClose` is a real labelled `button`;
      focus is trapped and returned; keyboard reachable.
- [ ] Motion reuses the `animate-drawer-*` / `animate-bottom-sheet-*` tokens and the `bg-overlay/80`
      scrim, gated with `motion-reduce:animate-none`.
- [ ] **`SideNav` (0026) refactored** to consume `Drawer` for its mobile rail with its **public API
      unchanged** (all `SideNav*` exports and props, single `<nav>` landmark, external-trigger
      return-focus, left-slide motion preserved); its existing test suite stays green.
- [ ] **`ResponsiveDialog` (0031) refactored** to consume `Drawer` for its mobile bottom sheet with
      its **public API unchanged** (all `ResponsiveDialog*` exports and props, desktop `DialogContent`
      path, grab handle, built-in close, bottom-sheet motion preserved); its existing test suite
      stays green.
- [ ] Storybook catalog entry with Playground, each Direction, WithHeaderFooter, Controlled,
      LongContent, and ReducedMotion stories rendering in light and dark; the Storybook build is
      green.
- [ ] Tests listed in Scope pass: trigger opens; dialog role present + labelled; close/`Esc`/overlay
      dismiss; controlled + uncontrolled; each direction; `className` merge; `ref` forwarding;
      `motion-reduce` gate.
- [ ] `pnpm install` / `pnpm build` / `pnpm test` / `pnpm lint` all pass from the repo root.
- [ ] `README.md` component list includes Drawer; `docs/overview/features.md` (new Drawer capability +
      the two refactors) and `docs/overview/architecture.md` (new `vaul` runtime dependency in the
      Branch layer / canopy dependency footprint) updated on completion.
