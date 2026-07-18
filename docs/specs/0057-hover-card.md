# 0057 - HoverCard

## Problem

Canopy can show a **short text hint** on hover via `Tooltip` (0014), and a **click-triggered**
floating surface via `Popover` (the `@radix-ui/react-popover` primitive that already backs
`Combobox`, 0030). What it has no primitive for is the middle case: a **rich preview that opens on
hover/focus**, not on click - the pattern behind link previews, `@mention` user cards, repository
hover-cards, and "peek at this before you navigate" affordances. Tooltip is deliberately scoped to
small, non-interactive text (`role="tooltip"`, no focusable content inside), so it is the wrong
tool for a preview that contains an avatar, headings, stats, and links. Popover is the wrong tool
too: it commits the user to a click and traps focus, which is heavy for a passive preview.

Today a consumer who wants a hover preview has to hand-roll open/close timers, hover-intent
grace periods (so the card does not flicker when the pointer crosses the gap to it), focus support
for keyboard users, and a portalled, collision-aware, correctly-themed surface - re-deriving all
of it per feature. That is exactly the kind of interaction the design system should own once.

This is for any surface with dense entities worth previewing before commitment: user/profile
cards, link previews in prose, ticket or PR hover-cards, glossary term peeks. It belongs in canopy
as the Branch-layer counterpart to Tooltip (0014, short text) and the click-driven Popover: same
Radix + 0005-recipe family, one more missing primitive filled in.

## Outcome

- A new canopy component family, `HoverCard`, exported from `@rogueoak/canopy/branches`, that
  opens a **rich preview surface on hover and on keyboard focus** of its trigger, and closes when
  both the trigger and the card are left.
- **Parts**: `HoverCard` (the stateful root), `HoverCardTrigger` (the hovered/focused element,
  `asChild`-friendly so any link or avatar can be the trigger), and `HoverCardContent` (the
  portalled, positioned preview surface). The card is free-form content: callers compose avatars,
  headings, text, and links inside it.
- **Timing**: `openDelay` and `closeDelay` (forwarded to the Radix root, sensible defaults) tune
  hover intent so the card does not flicker on incidental pointer movement; a grace area keeps it
  open while the pointer travels from trigger to card.
- **States**: closed / open, driven by pointer enter/leave and focus/blur; controllable
  (`open` / `onOpenChange`) and uncontrolled (`defaultOpen`) like the other Radix-backed Branches.
- **A11y**: the preview is not a modal - it does **not** trap focus and is opened by focus as well
  as hover, so keyboard and pointer users get the same preview; content inside stays in the normal
  tab order. Escape and blur close it. Guarded by observable tests (opens on focus, opens on
  hover, closes on leave, trigger is focusable), per the repo learning that a11y is proven by
  outcomes, not scaffolding.
- **Theming**: styled with the 0005 recipe (full-literal semantic-token utilities, `cn()` merge,
  `forwardRef` + native prop spread), so it themes light/dark through the token layer with **no
  `dark:` on the common path**; the portalled content themes correctly (Radix portals under
  `<body>`, inheriting `.dark` from `<html>`) exactly like `DialogContent` / `SelectContent`.
- **Surface + motion**: `HoverCardContent` is a raised surface (`bg-surface-raised`, `border`,
  `shadow-md`, `rounded-lg`) with the shared **pop** motion (`animate-pop-in` /
  `animate-pop-out`), gated by `motion-reduce:animate-none`.
- **Docs**: a Storybook catalog entry (user-card, link-preview, delays, controlled, both themes);
  canopy `README.md` component list and the `overview/` living docs updated on completion.

## Scope

### In

- `packages/canopy/src/branches/HoverCard.tsx` (+ `packages/canopy/src/branches/HoverCard.test.tsx`)
  - the component family and its parts.
- Barrel export from `packages/canopy/src/branches/index.ts`
  (`HoverCard`, `HoverCardTrigger`, `HoverCardContent` and their prop types).
- **Parts**: `HoverCard` (root; passes through `openDelay`, `closeDelay`, `open`/`onOpenChange`,
  `defaultOpen`), `HoverCardTrigger` (`asChild` so any element - link, avatar, badge - is the
  trigger), `HoverCardContent` (portalled raised surface with pop motion, `sideOffset`/`align`
  forwarded, width sized by content).
