# 0061 - Carousel

## Problem

Canopy has containers that show one thing at a time (`Dialog` 0028, `ResponsiveDialog`) and
navigation shells (`TopNav` / `SideNav`), but no **carousel**: a swipeable, keyboard-navigable
strip of content that shows a subset of items and lets a user page through the rest. Product and
marketing surfaces repeatedly need this - image galleries, feature/testimonial sliders, onboarding
walkthroughs, "related items" rails, card decks - and today a consumer has to hand-roll pointer
dragging, snap points, wrap-around, keyboard arrows, and the prev/next disabled-at-ends logic
against a raw scroller every time. That is exactly the sort of composed, accessible behaviour the
design system should own once.

shadcn ships a Carousel built on `embla-carousel-react`, but canopy has no equivalent; the closest
canopy pieces are the single-item `Dialog` family and the `Button` (0005) styling that a carousel's
controls should reuse. This spec adds the missing **Branch**-layer Carousel: a small part family
that composes a viewport, a track, items, and previous/next controls, wired through a shared context
that exposes the embla API.

This is for any surface that pages through a horizontal (or vertical) list of peer content and wants
the drag/keyboard/snap behaviour handled for it, with controls that read as native canopy `Button`s.

## Outcome

- A new canopy component family, `Carousel`, exported from `@rogueoak/canopy/branches`, built on
  `embla-carousel-react`. Parts: **`Carousel`** (the context root that owns the embla instance),
  **`CarouselContent`** (the overflow viewport + flex track), **`CarouselItem`** (one slide),
  **`CarouselPrevious`** and **`CarouselNext`** (the paging controls).
- **Orientation**: an `orientation` prop (`horizontal` default, or `vertical`) sets the track axis,
  the item spacing axis, the control placement, and the arrow key mapping.
- **States**: `CarouselPrevious` / `CarouselNext` are **disabled at the ends** (unless embla `loop`
  is enabled), reflecting `canScrollPrev` / `canScrollNext`; disabled controls are inert and use the
  shared `Button` disabled styling.
- **Keyboard + a11y**: the root is a labelled region (`role="region"`, `aria-roledescription="carousel"`);
  the track carries `role="group"` per-item semantics (`aria-roledescription="slide"`); the viewport
  is focusable and **arrow keys** page (Left/Right for horizontal, Up/Down for vertical). Controls are
  real `<button>`s with accessible labels ("Previous slide" / "Next slide").
- **Theming**: styled with the 0005 recipe (full literal semantic-token Tailwind utilities, `cn()`
  merge, `forwardRef` + native prop spread), so it themes light/dark through the token layer with **no
  `dark:` on the common path**; the prev/next controls reuse canopy `Button` styling.
- **Escape hatch**: the root optionally exposes the embla API via `setApi`/callback so callers can drive
  autoplay, dots, or programmatic scroll without the component owning those features.
- **Docs**: a Storybook catalog entry (playground, horizontal, vertical, sizes/multi-item, with-content
  cards, loop, disabled-at-ends) and canopy `README.md` + `overview/` living docs updated on completion.

## Scope

### In
- `packages/canopy/src/branches/Carousel.tsx` (+ `Carousel.test.tsx`) - the component family and its
  parts (`Carousel`, `CarouselContent`, `CarouselItem`, `CarouselPrevious`, `CarouselNext`), plus the
  internal `CarouselContext` / `useCarousel` hook that exposes the embla api and scroll state.
- Barrel export from `packages/canopy/src/branches/index.ts` (the five parts as values, their prop
  types, and the `CarouselApi` type re-export).
- One new runtime dependency on `@rogueoak/canopy`: **`embla-carousel-react`** - added to
  `packages/canopy/package.json` `dependencies` AND **externalized** in `packages/canopy/tsup.config.ts`
  `external: [...]` (same rule as the Radix/cmdk deps). `pnpm install` at the repo root after.
- `orientation` (`horizontal` | `vertical`), pass-through of embla `opts` (align, loop, etc.) and
  `plugins`, and an optional `setApi` callback to hand the embla instance to the caller.
- Prev/next controls that reuse canopy `Button` (0005) styling and reflect `canScrollPrev` /
  `canScrollNext` for the disabled-at-ends behaviour.
