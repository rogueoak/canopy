# 0041 - empty

## Problem

Canopy frames content well - `Card` (0022) surfaces a region, `Skeleton` covers the loading
state, `Spinner` (0017) covers the busy state - but there is no **empty-state** block for the
*zero-data* case: a list with no rows, a search with no results, an inbox with nothing in it, a
freshly created project. Today every consumer hand-rolls that view - a centred stack of an icon,
a heading, a line of muted copy, and a call-to-action button - re-deciding the spacing, the text
colours, and the heading semantics each time, so zero-data views drift apart across surfaces.
shadcn has no `Empty` primitive at all, so there is no upstream pattern to lean on; this is a gap
the design system should own once.

This is for any view that can legitimately be empty: table/list placeholders, "no results" after
a filter or `Combobox` (0030) search, first-run onboarding panels, cleared notification trays. It
is a **presentational composition** - a small family of parts with a centred layout and muted
copy - and pairs naturally with `Button` (0005) for the recovery action and `Card` (0022) when
the empty state sits inside a framed region.

## Outcome

- A new canopy Twig family, `Empty`, exported from `@rogueoak/canopy/twigs`, that composes a
  centred zero-data block from small `forwardRef` parts: `Empty` (the container), `EmptyMedia`
  (the optional icon/illustration slot), `EmptyTitle` (the heading), `EmptyDescription` (muted
  supporting copy), and `EmptyContent` (the actions row).
- **Layout**: the container centres its children horizontally with `text-center`, stacks them in
  a column with a consistent gap, and applies generous vertical padding so the block reads as an
  intentional placeholder rather than a broken view. `EmptyContent` lays actions out in a centred
  row that wraps.
- **Semantics / a11y**: `EmptyTitle` renders a real heading element (default `<h3>`, carrying the
  `h3` typography role) with `asChild` to fix the document-outline level for its context, mirroring
  `CardTitle`. `EmptyMedia` is decorative by default (`aria-hidden`) so the icon is not announced,
  with the heading + description carrying the meaning. No new ARIA roles are invented; the block is
  a labelled region only when the caller wraps it.
- **Theming**: styled with the 0005 recipe - full literal semantic-token Tailwind utilities
  (`text-text` title, `text-text-muted` description, `text-text-subtle` media), `cn()` merge,
  `forwardRef` + native prop spread - so it themes light/dark through the token layer with **no**
  `dark:` on the common path.
- **Docs**: a Storybook catalog entry (default, with-action, no-icon, inside-a-`Card`, and both
  themes); canopy README component list and the `overview/` living docs updated on completion.

## Scope

### In
- `packages/canopy/src/twigs/Empty.tsx` (+ `Empty.test.tsx`) - the component family and its
  parts, exported from `packages/canopy/src/twigs/index.ts`.
- Parts: `Empty` (container - centred column, `text-center`, vertical padding, gap),
  `EmptyMedia` (optional icon/illustration slot, `text-text-subtle`, `aria-hidden` by default,
  `asChild` to wrap a caller-supplied element), `EmptyTitle` (heading, default `<h3>` with the
  `h3` role, `asChild` to set the outline level), `EmptyDescription` (muted `body-sm` copy, a real
  `<p>`), and `EmptyContent` (centred, wrapping actions row with a gap - the place for one or two
  `Button`s).
- No new runtime dependency - pure composition over `cn()` + Radix `Slot` (already a canopy
  dependency, used by `Card`/`Button` for `asChild`); no tsup external change.
- Stories: default (icon + title + description + action), with-action, no-icon (title +
  description only), inside a `Card`, and a "no search results" variant - light and dark.
- Tests: renders each part; `EmptyTitle` is a heading with the `h3` role and honours `asChild`
  to change the element; `EmptyMedia` is `aria-hidden` by default and overridable; `EmptyContent`
  renders and lays out action children; token classes applied (title `text-text`, description
  `text-text-muted`); `className` merges with caller winning; each part forwards `ref` and spreads
  native props.

### Out
- **Preset "no results" / "error" variants** (a `variant` prop that swaps default icon + copy) -
  v1 is pure composition; a themed preset layer is a clean follow-up if wanted.
- **Built-in illustration set** - `EmptyMedia` is a slot; canopy does not ship stock artwork.
  Callers pass an icon (e.g. from the canopy icon set) or their own SVG.
- **Loading / error states** - those stay with `Skeleton` and `Spinner` (0017); `Empty` is the
  zero-data placeholder only.
- Changing any existing component - `Empty` is additive; `Card` (0022), `Button` (0005), and
  `Combobox` (0030) are untouched.

## Approach

