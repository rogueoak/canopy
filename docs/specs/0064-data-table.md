# 0064 - data-table

## Problem

Canopy has `Table` (0059) - styled semantic table parts (`Table` / `TableHeader` / `TableBody` /
`TableRow` / `TableHead` / `TableCell`) - but it is deliberately **presentational**: it renders
rows and columns and owns nothing else. 0059 explicitly puts sorting, selection, pagination, and
data logic out of scope and names `DataTable` (0064) as the future stateful grid that composes its
parts. So today a consumer who needs an actual data grid - sortable columns, toggleable column
visibility, row selection with a header select-all, and pagination over a dataset - has to hand-
wire all of that against raw `<table>` markup or reach outside the design system, re-implementing
sort state, selection state, and page math every time. That is exactly the recurring, error-prone
work the design system exists to own once.

shadcn ships its data table as a **guide, not a component**: it hands you a `@tanstack/react-table`
setup you copy and maintain yourself, so there is no reusable, themed grid to import. Canopy can
close that gap by owning it: a headless `useDataTable` hook plus a styled `DataTable` that maps
column definitions onto the canopy primitives already in the catalogue.

This is for any admin listing, records view, or dashboard grid: a users table you can sort and
page through, an invoices list with a checkbox column and bulk actions, a settings grid where
columns can be shown or hidden. It composes `Table` (0059) for presentation, `Pagination` (0047) /
`Button` for the pager controls, and `Empty` (0041) for the zero-rows state - stitching the
existing pieces into the grid the system is missing.

## Outcome

- A new canopy Branch, `DataTable`, exported from `@rogueoak/canopy/branches`, in two layers: a
  **headless `useDataTable`** hook that wraps `@tanstack/react-table`'s `useReactTable` with
  canopy-friendly defaults (sorting, column visibility, row selection, pagination row models
  wired), and a **styled `DataTable`** component that takes `columns` + `data` and renders the
  resolved table through the `Table` (0059) primitives.
- **Sorting**: sortable columns render a header control (a `Button` in `ghost` styling) that cycles
  ascending / descending / unsorted on click and keyboard activation, with the current direction
  reflected via `aria-sort` on the `<th>` and a directional glyph. Sort state is uncontrolled by
  default and controllable via props.
- **Column visibility**: `useDataTable` exposes the column-visibility state and setters so callers
  can drive a show/hide menu; hidden columns drop from both header and body. `DataTable` renders
  only visible columns.
- **Row selection**: an opt-in selection column renders a header **select-all** checkbox (canopy
  `Checkbox`) and a per-row checkbox; selected rows carry `data-[state=selected]` so the 0059
  selected-row token styling applies, and the selected-row set is exposed for bulk actions.
- **Pagination**: client-side pagination over the provided data, with a pager built from
  `Pagination` (0047) / `Button` (previous / next, page indicator, page-size handled by the hook).
  The pager is a slot so callers can swap it.
- **Filtering hooks**: `useDataTable` surfaces TanStack's column/global filter state and setters
  (the wiring, not a UI) so a caller can attach a `SearchBar` (0033) or per-column inputs; v1 ships
  the hooks and one global-filter story, not a bespoke filter UI.
- **Empty state**: when there are no rows to show (no data, or a filter that matches nothing) the
  body renders an `Empty` (0041) block in a full-width spanned row instead of an empty grid.
- **a11y**: presentation stays on the native table elements from 0059, so `table` / `rowgroup` /
  `row` / `columnheader` / `cell` roles and screen-reader table navigation come for free; sortable
  headers add `aria-sort` and an activatable control; selection checkboxes are real, labelled
  `Checkbox` controls (select-all labelled, per-row labelled). No ARIA is invented over what the
  native elements and canopy controls already provide.
- **Theming**: styled with the 0005 recipe - full literal semantic-token Tailwind utilities,
  `cn()` merge, `forwardRef` + native prop spread, `React.ComponentRef` refs - so it themes
  light/dark through the token layer with **no `dark:` on the common path**. All chrome (header
  control, pager, empty state) is drawn from existing canopy primitives, so it inherits their
  tokens.
