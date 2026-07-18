# 0063 - resizable

## Problem

Canopy owns dialogs (0028), navigation shells (`TopNav` / `SideNav`), and the
`ResponsiveDialog` (0033) Branch, but it has **no resizable split layout**: a way to give the
user a draggable divider between two or more panes so they can size a sidebar, an editor/preview
split, or a master/detail view themselves. Today a consumer building an app shell around canopy's
`SideNav` who wants that nav (or an inspector panel) to be user-resizable has to hand-roll pointer
tracking, min/max clamping, persisted sizes, and - the part almost everyone gets wrong - the
`separator` ARIA role with keyboard resize. That is exactly the kind of interaction-heavy layout
primitive the design system should own once.

shadcn/ui ships a `Resizable` on top of `react-resizable-panels`; canopy has no equivalent and no
Radix primitive covers panel resizing. This component fills that gap. It is for any app-shell or
workspace surface with a divided layout - a resizable `SideNav` rail, an editor/preview split, a
list/detail pane, a settings two-column - and it composes naturally with the existing Branch
navigation and dialog components (0028, 0033, `SideNav`, `TopNav`).

## Outcome

- A new canopy component family, `Resizable`, exported from `@rogueoak/canopy/branches`, that
  renders a group of panels separated by draggable handles, built on `react-resizable-panels`.
- **Parts exported**: `ResizablePanelGroup` (the container, `direction="horizontal"` or
  `"vertical"`), `ResizablePanel` (a single pane, taking `defaultSize` / `minSize` / `maxSize` /
  `collapsible` from the underlying primitive), and `ResizableHandle` (the draggable divider,
  with an optional visible **grip** via a `withHandle` prop).
