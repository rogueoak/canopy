# 0068 - Sheet

## Problem

Canopy has a **Dialog** (0024) - a centred modal built on `@radix-ui/react-dialog` - but no
**edge-anchored side panel**. A large class of surfaces are not centred modals: settings drawers,
filter panels, detail flyouts, mobile nav sheets, "quick view" panels. These slide in from a
viewport edge (right/left/top/bottom), keep the underlying page as spatial context, and are the
canonical shadcn `Sheet` pattern. Today a consumer who wants that has two bad options: hand-roll a
positioned panel against a raw portal (re-implementing focus trap, scroll lock, return-focus, and
`Esc`-to-close), or stretch `DialogContent` with `className` overrides that fight its centred
`left-1/2 top-1/2 -translate-*` positioning. Dialog itself put drawer/sheet **out of scope** (see
its source doc comment: "drawer/sheet ... are later specs"), so the gap is intentional and this
spec fills it.

Sheet is the sibling to Dialog (0024) and its responsive cousin ResponsiveDialog (0025): same
Radix Dialog state machine and ARIA contract, same raised-surface token styling, but anchored to an
edge with slide-in motion instead of centred with a zoom. It is a Branch (owns interaction state
and a portal), and reuses the primitive canopy already ships - **no new runtime dependency**.

## Outcome

- A new canopy Branch family, `Sheet`, exported from `@rogueoak/canopy` (via `branches/index.ts`),
  built on the existing `@radix-ui/react-dialog` dependency - **no new dep**.
- Parts mirroring the shadcn Sheet surface and the Dialog family naming: `Sheet` (stateful root,
  `open` / `onOpenChange`, controlled or uncontrolled via `defaultOpen`), `SheetTrigger`,
  `SheetClose`, `SheetContent`, `SheetOverlay`, `SheetHeader`, `SheetFooter`, `SheetTitle`,
  `SheetDescription`.
- `SheetContent` takes a `side` prop (`"top" | "right" | "bottom" | "left"`, default `"right"`)
  that anchors the panel to that viewport edge, sizes it to span the edge (`left`/`right` -> full
  height, capped width; `top`/`bottom` -> full width, auto/capped height), and applies the matching
  **slide-in / slide-out** motion for that edge.
- **A11y**: Radix supplies `role="dialog"`, focus trap, return-focus, scroll lock, `Esc`-to-close,
  and the `aria-labelledby` / `aria-describedby` wiring via `SheetTitle` / `SheetDescription`;
  `SheetContent` sets `aria-modal="true"` explicitly (same rationale as Dialog) and carries a
  built-in labelled `X` `SheetClose` affordance.
- **Theming**: styled with the 0005 recipe (full literal semantic-token Tailwind utilities, `cn()`
  merge with caller-wins, `forwardRef` + native prop spread, `React.ComponentRef`), so it themes
  light/dark through the token layer with **no `dark:` on the common path**; the portalled overlay +
  content theme correctly because `.dark` lives on `<html>`.
- **Motion**: slide-in/out gated with `motion-reduce:animate-none` (instant show/hide for
  reduced-motion users), reusing the pre-provisioned `animate-drawer-in/out` and
  `animate-bottom-sheet-in/out` keyframes from the Roots preset - no new keyframe.
- **Refactor**: Dialog (0024) consumers in this repo that are really side panels (identified in
  Scope) switch to Sheet, preserving their public API and behaviour.
- **Docs**: a Storybook catalog entry (Playground + all four sides + header/footer/title/description
  + controlled + reduced-motion, light and dark); canopy README component list and the `overview/`
  living docs updated on completion.

## Scope

### In

- `packages/canopy/src/branches/Sheet.tsx` (+ `packages/canopy/src/branches/Sheet.test.tsx`) - the
  component family and its parts.
- Barrel export of every part and its `*Props` type from
  `packages/canopy/src/branches/index.ts` (Branches are re-exported from the package root and the
  `@rogueoak/canopy/branches` entry).