- **One new runtime dependency**: `@radix-ui/react-hover-card` - added to
  `packages/canopy/package.json` `dependencies` **and** externalized in
  `packages/canopy/tsup.config.ts` `external: [...]` alongside the other Radix primitives, then
  `pnpm install` at the repo root.
- Storybook stories in `apps/storybook/src/HoverCard.stories.tsx`, importing from
  `@rogueoak/canopy/branches`: Playground, UserCard (avatar + name + bio + stats),
  LinkPreview (inline link trigger in prose), Delays (custom `openDelay`/`closeDelay`),
  Controlled (`open`/`onOpenChange`) - each rendering correctly in light and dark from the toolbar.
- Tests: opens on trigger **hover**; opens on trigger **focus**; closes on leave/blur; content
  reaches the DOM only when open; `asChild` trigger renders the passed element (link stays a real
  focusable anchor); controlled (`open`) and uncontrolled (`defaultOpen`) both work; caller
  `className` merges onto content (caller wins); `ref` forwards to content; content carries the
  raised-surface + shadow token classes.
- Canopy `README.md` component list, `docs/overview/features.md`, and `docs/overview/architecture.md`
  (record `@radix-ui/react-hover-card` in the canopy dependency footprint) updated on completion.

### Out

- **Click-to-open / dismissable popover** behaviour - that is Popover's job; HoverCard is
  hover/focus-only. Not changing or absorbing Popover.
- **Interactive, focus-trapping cards** (forms, menus inside the preview) - deferred; HoverCard is
  a passive preview, not a dialog. A focus-managed variant is a clean follow-up if wanted.
- **Async / lazy preview content** (fetch-on-open, loading and error states for link unfurling) -
  v1 renders caller-supplied content synchronously; an async source is a separate follow-up spec.
- **Touch-specific long-press affordance** - hover has no touch analogue; touch fallback is out of
  scope for v1 (callers give a tap target elsewhere).
- Changing `Tooltip` (0014) or any unrelated component - HoverCard is purely additive.
- Introducing a second primitive library - v1 stays on the Radix + 0005-recipe stack that matches
  every existing canopy component.

## Approach

**Primitive stack: `@radix-ui/react-hover-card` + the 0005 recipe.** Radix ships a purpose-built
hover-card primitive that already solves the hard parts: hover-intent timing (`openDelay` /
`closeDelay`), the grace area between trigger and content so the card does not flicker while the
pointer crosses the gap, focus-open for keyboard users, collision-aware positioning, and a portal.
Canopy is built entirely on Radix primitives with the 0005 recipe, so HoverCard follows suit
rather than hand-rolling timers or introducing a new primitive family. Being Radix-portalled under
`<body>` with `.dark` on `<html>`, the content themes correctly with no per-portal theme wiring -
the same note recorded for `DialogContent` and `SelectContent`.

**Layer: Branch.** HoverCard owns interaction state (open/close driven by hover and focus) and
portals its content - both of which put it at the Branch layer per the layer-decision rule,
alongside `Dialog` and `Combobox`. It lives in `src/branches/` and exports from
`branches/index.ts`.

**Part surface (mirrors the shadcn hover-card, canopy-styled).**
- `HoverCard` - the Radix root re-exported directly (`HoverCardPrimitive.Root`); it owns state and
  forwards `openDelay`, `closeDelay`, `open`/`onOpenChange`, and `defaultOpen`. No styling.
- `HoverCardTrigger` - the Radix trigger, re-exported (or a thin `forwardRef` wrapper) with
  `asChild` support so any element (a link, an `Avatar`, a `Badge`) becomes the trigger and stays
  a real, focusable element.
- `HoverCardContent` - a `forwardRef` wrapper over `HoverCardPrimitive.Content` inside
  `HoverCardPrimitive.Portal`. Styled with **full-literal** token utilities:
  `z-50 rounded-lg border border-border bg-surface-raised p-4 text-text shadow-md` plus the pop
  motion (`animate-pop-in data-[state=closed]:animate-pop-out motion-reduce:animate-none`), with
  `sideOffset`/`align` forwarded and a sane default offset. Uses `React.ComponentRef<typeof
  HoverCardPrimitive.Content>` for the ref type (not the deprecated `React.ElementRef`).