- **Docs**: a Storybook catalog entry (basic, sortable, selectable, paginated, column-visibility,
  global-filter, empty) in both themes; canopy README component list and the `overview/` living
  docs updated on completion.

## Scope

### In
- `packages/canopy/src/branches/DataTable.tsx` (+ `DataTable.test.tsx`) - the `useDataTable` hook
  and the `DataTable` component, exported from `packages/canopy/src/branches/index.ts`.
- **Headless `useDataTable`**: wraps `useReactTable` with the sorting, column-visibility, row-
  selection, and pagination row models pre-wired and canopy defaults; returns the table instance
  plus the exposed state (sorting, visibility, selection, pagination, filters) so callers can
  build custom chrome. Sorting/selection/pagination/filter state is uncontrolled by default and
  controllable via props.
- **Styled `DataTable`**: props `columns` (TanStack `ColumnDef[]`, with canopy conventions for a
  sortable header and an opt-in selection column) and `data`; renders through `Table` (0059)
  parts. Options to enable sorting, a selection column, and pagination; a pager slot defaulting to
  a `Pagination` (0047) / `Button` control; an `emptyState` slot defaulting to an `Empty` (0041)
  block rendered in a spanned full-width row when there are no rows.
- **New runtime dependency**: `@tanstack/react-table` added to `packages/canopy/package.json`
  `dependencies` AND externalized in `packages/canopy/tsup.config.ts` `external: [...]` (per the
  canopy externalization rule - deps are not bundled), then `pnpm install` at the repo root.
- Reuses existing canopy primitives only: `Table` (0059), `Pagination` (0047), `Button`,
  `Checkbox`, `Empty` (0041); no restyling of those components.
- Storybook story `apps/storybook/src/DataTable.stories.tsx` importing from
  `@rogueoak/canopy/branches`. Stories: **Playground**, **Sortable**, **Selectable** (select-all +
  per-row + selected-row styling), **Paginated**, **ColumnVisibility**, **GlobalFilter**, **Empty**
  - no per-story theme code (toolbar drives light/dark).
- Tests: renders rows/columns through the 0059 parts and exposes native table roles; sortable
  header toggles sort and sets `aria-sort` (click and keyboard); hidden column drops from header +
  body; select-all toggles every row and header + rows carry the selected state; per-row selection
  toggles one row and exposes it; pagination advances/retreats page and clamps at ends; empty data
  renders the `Empty` block in a spanned row; controlled AND uncontrolled sorting/selection;
  `className` merge (caller wins); ref forwarding on `DataTable`.
- Docs: canopy `README.md` component list + `overview/features.md` (new data-grid capability) +
  `overview/architecture.md` (new `@tanstack/react-table` runtime dependency in the canopy
  dependency footprint) updated on completion.

### Out
- **Async / server-side** data (remote fetch, server sorting/pagination/filtering, loading state)
  - v1 operates over an in-memory `data` array; a `manual*` / async source is a clean follow-up.
- **Virtualization** for very large row counts - flat client rendering for v1; a virtualized body
  is deferred (TanStack Virtual composes cleanly later).
- **Column resizing, reordering (drag), pinning, and grouping/aggregation** - the extra TanStack
  features are deferred; v1 covers sorting, visibility, selection, pagination, and filter hooks.
- **A bespoke filter UI / faceted filter menus and a column-visibility dropdown menu** - v1 ships
  the state hooks and wires one global-filter story; the menu chrome (built from a future
  `DropdownMenu`) is a follow-up.
- **Editable cells / inline forms** - `DataTable` is read-and-select for v1.
- Changing `Table` (0059), `Pagination` (0047), `Empty` (0041), `Button`, or `Checkbox` -
  `DataTable` composes them unchanged; no unrelated component is touched.
- Introducing a second data-grid library or a second primitive family - v1 stays on
  `@tanstack/react-table` over the existing canopy primitives.

## Approach

