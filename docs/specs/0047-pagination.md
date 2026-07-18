# 0047 - Pagination

## Problem

Canopy has the two navigation Twigs that move a user *between distinct pages* -
`Breadcrumb` (0029), the trail up a hierarchy - but nothing that moves a user *through a paged
list*: a numbered **page navigator** with previous/next controls and an ellipsis for the elided
middle. Any surface that renders more rows than fit on one screen (a data table, a search-results
page, a blog index, an admin list) needs this control, and today a consumer has to hand-roll it:
a `<nav>`, a list of number links, `aria-current="page"` on the active one, prev/next affordances,
and the disabled-at-the-ends logic - re-deriving the same accessible markup and the same
Button-matched styling every time. That is exactly the kind of small, repeated navigation pattern
the design system should own once.

shadcn ships a Pagination family (`Pagination` / `PaginationContent` / `PaginationItem` /
`PaginationLink` / `PaginationPrevious` / `PaginationNext` / `PaginationEllipsis`) that composes
its Button styling; canopy has the Button (0005) it would compose but not the Pagination itself -
a clear gap next to `Breadcrumb` (0029). This spec fills it, matching that part surface and
retargeting it onto canopy tokens and the `buttonVariants` recipe.

The audience is any app author paginating a list who wants the accessible, themed control for free
rather than rebuilding it. Like `Breadcrumb`, Pagination is **presentational**: the caller wires
`href`s and click handlers and owns which page is active - Pagination renders the structure and
the states, it does not compute page ranges or hold current-page state.

## Outcome

- A new canopy component family, `Pagination`, exported from `@rogueoak/canopy/twigs`, mirroring
  the shadcn part surface: `Pagination`, `PaginationContent`, `PaginationItem`, `PaginationLink`,
  `PaginationPrevious`, `PaginationNext`, `PaginationEllipsis`.
- `Pagination` renders a `<nav aria-label="pagination">` landmark (label overridable) so the
  control is discoverable and announced; `PaginationContent` renders the `<ul>` list of pages and
  `PaginationItem` each `<li>`.
- `PaginationLink` renders an `<a>` (or the single child via `asChild`, for a router `<Link>`) that
  is **styled to match `Button`** (`buttonVariants`): it takes an `isActive` prop and a `size`. The
  active link carries `aria-current="page"` and reads as a filled/outline "current" state; inactive
  links read as ghost. `PaginationPrevious` / `PaginationNext` are `PaginationLink`s with a leading
  chevron + "Previous" / trailing chevron + "Next" label and an accessible `aria-label`.
- `PaginationEllipsis` renders the elided-range affordance: a decorative dots glyph plus an
  `sr-only` "More pages" label so the gap is announced, not silent (the `BreadcrumbEllipsis`
  precedent, 0029).
- **Theming**: styled with the 0005 recipe (full-literal semantic-token Tailwind utilities via the
  shared `buttonVariants`, `cn()` merge, `forwardRef` + native prop spread), so it themes light and
  dark through the token layer with **no `dark:` on the common path**.
- **Docs**: a Storybook catalog entry (Playground, with-ellipsis, sizes, active-state,
  first-page/last-page-with-disabled-ends stories); the canopy README component list and the
  `overview/` living docs updated on completion.

## Scope

### In
- `packages/canopy/src/twigs/Pagination.tsx` (+ `Pagination.test.tsx`) - the component family and
  its parts, exported (values + prop types) from `packages/canopy/src/twigs/index.ts`.
- Seven parts matching the shadcn surface: `Pagination` (`<nav aria-label="pagination">`),
  `PaginationContent` (`<ul>`), `PaginationItem` (`<li>`), `PaginationLink` (`<a>` / `asChild`,
  `isActive` + `size`, styled via `buttonVariants`, `aria-current="page"` when active),
  `PaginationPrevious`, `PaginationNext` (labelled `PaginationLink`s with a chevron), and
  `PaginationEllipsis` (decorative dots + `sr-only` label).
- `PaginationLink` composes the existing `buttonVariants` from `../seeds/Button` for its styling
  (Twigs may import Seeds, per the layering rule) - active maps to a filled/outline variant,
  inactive to `ghost`; `size` reuses the Button `size` scale (with an `icon` size for the numbered
  links). No visual re-invention.
- `asChild` (Radix `Slot`) on `PaginationLink` (and thus Previous/Next) so a router `<Link>` can be
  wrapped, keeping canopy router-agnostic (the `BreadcrumbLink` / `TopNavLink` pattern).