**Primitive stack: pure composition (no Radix primitive, no new dep).** `Empty` owns no
interaction state and no portal, so it is a **Twig** (composes existing parts / `Slot`), built
exactly like `Card` (0022): each part is a small `forwardRef` element that spreads native props
and merges `className` via `cn()`, with FULL LITERAL Tailwind class strings so Tailwind v4's
scanner emits every utility. `asChild` (on `EmptyTitle` and `EmptyMedia`) uses `@radix-ui/react-slot`,
already a canopy dependency - so this ships with **zero** new runtime dependencies and needs no
tsup external change. No new dependency means no security/architecture dependency review is
triggered by this spec.

**Part surface (mirrors `Card`, canopy-styled).**
- `Empty` - the container: `flex flex-col items-center text-center` with a column gap and generous
  vertical padding (`py-12`) so the placeholder reads as intentional; a plain `<div>` that spreads
  native props.
- `EmptyMedia` - the optional icon/illustration slot: `text-text-subtle` so the mark sits quietly
  above the title, `aria-hidden` by default (decorative - the heading carries meaning) with the
  attribute overridable, and `asChild` to wrap a caller-supplied element (icon component or SVG).
- `EmptyTitle` - the heading: default `<h3>` carrying the `h3` typography role on `text-text`, with
  `asChild` to swap the element so the caller can keep the page outline correct (identical idiom to
  `CardTitle`).
- `EmptyDescription` - muted supporting copy: a real `<p>` in the `body-sm` role on `text-text-muted`.
- `EmptyContent` - the actions row: `flex flex-wrap items-center justify-center gap-2` so one or two
  `Button`s centre and wrap on narrow widths.

**Styling & recipe.** Semantic tokens only - `text-text` (title), `text-text-muted` (description),
`text-text-subtle` (media) - `cn()` merge with the caller's `className` winning, `forwardRef` on
every part with a native prop spread, no `dark:` on the common path (light/dark flips through the
token layer per 0004). No new keyframe, no motion.

**Accessibility.** No new ARIA roles are invented: the block conveys meaning through a real heading
(`EmptyTitle`) plus muted description text, and the decorative `EmptyMedia` is `aria-hidden` by
default so a screen reader does not announce the icon. `asChild` on the title lets the caller place
the correct heading level for the surrounding outline. The a11y promises (heading role present,
media hidden by default, title element swap via `asChild`) are guarded by observable tests per the
repo learning that a11y is verified by outcomes, not scaffolding.

**Trade-offs.**
- *Composition over a `variant` preset*: shipping bare parts keeps the surface small and lets
  callers own copy and artwork; the cost is that a "no results" state is assembled by the caller
  rather than one prop. Accepted for v1 - a preset layer can wrap these parts later without a
  breaking change.
- *No stock illustrations*: `EmptyMedia` is a slot, so canopy avoids owning an artwork set and the
  bundle stays lean; callers bring the icon. Accepted - matches the "canopy styles, you compose"
  posture of `Card`.

## Acceptance

- [ ] `Empty`, `EmptyMedia`, `EmptyTitle`, `EmptyDescription`, and `EmptyContent` ship from
      `@rogueoak/canopy/twigs` (exported via `packages/canopy/src/twigs/index.ts`); no new runtime
      dependency and no tsup external change.
- [ ] Built to the 0005 recipe: full literal semantic-token utilities, `cn()` merge (caller
      `className` wins), `forwardRef` + native prop spread on every part, `React.ComponentRef`
      where a wrapped element ref is typed, and **no `dark:` on the common path**.
- [ ] Layout: `Empty` centres its children in a `text-center` column with vertical padding;
      `EmptyContent` is a centred, wrapping actions row.
- [ ] `EmptyTitle` renders a real heading (default `<h3>`, `h3` typography role) and honours
      `asChild` to change the element; `EmptyDescription` is a muted `<p>`; token colours applied
      (title `text-text`, description `text-text-muted`, media `text-text-subtle`).
- [ ] `EmptyMedia` is `aria-hidden` by default and the attribute is overridable; `asChild` wraps a
      caller-supplied element.
- [ ] Stories: default, with-action, no-icon, inside-a-`Card`, and no-search-results - rendering in
      both themes; `pnpm storybook` build is green.
- [ ] Tests cover: each part renders; title heading role + `asChild` element swap; media
      `aria-hidden` default + override; `EmptyContent` lays out action children; token classes
      applied; `className` merge (caller wins); ref forwarding + native prop spread. `pnpm test`,
      `pnpm lint`, and `pnpm build` all pass from the root.
- [ ] Canopy `README.md` component list includes `Empty`; `overview/features.md` (new zero-data
      capability) and `overview/architecture.md` (new Twig; note no new dependency added) updated on
      completion.
