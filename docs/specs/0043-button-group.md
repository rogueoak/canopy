# 0043 - button-group

## Problem

Canopy has a solid single `Button` (0005) - cva variants, sizes, `asChild`, and the reference
recipe for the whole catalogue - but no way to **cluster** several buttons into one segmented
control. Toolbars, split actions, view-mode switchers ("List / Board / Calendar"), pagination
controls, and zoom in/out pairs all want buttons that sit flush against each other with shared
borders and joined radii (only the first and last corners rounded, the inner seams squared), so
the group reads as a single unit rather than a row of loose buttons.

Today a consumer has to hand-roll that: strip the individual radii, collapse the doubled borders
between neighbours, add the `role="group"` and `aria-label`, and redo it all for a vertical
stack - re-implementing the same fiddly CSS on every surface. This is exactly the composition a
design system should own once. shadcn/ui ships no button-group primitive (its `Button` is a lone
atom, same as ours), so there is no upstream pattern to lean on; canopy owns the gap.

`ButtonGroup` is a **Twig**: it composes 2+ `Button` (0005) Seeds via layout and shared styling,
holds no interaction state and no portal. It sits alongside the other twigs - `Card` (0009),
`SearchBar`, `Breadcrumb`, `FormField` - as a presentational container that arranges its
children. It is for anyone building a toolbar, a segmented switcher, or a split/adjacent action
set who wants the joined-segment look and correct grouping semantics for free.

## Outcome

- A new canopy Twig, `ButtonGroup`, exported from `@rogueoak/canopy/twigs`, that lays out its
  `Button` (0005) children as one **segmented cluster**: neighbours sit flush with a single
  shared seam (no doubled borders), and only the group's outer corners are rounded - the first
  child keeps its leading radius, the last child keeps its trailing radius, and the inner seams
  are squared.
- **Orientation**: `orientation="horizontal"` (default) lays the segments in a row; `"vertical"`
  stacks them in a column, with the joined-radii logic rotating to top/bottom accordingly.
- **Grouping semantics**: the container renders with `role="group"` and takes a required
  `aria-label` (or `aria-labelledby`) so assistive tech announces the cluster as one labelled
  control; the child buttons keep their own labels and focus order.
- **Separator**: the group can include a thin visual `border`-token divider between segments
  (opt-in) for cases where a flush seam is not enough contrast; it is presentational
  (`aria-hidden`) and does not break the grouping.
- **Composition, not replacement**: children are ordinary canopy `Button`s - every `variant`,
  `size`, `asChild`, and `disabled` still works; the group only contributes layout and the
  joined-radius/border styling. It holds no state and fires no events of its own.
- **Theming**: styled with the 0005 recipe (full literal semantic-token Tailwind utilities,
  `cn()` merge, `forwardRef` + native prop spread), so it themes light/dark through the token
  layer with **no `dark:` on the common path**.
- **Docs**: a Storybook catalog entry (horizontal, vertical, sizes, mixed variants, with a
  separator, and a disabled segment) rendering in both themes; canopy README component list and
  the `overview/` living docs updated on completion.

## Scope

### In

- `packages/canopy/src/twigs/ButtonGroup.tsx` (+ `ButtonGroup.test.tsx`) - the component,
  exported from `packages/canopy/src/twigs/index.ts`
  (`export { ButtonGroup } from './ButtonGroup'; export type { ButtonGroupProps } from './ButtonGroup';`).
- `orientation` (`horizontal` default | `vertical`) driving row/column layout and the
  joined-radii direction, implemented as full-literal cva variants (no dynamically built class
  names) so Tailwind v4's scanner emits each utility.
- Joined-segment styling applied to child buttons via layout-level utilities (flush neighbours,
  collapsed shared borders, first/last-only outer radii, inner seams squared) using
  first/last child selectors as literal classes - not by mutating each child's `className`.
- An opt-in `separator` affordance: a presentational, `aria-hidden` `border`-token divider
  between segments.
- `role="group"` with a required `aria-label` / `aria-labelledby` on the container; `forwardRef`
  to the container element and a full native prop spread.
- No new runtime dependency - reuse canopy's existing stack (`Button` (0005), `cn`, `cva`); no
  change to `packages/canopy/package.json` or `tsup.config.ts`.
- Storybook story `apps/storybook/src/ButtonGroup.stories.tsx` importing from
  `@rogueoak/canopy/twigs`: Playground, Horizontal, Vertical, Sizes, MixedVariants, WithSeparator,
  DisabledSegment - no per-story theme code (light/dark via the toolbar).
- Tests: renders children in order; container has `role="group"` and the supplied
  `aria-label`; horizontal vs vertical orientation applies the correct layout classes; the
  joined-radius classes are present on the first/last segments; a disabled child stays inert;
  `className` merge (caller wins); `ref` forwarding.
- Canopy `README.md` component list + `overview/features.md` and `overview/architecture.md`
  updated on completion.

### Out