- Hand-rolled inline `currentColor` SVGs for the prev/next chevrons and the ellipsis dots (the
  `Breadcrumb` precedent) - **no new dependency**.
- Storybook stories in `apps/storybook/src/Pagination.stories.tsx`: Playground, WithEllipsis,
  Sizes, ActiveState, and DisabledEnds (first/last page) - shown in light and dark via the toolbar,
  no per-story theme code.
- Tests: renders the `navigation` landmark with the pagination label; the active link carries
  `aria-current="page"` and inactive links do not; Previous/Next expose their `aria-label`s;
  `PaginationEllipsis` exposes its `sr-only` label and its glyph is `aria-hidden`; `asChild` renders
  the child element; caller `className` wins the `cn()` merge; a click on a link fires the caller's
  handler; each `size`/`isActive` renders the Button-matched classes.
- Canopy `README.md` component list, `overview/features.md`, and `overview/architecture.md` updated
  on completion.

### Out
- **Page-range computation** (the `1 ... 4 5 6 ... 20` windowing logic: how many numbers to show,
  where the ellipses fall) - Pagination is presentational; the caller (or a later `usePagination`
  helper) decides which items to render. A range-generating hook is a clean follow-up.
- **Current-page / total-count state** - Pagination holds no state; the caller owns the active page
  and wires `href`s / `onClick`. No `page` / `onPageChange` controlled API in v1.
- **A "rows per page" / page-size selector** - a separate composition (Select + Pagination) later.
- **No new runtime dependency** - reuse `@radix-ui/react-slot` (already a canopy dep, used by
  Button/Breadcrumb) and hand-rolled SVGs; introduce no icon or pagination library.
- Changing `Button` (0005), `Breadcrumb` (0029), or any other component - Pagination is additive
  and only *imports* `buttonVariants`; it does not alter it.

## Approach

**Primitive stack: none new - plain elements + `buttonVariants` + Radix `Slot`.** Pagination owns
no interaction state and no portal, so it is a structural compound **Twig** (the `Breadcrumb` /
`Card` precedent), not a Branch. Each part is a small `forwardRef` element that spreads native props
and merges `className` via `cn()`, with **full-literal** Tailwind class strings so Tailwind v4's
scanner emits each utility. Styling is **semantic tokens only** through the shared `buttonVariants`
recipe - no palette, no `dark:` on the common path - so light/dark flips through the token layer
(0004). Nothing here needs Radix beyond the `Slot` already used for `asChild`, and the chevron /
ellipsis glyphs are hand-rolled inline `currentColor` SVGs, so **no new runtime dependency** is
added (nothing for security/architecture review to weigh).

**Part surface (mirrors shadcn, canopy-styled).**
- `Pagination` - `<nav aria-label="pagination">` landmark (label overridable via `aria-label`),
  wrapping the content. Renders as a centered `flex` row.
- `PaginationContent` - the `<ul>` list, a `flex items-center` row with a small gap.
- `PaginationItem` - the `<li>` wrapper for a single page control.
- `PaginationLink` - the numbered page link. Renders `<a>` by default (or the child via `asChild`).
  Takes `isActive?: boolean` and a `size` (default `icon` for the square numbered links). Styling
  comes from `buttonVariants({ variant: isActive ? 'outline' : 'ghost', size })` so it reads exactly
  like a canopy Button; the active link additionally sets `aria-current="page"` (the "you are here"
  hook, matching `BreadcrumbPage`). It carries the shared Button focus-visible ring for free.
- `PaginationPrevious` / `PaginationNext` - `PaginationLink`s pre-wired with a leading/trailing
  chevron SVG and a "Previous" / "Next" text label, plus a sensible default `aria-label`
  ("Go to previous page" / "Go to next page") so an icon-with-text control is still fully named.
  They are inactive (never the current page) and use a wider (`default`) size to fit the label.
- `PaginationEllipsis` - a non-interactive `<span>` holding the three-dots SVG (`aria-hidden`,
  decorative) **and** an `sr-only` "More pages" label, so a screen reader announces the gap rather
  than skipping it silently (the `BreadcrumbEllipsis` fix from feedback 0012 - do not hide the whole
  wrapper).