**Primitive stack: `@tanstack/react-table` for data logic, canopy primitives for presentation.**
The grid splits cleanly into headless state and styled chrome, matching how shadcn ships its data
table. `@tanstack/react-table` is the de-facto headless table engine (framework-agnostic, no
markup, no styles): it owns the column model, sorting/visibility/selection/pagination/filter
**state and row models**, leaving rendering to us. That is a perfect fit for canopy, which already
owns the presentation via `Table` (0059) - `DataTable` renders TanStack's resolved header groups
and rows straight into `TableHeader` / `TableRow` / `TableHead` / `TableCell`, so it inherits the
0059 token borders, muted header, row hover, and `data-[state=selected]` styling for free rather
than restyling `<table>`.

**Two-layer surface (headless + styled), so callers compose at the level they need.**
- `useDataTable(options)` - the headless layer: a thin wrapper over `useReactTable` that pre-wires
  `getCoreRowModel`, `getSortedRowModel`, `getPaginationRowModel`, and `getFilteredRowModel`,
  applies canopy defaults, and returns the `table` instance plus convenience accessors for the
  sorting / visibility / selection / pagination / filter state. Each piece of state is uncontrolled
  by default and accepts a controlled `state` + `on*Change` pair (TanStack's own contract), so the
  canopy learning about controlled AND uncontrolled interactive components is honoured.
- `DataTable({ columns, data, ... })` - the styled layer: calls `useDataTable` internally (or
  accepts an externally-created `table` for advanced callers), then maps the result onto the 0059
  parts. `forwardRef` forwards to the underlying `Table`'s scroll container; native props spread;
  `className` merges caller-wins via `cn()`.

**Column conventions.** Callers pass ordinary TanStack `ColumnDef[]`. Canopy adds two helpers so
the common cases stay declarative without leaking styling into caller code: a **sortable header**
helper that renders a `ghost` `Button` toggling `column.toggleSorting()` with the directional glyph
and `aria-sort` on the `<th>`, and a **selection column** helper whose header cell is a select-all
`Checkbox` (bound to `table.getToggleAllRowsSelectedHandler()` / indeterminate when partial) and
whose body cell is a per-row `Checkbox` (bound to `row.getToggleSelectedHandler()`), each with an
accessible label. Selected rows set `data-state="selected"` on their `TableRow` so 0059's token
styling applies.

**Pagination + empty as slots.** The default pager is composed from `Pagination` (0047) and
`Button` (previous / next + page indicator), driven by `table.previousPage()` / `nextPage()` /
`getState().pagination`; callers can replace it via a `pager` slot or disable pagination entirely.
When `table.getRowModel().rows` is empty, the body renders a single `TableRow` with one
`TableCell` spanning all visible columns (`colSpan`) containing an `Empty` (0041) block; callers
override via an `emptyState` slot.

**Styling & recipe.** FULL LITERAL token utility strings on any chrome DataTable draws itself
(spanned empty row, pager layout), `cn()` merge, `forwardRef` + native prop spread, semantic
tokens only, `React.ComponentRef` for refs, no `dark:` on the common path - identical to 0005 and
0059. Because the chrome is assembled from existing canopy primitives, most tokens come through
those components; DataTable adds only layout utilities, kept as literals for the Tailwind v4
scanner.

**Accessibility.** Presentation stays on 0059's native table elements, so the native table roles
and screen-reader table navigation are inherited, not re-invented. Sortable headers add `aria-sort`
(`ascending` / `descending` / `none`) and an activatable `Button` control (click + keyboard).
Selection uses real canopy `Checkbox` controls: the header select-all is labelled (e.g.
`Select all rows`) and reflects an indeterminate state when partially selected; each row checkbox
is labelled. These promises are guarded by observable tests (roles present, `aria-sort` updates,
select-all toggles all rows, keyboard toggles sort), per the repo learning that a11y is proven by
outcomes, not scaffolding.

**Motion.** None beyond what the composed primitives already provide (e.g. `Button` states); no
new keyframes.

**Trade-offs.**
- *`@tanstack/react-table` vs hand-rolled state*: TanStack is a well-maintained, tree-shakeable,
  framework-agnostic engine that owns exactly the state canopy does not want to re-implement
  (sort/selection/pagination/filter), and it is styling-free so it never fights the token layer.
  The cost is one more runtime dependency on `@rogueoak/canopy`; it is externalized in the tsup
  build (not bundled) like the Radix and `cmdk` deps. **Security and architecture personas should
  weigh this new dependency in review** - it is the one non-trivial addition in this spec.
- *Headless hook + styled component vs styled-only*: shipping `useDataTable` alongside `DataTable`
  costs a slightly larger surface, but it lets advanced callers build custom chrome (their own
  toolbar, column menu, filter UI) without forking the component - and it is how the underlying
  library is meant to be consumed.
- *Client-side only for v1*: simpler, no loading states or server contract; large or remote
  datasets wait for the async follow-up. Flagged in the stories so it is not mistaken for complete.
- *Slots (pager, emptyState) vs hard-coded chrome*: slots keep DataTable flexible for real product
  layouts while giving sensible canopy defaults out of the box.

## Acceptance

- [ ] `DataTable` and `useDataTable` ship from `@rogueoak/canopy` (exported via
      `branches/index.ts`), built on `@tanstack/react-table` (added to `package.json`
      `dependencies` AND externalized in `tsup.config.ts`, with `pnpm install` run at the root);
      presentation composes `Table` (0059) and no `dark:` appears on the common path.
- [ ] **Sorting**: a sortable header renders an activatable `Button` control that cycles
      ascending / descending / unsorted; the `<th>` `aria-sort` reflects the current direction;
      sort works by click and keyboard; sorting is controllable and uncontrolled.
- [ ] **Column visibility**: `useDataTable` exposes visibility state/setters; a hidden column drops
      from both header and body in the rendered `DataTable`.
- [ ] **Row selection**: an opt-in selection column renders a labelled header select-all
      `Checkbox` (indeterminate when partial) and labelled per-row `Checkbox`es; toggling select-all
      selects/clears every row; selected rows carry `data-[state=selected]` (0059 selected styling)
      and the selected set is exposed.
- [ ] **Pagination**: the default pager (from `Pagination` (0047) / `Button`) advances and retreats
      the page and clamps at the first/last page; pagination can be disabled or replaced via slot.
- [ ] **Filtering hooks**: `useDataTable` surfaces column/global filter state + setters; a global-
      filter story narrows the visible rows.
- [ ] **Empty state**: with no rows to show, the body renders an `Empty` (0041) block in a single
      full-width spanned row (`colSpan` across visible columns), not an empty grid.
- [ ] a11y: native table roles inherited from 0059; sortable headers expose `aria-sort` and an
      activatable control; selection checkboxes are real, labelled `Checkbox` controls
      (select-all + per-row).
- [ ] Recipe obeyed: full literal semantic-token utilities on any self-drawn chrome, `cn()` merge
      (caller `className` wins), `forwardRef` + native prop spread, `React.ComponentRef` refs, no
      `dark:` on the common path.
- [ ] Storybook catalog entry with Playground, Sortable, Selectable, Paginated, ColumnVisibility,
      GlobalFilter, and Empty stories in both themes; `pnpm storybook` build is green.
- [ ] Tests cover: renders through 0059 parts with native table roles; sort toggle + `aria-sort`
      (click and keyboard); hidden column drops out; select-all toggles all rows + selected-row
      state; per-row selection toggles one row; pagination advances/retreats/clamps; empty data
      renders the spanned `Empty` row; controlled + uncontrolled sorting/selection; `className`
      merge; ref forwarding. `pnpm test` / `lint` / `build` pass from the root.
- [ ] Canopy `README.md` component list includes DataTable; `overview/features.md` (new data-grid
      capability) and `overview/architecture.md` (new `@tanstack/react-table` runtime dependency in
      the canopy dependency footprint) updated on completion.