- Keyboard paging (arrow keys mapped to orientation) and the region/group/slide ARIA roles.
- Story in `apps/storybook/src/Carousel.stories.tsx` importing from `@rogueoak/canopy/branches`.
- Stories: **Playground**, **Horizontal**, **Vertical**, **MultipleItems** (partial-width items),
  **WithContent** (cards inside items), **Loop**, and **DisabledAtEnds** - each rendering light and
  dark via the toolbar (no per-story theme code).
- Tests: renders with region/group/slide roles; prev disabled at start and next disabled at end;
  clicking next advances and enables prev; arrow keys page in the active orientation; `orientation`
  switches the axis mapping; `setApi` receives the embla instance; controls are labelled `<button>`s;
  disabled control is inert; `className` merge (caller wins) on each part; ref forwarding on each part.
- README component list + `overview/features.md` (new capability) + `overview/architecture.md` (new
  `embla-carousel-react` primitive in the canopy dependency footprint) updated on completion.

### Out
- **Autoplay, dots/pagination indicators, and progress bars** - v1 exposes the embla api via `setApi`
  so callers add these; a canopy `CarouselDots` / autoplay wrapper is a clean follow-up spec.
- **Thumbnail / synced multi-carousel** setups (two embla instances kept in sync) - deferred.
- **Virtualized / lazy-loaded** slides for very large item counts - flat DOM list for v1.
- Changing any existing component (`Button`, `Dialog`, navs) - Carousel is additive and only *reuses*
  the existing `Button` styling; no `Button` public API changes.
- Introducing a second animation/gesture library - v1 stays on `embla-carousel-react`, matching the
  single-primitive-per-behaviour convention.

## Approach

**Primitive stack: `embla-carousel-react` + the 0005 recipe (the shadcn-on-embla carousel).** Embla is
a small, dependency-free, accessible carousel engine that owns the hard parts - pointer/drag, snap
points, wrap-around (`loop`), and the `canScrollPrev` / `canScrollNext` / `scrollPrev` / `scrollNext`
api - while leaving all DOM and styling to us, which is exactly what the canopy recipe wants. It is
added as a runtime **dependency** of `@rogueoak/canopy` and **externalized in tsup** like the Radix and
cmdk deps, so the consumer installs it once and no second copy lands in their graph. Because it is a
new third-party runtime dependency, the **security and architecture personas should weigh the new
dependency surface in review** (bundle size, transitive deps, maintenance) - flagged here per the
new-dependency rule.

**Part surface (mirrors the shadcn carousel, canopy-styled).**
- `Carousel` - the stateful root. Calls `useEmblaCarousel(opts, plugins)`, tracks `canScrollPrev` /
  `canScrollNext` from embla's `select`/`reInit` events, and provides them plus `scrollPrev` /
  `scrollNext` / `orientation` / the embla `api` through a `CarouselContext`. Renders the labelled
  region wrapper (`role="region"`, `aria-roledescription="carousel"`), spreads native props, forwards
  `ref`, and attaches the orientation-aware `onKeyDown` arrow handler. An optional `setApi` callback
  hands the embla instance to the caller for autoplay/dots without the component owning them.
- `CarouselContent` - the embla **viewport** (`overflow-hidden`) wrapping the **track** (`flex`;
  horizontal uses `-ml-4` gutter with items `pl-4`, vertical uses `-mt-4` / `pt-4` and `flex-col`),
  wired to embla's `ref`. Full literal token/layout utilities so Tailwind v4's scanner emits them.
- `CarouselItem` - one slide: `role="group"`, `aria-roledescription="slide"`, `min-w-0 shrink-0
  grow-0 basis-full` by default (callers override `basis-*` via `className` for multi-item layouts).
- `CarouselPrevious` / `CarouselNext` - canopy **`Button`**s (reusing the 0005 `Button` component /
  its styling so they read as native canopy controls, default `variant="outline" size="icon"` with a
  chevron and an `sr-only` label), positioned per orientation, `disabled` bound to `!canScrollPrev` /
  `!canScrollNext`, calling `scrollPrev` / `scrollNext` on click.

**Styling & recipe.** FULL LITERAL semantic-token utility strings on every part (no dynamic class
construction), `cn()` merge with the caller's `className` winning, `forwardRef` on every part with a
native prop spread, `React.ComponentRef` for ref typing, and **no `dark:` on the common path** - the
controls inherit `Button`'s token-driven light/dark. Disabled controls use `Button`'s existing disabled
tokens; no new disabled styling is introduced.