**Styling & recipe.** Every styled wrapper uses FULL LITERAL token-utility strings (so Tailwind
v4's scanner emits each class - never build class names dynamically), `cn()` to merge the caller
`className` so the caller wins, `forwardRef` with a native prop spread, and **semantic tokens
only - no palette, no `dark:` on the common path**. The raised, portalled surface uses
`bg-surface-raised` (the raised-surface rule), matching `DialogContent` / `SelectContent` for
visual parity. `displayName` mirrors the Radix part's `displayName`.

**Accessibility.** Radix opens the card on both hover and focus and does **not** trap focus (it is
a preview, not a modal), so keyboard and pointer users get the same experience and content inside
the card stays in the normal tab order; Escape and blur close it. Distinct from Tooltip (0014),
which is `role="tooltip"` for short non-interactive text - HoverCard is a general preview surface
that may contain links. The a11y promises are guarded by observable tests: opens on focus, opens
on hover, closes on leave/blur, and the `asChild` trigger remains a focusable element (e.g. an
anchor stays an anchor).

**Motion.** The shared **pop** animation (`animate-pop-in` / `animate-pop-out`) already in the
Roots preset, gated with `motion-reduce:animate-none` so reduced-motion users get an instant
show/hide - no new keyframes are added.

**Trade-offs.**
- *New dependency (`@radix-ui/react-hover-card`)*: one more runtime dep on canopy, but it is a
  small, first-party Radix primitive that is exactly the missing hover-preview surface;
  hand-rolling hover intent, the grace area, and focus-open would be more fragile code to own.
  Security/architecture personas should weigh the new-dependency surface in review; it is
  externalized in the tsup build like every other Radix dep so the consumer installs it once.
- *Passive preview vs interactive card*: v1 does not focus-trap or manage focus inside the card,
  keeping the surface small and the semantics clearly "preview". Interactive cards are deferred to
  a follow-up rather than overloading this component.
- *Hover has no touch analogue*: accepted for v1; touch users rely on a separate tap target. Called
  out so the component is not mistaken for a universal disclosure.

## Acceptance

- [ ] `HoverCard`, `HoverCardTrigger`, and `HoverCardContent` (and their prop types) ship from
      `@rogueoak/canopy/branches` (exported via `branches/index.ts`), built on
      `@radix-ui/react-hover-card`.
- [ ] `@radix-ui/react-hover-card` is added to `packages/canopy/package.json` `dependencies` **and**
      externalized in `packages/canopy/tsup.config.ts` `external: [...]`; `pnpm install` run at the
      repo root.
- [ ] Recipe obeyed: `HoverCardContent` uses full-literal semantic-token utilities
      (`bg-surface-raised`, `border-border`, `shadow-md`, `rounded-lg`, `text-text`) with `cn()`
      merge (caller `className` wins), `forwardRef` + native prop spread, `React.ComponentRef` for
      the ref type, and **no `dark:` on the common path**.
- [ ] Opens on trigger **hover** and on trigger **focus**; closes on leave/blur and Escape;
      content is portalled and reaches the DOM only when open.
- [ ] Does **not** trap focus; `asChild` trigger renders the passed element and it stays focusable
      (a link trigger remains a real anchor).
- [ ] Controlled (`open`/`onOpenChange`) and uncontrolled (`defaultOpen`) both work; `openDelay`
      and `closeDelay` forward to the Radix root.
- [ ] Content carries the pop motion (`animate-pop-in` / `animate-pop-out`) gated by
      `motion-reduce:animate-none`; portalled content themes correctly in light **and** dark.
- [ ] Storybook catalog entry (`apps/storybook/src/HoverCard.stories.tsx`) with Playground,
      UserCard, LinkPreview, Delays, and Controlled stories rendering in both themes;
      `pnpm storybook` build is green.
- [ ] Tests cover: opens on hover, opens on focus, closes on leave/blur, content only in DOM when
      open, `asChild` trigger renders/focuses the passed element, controlled + uncontrolled,
      `className` merge (caller wins), `ref` forwards to content, raised-surface tokens present.
- [ ] `pnpm test` / `pnpm lint` / `pnpm build` pass from the repo root.
- [ ] Canopy `README.md` component list includes HoverCard; `docs/overview/features.md` (new
      capability) and `docs/overview/architecture.md` (new primitive `@radix-ui/react-hover-card`
      in the canopy dependency footprint) updated on completion.