- **Selection state / toggle-group behaviour** (single- or multi-select "which segment is
  active", roving-tabindex radio semantics) - that is a separate stateful Branch built on
  `@radix-ui/react-toggle-group`, out of scope here; this Twig is purely presentational.
- **Overflow / responsive collapse** (menu "..." when the group is too wide) - a later
  follow-up.
- **Split-button** (a primary action plus an attached dropdown-trigger segment) - composes a
  future `DropdownMenu` Branch; deferred.
- Changing `Button` (0005) or any other existing component - `ButtonGroup` is additive and does
  not touch the `Button` public API or source; the existing `Button` public API is unchanged.
- Introducing any new runtime dependency or primitive library.

## Approach

**Primitive stack: none new - compose `Button` (0005) with the 0005 recipe.** `ButtonGroup` is a
Twig (composes 2+ Seeds via layout, no interaction state, no portal), so it needs no Radix
primitive and no new dependency. It is a `forwardRef` container that spreads native props, sets
`role="group"`, and renders `children` (expected to be canopy `Button`s) inside a flex layout.

**Part surface.** A single part keeps the surface minimal:
- `ButtonGroup` - the container. Props: `orientation` (`horizontal` | `vertical`), the standard
  `aria-label` / `aria-labelledby` (one required for the group to be labelled), an optional
  `separator` boolean, `className`, `ref`, and the rest of the native `<div>` attributes spread
  through. No `value`/`onChange` - it is stateless.

**Joined-segment styling (the crux).** The group is a `flex` container (`flex-row` horizontal /
`flex-col` vertical). The segmented look is produced with **full literal** utility classes on the
container that target children via first/last/adjacent selectors, so Tailwind v4's scanner emits
every class and nothing is built dynamically:
- flush neighbours: children butt against each other (`-space-x`/`-space-y` seam collapse or
  negative-margin overlap on the shared edge) so doubled borders read as one `border-border` seam;
- outer radii only: the leading child keeps its start-side radius and the trailing child keeps
  its end-side radius while inner corners are squared, expressed with
  `[&>*:first-child]:rounded-l-md [&>*:last-child]:rounded-r-md [&>*:not(:first-child):not(:last-child)]:rounded-none`
  style literals (mirrored to `rounded-t/-b` for the vertical orientation) - all committed as
  literal strings, never `rounded-${side}`.
The exact seam/overlap utilities are settled in the build against the token vocabulary
(`border-border`, `rounded-none/sm/md/lg`); the spec fixes the *behaviour* (first/last outer
radii, single shared seam) and the *constraint* (full literals, semantic tokens only).

**Styling & recipe.** cva maps `orientation` to full literal token-utility strings; `cn()` merges
the caller `className` (caller wins); `forwardRef` with `React.ComponentRef<'div'>`; native
props spread; **no `dark:` on the common path** - light/dark flips through the token layer per
0004/0005. Borders use `border-border`; the optional `separator` divider is a `border-border`
token line, `aria-hidden`.

**Accessibility.** The container carries `role="group"` and requires an accessible name
(`aria-label` or `aria-labelledby`) so the cluster announces as one labelled control; the child
buttons retain their own accessible names, tab order, and disabled semantics (`ButtonGroup` adds
no roving-tabindex - each button is independently tabbable, which is correct for an action group,
as distinct from a single-select toggle group, which is deliberately out of scope). These
promises are guarded by **observable tests** (the `group` role and `aria-label` are present in
the rendered output; a disabled child is inert), per the repo learning that a11y is proven by
outcomes, not by asserting a class exists.

**Motion.** None - a static presentational container.

**Trade-offs.**
- *Presentational vs stateful*: shipping `ButtonGroup` as a stateless layout Twig (no active
  segment, no `@radix-ui/react-toggle-group`) keeps it in the Twig layer, dependency-free, and
  reusable for both plain action clusters and split actions. The cost is that single-select
  "segmented control" behaviour needs the separate Branch noted in Scope/Out. Accepted: the
  visual/grouping problem is the common need and worth owning first; selection is additive later.
- *Styling children from the parent vs a shared context*: using first/last/adjacent literal
  selectors on the container (rather than injecting a context each `Button` reads) keeps `Button`
  (0005) completely untouched and lets any `Button` variant drop in unchanged. The trade-off is
  the group assumes its direct children are the segments; documented in the story.
- *No new dependency*: by design - reuses `Button`, `cn`, and `cva` only, so there is no new
  runtime surface for security/architecture personas to weigh here.

## Acceptance

- [ ] `ButtonGroup` ships from `@rogueoak/canopy/twigs` (exported via `twigs/index.ts`), composes
      `Button` (0005) with no new runtime dependency and no change to `Button`'s public API.
- [ ] The 0005 recipe is obeyed: cva `orientation` variants of **full literal** semantic-token
      utilities, `cn()` merge (caller `className` wins), `forwardRef` (`React.ComponentRef<'div'>`)
      with native prop spread, **no `dark:` on the common path**; ASCII-only source and text.
- [ ] Segmented look: neighbours sit flush with a single shared `border-border` seam; only the
      group's outer corners are rounded (first child leading radius, last child trailing radius,
      inner seams squared) - and the joined-radii logic rotates correctly for `vertical`.
- [ ] `orientation="horizontal"` (default) lays segments in a row; `"vertical"` stacks them in a
      column.
- [ ] Container has `role="group"` and a required accessible name (`aria-label` /
      `aria-labelledby`); child buttons keep their own labels, tab order, and `disabled` (a
      disabled segment stays inert) - all proven by observable tests.
- [ ] Optional `separator` renders a presentational, `aria-hidden` `border-token` divider between
      segments without breaking the grouping.
- [ ] Storybook catalog entry (Playground, Horizontal, Vertical, Sizes, MixedVariants,
      WithSeparator, DisabledSegment) renders in both themes; `pnpm storybook` build is green.
- [ ] Tests cover: children render in order; `role="group"` + `aria-label` present; horizontal vs
      vertical layout classes applied; first/last joined-radius classes present; disabled child
      inert; `className` merge (caller wins); `ref` forwarding. `pnpm test` / `pnpm lint` /
      `pnpm build` pass from the root.
- [ ] Canopy `README.md` component list includes `ButtonGroup`; `overview/features.md` (new
      segmented-cluster capability) and `overview/architecture.md` (new Twig in the layer map)
      updated on completion.