**Accessibility.** The root is a labelled `region` with `aria-roledescription="carousel"`; each item is
a `group` with `aria-roledescription="slide"`; the viewport is focusable (`tabIndex`) so arrow keys work,
mapped to orientation (Left/Right horizontal, Up/Down vertical) and calling the same `scrollPrev`/`scrollNext`
paths as the buttons; controls are real, labelled `<button>`s. These promises are guarded by **observable
tests** (roles present, labelled buttons, arrow-key and click paging, disabled-at-ends), per the repo
learning that a11y is proven by outcomes, not scaffolding. Controls should be labelled via the caller's
context (e.g. `aria-label` on the region) as documented in the story.

**Motion.** Embla's own transform-based sliding is the only motion; no canopy keyframe is added. Reduced-
motion users still get functional paging (embla jumps rather than easing when the platform requests it);
no `animate-*` utility is introduced.

**Trade-offs.**
- *embla vs a Radix primitive*: Radix has no carousel, so a new primitive is unavoidable; embla is the
  standard, lightweight, framework-agnostic choice and is what shadcn uses. The cost is one more runtime
  dependency (flagged for security/architecture review); the benefit is not owning drag/snap/loop physics.
- *api exposed via `setApi` vs built-in dots/autoplay*: keeping v1 to the core paging surface and handing
  the embla api out keeps the component small and composable; dots/autoplay/thumbnails are clean follow-ups
  rather than baked-in surface area.
- *Reusing `Button` for controls*: the controls are canopy `Button`s so they inherit variants, tokens, and
  the disabled treatment for free and stay visually consistent, at the cost of a hard dependency on the
  `Button` styling contract (accepted - it is the intended reuse).

## Acceptance

- [ ] `Carousel`, `CarouselContent`, `CarouselItem`, `CarouselPrevious`, `CarouselNext` (and the
      `useCarousel` context + `CarouselApi` type) ship from `@rogueoak/canopy/branches` (exported via
      `branches/index.ts`), built on `embla-carousel-react`; **no `dark:` on the common path**.
- [ ] `embla-carousel-react` is added to `packages/canopy/package.json` `dependencies` **and**
      externalized in `packages/canopy/tsup.config.ts`; `pnpm install` reconciles the lockfile.
- [ ] Recipe obeyed: full literal semantic-token/layout classes on every part, `cn()` merge (caller
      `className` wins), `forwardRef` + native prop spread on every part, `React.ComponentRef` for refs.
- [ ] **Orientation**: `orientation="horizontal"` (default) and `"vertical"` set the track axis, item
      gutter axis, control placement, and arrow-key mapping correctly.
- [ ] **Controls**: `CarouselPrevious` / `CarouselNext` reuse canopy `Button` styling, are labelled
      `<button>`s, page on click, and are **disabled at the ends** (bound to `canScrollPrev` /
      `canScrollNext`); a disabled control is inert with the shared `Button` disabled tokens.
- [ ] **Keyboard + ARIA**: root is `role="region"` `aria-roledescription="carousel"`; each item is
      `role="group"` `aria-roledescription="slide"`; arrow keys page in the active orientation.
- [ ] **Escape hatch**: `setApi` receives the embla instance; `opts` (align/loop) and `plugins`
      pass through to embla.
- [ ] Storybook catalog entry with Playground, Horizontal, Vertical, MultipleItems, WithContent, Loop,
      and DisabledAtEnds stories, importing from `@rogueoak/canopy/branches`; `pnpm storybook` build is
      green and renders light + dark from the toolbar.
- [ ] Tests cover: region/group/slide roles present; prev disabled at start, next disabled at end;
      click-next advances and enables prev; arrow keys page in the active orientation; `orientation`
      switches the axis; `setApi` receives the api; controls are labelled buttons; disabled control inert;
      `className` merge (caller wins) and ref forwarding on each part. `pnpm test` / `lint` / `build` pass
      from the root.
- [ ] Canopy `README.md` component list includes Carousel; `overview/features.md` (new capability) and
      `overview/architecture.md` (new `embla-carousel-react` primitive in the canopy dependency footprint)
      updated on completion.