- **States**: idle, hover, dragging, and keyboard-focused. The handle shows a focus ring on
  keyboard focus and resizes with the arrow keys (the primitive's built-in keyboard support);
  dragging updates the adjacent panel sizes live.
- **a11y**: each handle exposes the `separator` role with `aria-orientation` and
  `aria-valuenow`/`aria-valuemin`/`aria-valuemax` provided by `react-resizable-panels`, plus an
  overridable `aria-label`; keyboard resize works without a pointer.
- **Theming**: styled with the 0005 recipe (full literal semantic-token Tailwind utilities,
  `cn()` merge, `forwardRef` + native prop spread), so it themes light/dark through the token
  layer with **no `dark:` on the common path**. The handle uses `border-border` for its divider
  line and the standard focus-ring tokens; the optional grip uses `bg-border` / `border-border`.
- **Storybook**: a catalog entry with horizontal, vertical, nested, with-handle-grip,
  collapsible, and min/max stories, rendering correctly in both themes.
- **Docs**: canopy `README.md` component list, `overview/features.md`, and
  `overview/architecture.md` (recording the new `react-resizable-panels` dependency) updated on
  completion.

## Scope

### In

- `packages/canopy/src/branches/Resizable.tsx` (+ `Resizable.test.tsx`) - the component family
  and its parts, exported from `packages/canopy/src/branches/index.ts`.
- Parts: `ResizablePanelGroup`, `ResizablePanel`, `ResizableHandle` (with a `withHandle` prop for
  the optional visible grip), each a thin canopy-styled `forwardRef` wrapper over the matching
  `react-resizable-panels` primitive (`PanelGroup`, `Panel`, `PanelResizeHandle`), passing native
  props through.
- One new runtime dependency on `@rogueoak/canopy`: **`react-resizable-panels`** - added to
  `packages/canopy/package.json` `dependencies` AND externalized in `packages/canopy/tsup.config.ts`
  `external: [...]` (matching the existing Radix/`cmdk` externalization rule), with `pnpm install`
  re-run at the repo root.
- Handle styling with **border tokens** (`border-border` divider, focus-ring tokens on
  keyboard focus, `bg-border`/`border-border` grip); `data-[panel-group-direction=vertical]:`
  variants to flip the handle between horizontal and vertical layouts using literal utility
  strings only.
- Stories: `Horizontal`, `Vertical`, `WithHandle` (visible grip), `Nested` (a group inside a
  panel), `Collapsible`, and `MinMax` (clamped sizes) - light and dark via the toolbar.
- Tests: renders the group with panels and handle(s); handle exposes `role="separator"` with
  orientation; keyboard focus shows the focus ring / handle is focusable; arrow-key resize
  changes the reported panel size; `withHandle` renders the grip; `direction="vertical"` sets the
  vertical orientation; `className` merge (caller wins) and `ref` forwarding on each part.
- Canopy `README.md` component list + `overview/features.md` (new capability) and
  `overview/architecture.md` (new `react-resizable-panels` dependency in the canopy footprint)
  updated on completion.

### Out

- **Persisted panel sizes** (autosave to `localStorage` via the primitive's `autoSaveId`) - the
  prop is passed through but a canopy-owned persistence wrapper / story is a clean follow-up.
- **Imperative resize API** (exposing the primitive's `ImperativePanelHandle` /
  `ImperativePanelGroupHandle` refs for programmatic collapse/expand) - deferred; v1 covers the
  declarative pointer + keyboard path.
- **Conditional / animated panels** (add/remove panes at runtime with transitions) - static panel
  sets for v1.
- Changing any existing component - `Resizable` is additive; `SideNav`, `TopNav`, `Dialog`,
  and `ResponsiveDialog` are untouched.
- Introducing a second primitive family - v1 adds only `react-resizable-panels`, which is the
  missing primitive; nothing else changes in the primitive stack.

## Approach

**Primitive stack: `react-resizable-panels` + the 0005 canopy recipe.** No Radix primitive
covers panel resizing, so this Branch adds `react-resizable-panels` - the same primitive shadcn's
`Resizable` uses. It owns the hard parts (pointer tracking, min/max clamping, `separator` ARIA
role, keyboard resize, collapsible panels, optional autosave), and canopy wraps its three parts in
thin `forwardRef` components styled with full literal semantic-token utilities. This is a Branch
(not a Seed or Twig) because it owns interaction state - live drag/keyboard resizing of adjacent
panes - matching the layer decision in the playbook.

**Part surface (mirrors the shadcn resizable, canopy-styled).**
- `ResizablePanelGroup` - wraps `PanelGroup`; takes `direction` (`"horizontal"` | `"vertical"`)
  and forwards `autoSaveId` / `onLayout` and other native props. Styled `flex h-full w-full`
  with a `data-[panel-group-direction=vertical]:flex-col` literal variant.
- `ResizablePanel` - a direct re-export/alias of the primitive's `Panel` (no styling of its own;
  it is a sizing container), so `defaultSize` / `minSize` / `maxSize` / `collapsible` /
  `collapsedSize` pass straight through.
- `ResizableHandle` - wraps `PanelResizeHandle`; the styled divider. A `withHandle` boolean prop
  renders an optional centered grip (a small rounded box with a drag-dots glyph) inside the
  handle. Styled with border tokens: a `border-border` divider line, the standard focus-ring
  tokens (`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
  focus-visible:ring-offset-2 focus-visible:ring-offset-ring-offset`) on keyboard focus, and
  `data-[panel-group-direction=vertical]:` variants (all literal strings) to flip its width/height
  and grip rotation between the two directions. The grip uses `bg-border` / `border-border`.

**Styling & recipe.** FULL LITERAL token utility strings (so Tailwind v4's scanner emits each),
`cn()` merge with caller `className` winning, `forwardRef` on every part with a native prop
spread, `React.ComponentRef` for ref types, **no `dark:` on the common path** - identical to
0005/0030. Only semantic tokens (`border-border`, `bg-border`, the focus-ring set) are used; no
palette values, no `dark:`.

**Accessibility.** `react-resizable-panels` supplies the `separator` role, `aria-orientation`,
and `aria-valuenow`/`min`/`max` on the handle plus built-in arrow-key resizing; canopy adds an
overridable `aria-label` and the visible focus ring so keyboard users can see the focused handle.
Per the repo learning that a11y is guarded by observable outcomes, tests assert the `separator`
role and orientation are present, the handle is keyboard-focusable, and an arrow-key press changes
the reported panel size - not that a class exists.

**Motion.** None beyond the primitive's live size updates during drag; there are no canopy
keyframes to add, so there is no reduced-motion concern on the common path.

**Trade-offs.**
- *New dependency (`react-resizable-panels`)*: one more runtime dep on canopy, but it is the
  missing primitive, is small, widely used, and matches shadcn; hand-rolling pointer + keyboard
  resize with correct `separator` semantics would be far more code to own and get wrong. Flag the
  new-dependency surface for the **security and architecture** review personas.
- *Non-Radix primitive*: this is the first canopy component not built on Radix. Accepted because
  Radix ships no panel-resize primitive; the recipe (tokens, `cn()`, `forwardRef`, externalized
  dep) is otherwise unchanged, so it still looks native to the codebase.
- *Declarative-only v1*: imperative collapse/expand and persisted sizes are deferred to keep the
  first surface small; `autoSaveId` still passes through for callers who want raw persistence.

## Acceptance

- [ ] `ResizablePanelGroup`, `ResizablePanel`, and `ResizableHandle` ship from
      `@rogueoak/canopy/branches` (exported via `branches/index.ts`, with their `*Props` types),
      built on `react-resizable-panels`.
- [ ] `react-resizable-panels` is added to `packages/canopy/package.json` `dependencies` AND
      externalized in `packages/canopy/tsup.config.ts` `external`; `pnpm install` re-run at the
      repo root; the built package does not bundle it.
- [ ] 0005 recipe obeyed: full literal semantic-token utility strings, `cn()` merge (caller
      `className` wins), `forwardRef` + native prop spread on each part, `React.ComponentRef` ref
      types, semantic tokens only, **no `dark:` on the common path**.
- [ ] The handle is styled with border tokens (`border-border` divider, `bg-border`/`border-border`
      grip) and the standard focus-ring tokens; `direction="vertical"` flips the group and handle
      via literal `data-[panel-group-direction=vertical]:` variants.
- [ ] a11y: each handle exposes `role="separator"` with the correct `aria-orientation` and the
      primitive's `aria-valuenow`/`min`/`max`; an overridable `aria-label` is supported.
- [ ] Keyboard: the handle is focusable, shows the focus ring, and arrow-key presses resize the
      adjacent panels (reported size changes).
- [ ] `withHandle` renders the optional visible grip; `collapsible` and `minSize`/`maxSize` pass
      through to the underlying `Panel` and clamp/collapse as expected.
- [ ] Storybook catalog entry with `Horizontal`, `Vertical`, `WithHandle`, `Nested`,
      `Collapsible`, and `MinMax` stories rendering in both themes; the Storybook build is green.
- [ ] Tests cover: group + panels + handle render; `separator` role and orientation present;
      handle keyboard-focusable; arrow-key resize changes reported size; `withHandle` grip
      renders; vertical orientation; `className` merge and `ref` forwarding on each part.
- [ ] `pnpm install && pnpm build && pnpm test && pnpm lint` all green from the root; Storybook
      renders light and dark.
- [ ] Canopy `README.md` component list includes Resizable; `overview/features.md` (new
      capability) and `overview/architecture.md` (new `react-resizable-panels` dependency in the
      canopy footprint, first non-Radix primitive) updated on completion.