- `SheetContent` `side` prop (`top` / `right` / `bottom` / `left`, default `right`) mapping to full
  literal per-side positioning + sizing + slide motion classes (no dynamic class construction; each
  side is a complete literal string so Tailwind v4's scanner emits it).
- `SheetOverlay` exported (unlike Dialog's internal overlay) so callers can restyle the scrim, while
  `SheetContent` still bakes in a default overlay so the common path stays one part.
- `SheetHeader` / `SheetFooter` / `SheetTitle` (`text-h3`, `aria-labelledby`) / `SheetDescription`
  (`text-text-muted text-body-sm`, `aria-describedby`) layout + accessible-name parts, matching the
  Dialog equivalents.
- Story in `apps/storybook/src/Sheet.stories.tsx`, imported from `@rogueoak/canopy/branches`.
- **No new dependency** and **no tsup external change** - reuses `@radix-ui/react-dialog`, already a
  canopy dependency and already externalized in `packages/canopy/tsup.config.ts`.
- **Refactor**: audit Dialog (0024) usages under `apps/` and `packages/` for centred modals that are
  really edge side panels; migrate those to Sheet with the **same public props/behaviour** (only the
  visual anchor + motion change). If the audit finds none, record that explicitly and the refactor
  is a no-op.
- Stories: Playground (right side), one story per `side` (top / right / bottom / left),
  header+footer+title+description, controlled `open`, and reduced-motion - all in light and dark.
- Tests: opens on trigger click; renders `role="dialog"` with `aria-modal="true"`; `SheetTitle` /
  `SheetDescription` wire `aria-labelledby` / `aria-describedby`; the built-in close button is
  labelled `Close` and closes; `Esc` closes; each `side` renders its literal anchor/motion classes;
  controlled (`open` / `onOpenChange`) and uncontrolled (`defaultOpen`) both work; `className` merge
  is caller-wins; `ref` forwards on the styled parts.
- Updates on completion: canopy `README.md` component list, `overview/features.md` (new capability),
  `overview/architecture.md` (Sheet as a Branch on the existing `@radix-ui/react-dialog` primitive -
  note explicitly that it adds **no** new dependency), and `overview/learnings.md` if the refactor
  surfaces a reusable insight.

### Out

- **Resizable / draggable panels** and swipe-to-dismiss gestures - v1 is a fixed-size, click/`Esc`-
  dismissed panel; gesture support is a clean follow-up.
- **Nested / stacked sheets** (a sheet opening another sheet) - not designed for v1; single sheet at
  a time.
- **`alertdialog` (non-dismissible) semantics** - Sheet is the dismissible modal panel;
  role="alertdialog" is a separate later spec, same as Dialog left it.
- Changing **Dialog (0024)** or **ResponsiveDialog (0025)** public APIs - Sheet is additive; the
  only Dialog-adjacent change is migrating consumers that were side panels (their APIs unchanged).
- Adding a **new keyframe / motion token** - v1 reuses the existing `animate-drawer-*` /
  `animate-bottom-sheet-*` utilities from the Roots preset; if a side needs a keyframe not yet
  shipped, add it to the Roots preset (not inline) as a small preceding step, not new API surface.

## Approach

**Primitive stack: `@radix-ui/react-dialog` (no new dep).** Sheet is the same modal state machine as
Dialog (0024): `DialogPrimitive.Root` for open/close, `.Trigger` / `.Close`, `.Portal`, `.Overlay`,
`.Content`, `.Title`, `.Description` - Radix owns the focus trap, return-focus, scroll lock,
`Esc`-to-close, and the `role="dialog"` / `aria-labelledby` / `aria-describedby` contract. The
difference from Dialog is purely positioning + motion, so Sheet reuses the primitive already in
`package.json` and already externalized in tsup - **no dependency, tsup, or `pnpm install` change**,
which is the whole point of building on Radix Dialog rather than a drawer library.

**Part surface (mirrors Dialog, edge-anchored).**
- `Sheet` = `DialogPrimitive.Root`; `SheetTrigger` = `.Trigger`; `SheetClose` = `.Close` (all
  `asChild`-capable, so a trigger/close can wrap a Button Seed) - identical aliasing to Dialog.
- `SheetOverlay` - `forwardRef` over `DialogPrimitive.Overlay` with the shared scrim
  `fixed inset-0 z-50 bg-overlay/80` + fade (`data-[state=open]:animate-dialog-overlay-in` /
  `...-out`, `motion-reduce:animate-none`). Exported so the scrim can be restyled.
- `SheetContent` - `forwardRef` over `DialogPrimitive.Content`, rendered through
  `DialogPrimitive.Portal` over a baked-in `SheetOverlay`. A `side` prop selects one of four
  **full-literal** class strings via a small `switch`/record (never string interpolation), each
  combining: the edge anchor (`fixed inset-y-0 right-0` etc.), the span/size (`h-full w-full
  max-w-sm` for left/right; `inset-x-0 top-0` / `bottom-0` with an `auto` height for top/bottom),
  the shared raised-surface tokens (`bg-surface-raised border border-border text-text shadow-lg
  p-6`), and the per-side slide motion (`data-[state=open]:animate-drawer-in` +
  `data-[state=closed]:animate-drawer-out` for right/left; `animate-bottom-sheet-in/out` for
  bottom, and the same pair for top, all `motion-reduce:animate-none`). Sets `aria-modal="true"`
  explicitly (Radix marks modality via `aria-hidden` on siblings rather than emitting `aria-modal`,
  so we assert the APG attribute - same decision as Dialog). Bakes in the labelled `X` `SheetClose`
  (inline `currentColor` SVG, `aria-hidden`, `aria-label="Close"`, `muted-raised` hover, shared
  focus-visible ring with `ring-offset-surface-raised`), matching Dialog's affordance.
- `SheetHeader` / `SheetFooter` - plain `forwardRef` `div` layout slots (stacked header with `pr-6`
  to clear the close `X`; footer stacks reversed on mobile, right-aligned row on `sm+`), reusing the
  Dialog layout classes.
- `SheetTitle` / `SheetDescription` - `forwardRef` over `DialogPrimitive.Title` / `.Description`
  (`text-h3`; `text-text-muted text-body-sm`) so Radix wires the accessible name/description.

**Styling & recipe (0005).** Full literal token-utility strings so Tailwind v4's scanner emits every
class; `cn()` merge so caller `className` wins; `forwardRef` + native prop spread on every styled
part; `React.ComponentRef` for ref types (not deprecated `ElementRef`); **semantic tokens only, no
`dark:` on the common path** (light/dark flips through the token layer, and the portalled parts
inherit `.dark` from `<html>`). The `side` map is a fixed record of literal strings, not
constructed - the key constraint the recipe requires.

**Accessibility.** Radix delivers the dialog role, modality, focus trap, return-focus, scroll lock,
and `Esc`-to-close; `SheetTitle` / `SheetDescription` supply `aria-labelledby` / `aria-describedby`;
the close button is a real labelled `button`. Guard these with **observable** tests (role present,
`aria-modal` set, title/description wired, close labelled + closes, `Esc` closes), per the repo
learning that a11y is verified by outcomes, not scaffolding.

**Motion.** Slide-in/out per edge via the pre-provisioned `animate-drawer-*` (horizontal) and
`animate-bottom-sheet-*` (vertical) utilities from the Roots preset, each gated with
`motion-reduce:animate-none` for an instant show/hide - no inline keyframes, no new motion token.

**Refactor (Dialog side panels -> Sheet).** Grep Dialog (0024) consumers across `apps/` and
`packages/` for centred modals whose content is really an edge panel (wide side content,
`className` overrides fighting the centred translate, filter/settings/detail flyouts). Migrate each
to Sheet by swapping the `Dialog*` parts for the matching `Sheet*` parts and choosing a `side`,
leaving every public prop and behaviour of the *consuming* component unchanged - only the internal
anchor + motion differ. If the audit finds no true side-panel consumers, state that in the PR and
ship Sheet as purely additive.

**Trade-offs.**
- *Radix Dialog vs a dedicated drawer library (e.g. vaul)*: staying on `@radix-ui/react-dialog`
  keeps one primitive family, matches Dialog/ResponsiveDialog exactly, and adds **zero** dependency
  surface; the cost is no native swipe/drag gesture (deferred, Out). Accepted - consistency and no
  new dep outweigh gestures for v1. No security/architecture new-dependency review needed precisely
  because there is no new dependency.
- *`side` as one prop vs four components*: a single `side` prop mirrors the shadcn Sheet and keeps
  the family small; the cost is a four-branch literal class map, which the recipe requires anyway.
- *Exporting `SheetOverlay` (Dialog does not)*: side panels more often want a custom/absent scrim
  (e.g. non-modal nav on desktop), so the overlay is public here while `SheetContent` still bakes in
  a default - the common path stays one part.

## Acceptance

- [ ] `Sheet`, `SheetTrigger`, `SheetClose`, `SheetContent`, `SheetOverlay`, `SheetHeader`,
      `SheetFooter`, `SheetTitle`, `SheetDescription` and their `*Props` types are exported from
      `@rogueoak/canopy` via `packages/canopy/src/branches/index.ts`, built on the existing
      `@radix-ui/react-dialog` - **no new dependency, no tsup external change**.
- [ ] Styled with the 0005 recipe: full literal semantic-token classes, `cn()` caller-wins merge,
      `forwardRef` + native prop spread, `React.ComponentRef` refs, and **no `dark:` on the common
      path**; portalled overlay + content theme correctly in light **and** dark.
- [ ] `SheetContent` `side` (`top` / `right` / `bottom` / `left`, default `right`) anchors to the
      correct edge with the correct size span and per-side slide-in/out motion, each as a full
      literal class string (no dynamic class construction).
- [ ] Radix a11y contract holds: `role="dialog"` with explicit `aria-modal="true"`; `SheetTitle` /
      `SheetDescription` wire `aria-labelledby` / `aria-describedby`; focus trap, return-focus,
      scroll lock, and `Esc`-to-close work; the built-in close button is a labelled `button`
      (`aria-label="Close"`) that closes the sheet.
- [ ] Motion is gated with `motion-reduce:animate-none` (instant show/hide for reduced-motion),
      reusing the Roots-preset `animate-drawer-*` / `animate-bottom-sheet-*` utilities - no new
      keyframe.
- [ ] Controlled (`open` / `onOpenChange`) and uncontrolled (`defaultOpen`) both work; `className`
      merge is caller-wins; `ref` forwards on the styled parts.
- [ ] Storybook entry `apps/storybook/src/Sheet.stories.tsx` covers Playground + all four sides +
      header/footer/title/description + controlled + reduced-motion, in light and dark; the
      storybook build is green.
- [ ] Tests (`Sheet.test.tsx`) cover: opens on trigger; `role="dialog"` + `aria-modal`; title/
      description wiring; labelled close + closes; `Esc` closes; each `side` renders its literal
      anchor/motion classes; controlled + uncontrolled; caller-wins `className`; ref forwarding -
      all pass.
- [ ] Dialog (0024) consumers that are really side panels are migrated to Sheet with their public
      APIs unchanged; the existing Dialog / ResponsiveDialog public APIs are unchanged (verified in
      the audit). If no such consumers exist, that is stated and Sheet ships as additive.
- [ ] `pnpm install` (no-op for deps), `pnpm build`, `pnpm test`, `pnpm lint` all pass from the
      repo root.
- [ ] Canopy `README.md` component list includes Sheet; `overview/features.md` (new capability) and
      `overview/architecture.md` (Sheet as a Branch on the existing `@radix-ui/react-dialog`
      primitive, **adding no new dependency**) updated on completion.