**Presentational, caller-owned wiring (key decision).** Pagination intentionally computes nothing:
no page math, no active-page state, no total-count arithmetic. The caller passes `href`s and/or
`onClick` handlers, decides which `PaginationItem`s (numbers and ellipses) to render, and sets
`isActive` on the current page. This keeps the Twig framework-agnostic (works with any router or a
plain `<a>`, or a `<button>` via `asChild`), keeps the surface small, and mirrors how `Breadcrumb`
leaves the trail contents to the caller. The trade-off is that consumers hand-build (or bring their
own helper for) the visible range; a `usePagination` range hook is the natural follow-up (Out
above), added without breaking this presentational core.

**Disabled ends.** Because Pagination is presentational, "you are on the first/last page" is the
caller's concern: they render `PaginationPrevious` / `PaginationNext` with `aria-disabled="true"`
and drop the `href`/handler (or omit the control) at the ends. The DisabledEnds story and docs show
this idiom - matching Button's `asChild`-on-`<a>` caveat that native `disabled` does not apply to a
link, so `aria-disabled` + a caller guard is the correct disabled-link pattern.

**Accessibility.** The `<nav aria-label="pagination">` landmark makes the control discoverable; the
`<ul>`/`<li>` structure conveys the list; `aria-current="page"` marks the active page (the single
authoritative "current" signal); Previous/Next carry real `aria-label`s so the icon+label controls
are named; and the ellipsis is announced via its `sr-only` label with the glyph `aria-hidden`. All
of these promises are guarded by **observable tests** (landmark role present, `aria-current` on the
active link only, prev/next labels present, ellipsis label present + glyph hidden), per the repo
learning that a11y is proven by outcomes, not by asserting a class exists.

**Motion.** None - Pagination has no animation; state changes are instant hover/active color shifts
inherited from `buttonVariants`.

## Acceptance

- [ ] `Pagination`, `PaginationContent`, `PaginationItem`, `PaginationLink`, `PaginationPrevious`,
      `PaginationNext`, and `PaginationEllipsis` ship from `@rogueoak/canopy/twigs` (values and prop
      types exported via `packages/canopy/src/twigs/index.ts`).
- [ ] No new runtime dependency: styling composes the existing `buttonVariants` (Button, 0005) and
      the glyphs are hand-rolled inline `currentColor` SVGs; only the already-present
      `@radix-ui/react-slot` is used (for `asChild`).
- [ ] Recipe obeyed: full-literal semantic-token classes, `cn()` merge (caller `className` wins),
      `forwardRef` + native prop spread on every part, `React.ComponentRef` typing where a wrapped
      element's ref type is needed, **no `dark:` on the common path** - themes light and dark through
      the token layer.
- [ ] `Pagination` renders `<nav aria-label="pagination">` (overridable); `PaginationContent` a
      `<ul>`; `PaginationItem` a `<li>`.
- [ ] `PaginationLink` renders `<a>` (or the child via `asChild`), styled by `buttonVariants` with
      `isActive` (active -> `outline`, inactive -> `ghost`) and a `size`; the active link carries
      `aria-current="page"` and inactive links do not.
- [ ] `PaginationPrevious` / `PaginationNext` render a chevron + label and a default `aria-label`
      ("Go to previous page" / "Go to next page"); the disabled-end idiom (`aria-disabled="true"`
      with no `href`/handler) is documented and shown in a story.
- [ ] `PaginationEllipsis` renders a decorative (`aria-hidden`) dots glyph plus an `sr-only` "More
      pages" label.
- [ ] Keyboard + a11y: links are natively focusable and carry the shared Button focus-visible ring;
      the `navigation` landmark, `aria-current` on the active link, prev/next `aria-label`s, and the
      ellipsis label are all present.
- [ ] Storybook catalog entry with Playground, WithEllipsis, Sizes, ActiveState, and DisabledEnds
      stories (light and dark via the toolbar, no per-story theme code); `pnpm storybook` build is
      green.
- [ ] Tests cover: navigation landmark + label; `aria-current` on active only; prev/next
      `aria-label`s; ellipsis `sr-only` label + `aria-hidden` glyph; `asChild` renders the child;
      `className` merge (caller wins); click fires the caller's handler; each `size`/`isActive`
      renders the Button-matched classes. `pnpm test` / `lint` / `build` pass from the repo root.
- [ ] Canopy `README.md` component list includes Pagination; `overview/features.md` (new navigation
      capability) and `overview/architecture.md` (Pagination as a presentational Twig composing
      `buttonVariants`, no new dependency) updated on completion.
