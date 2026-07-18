# 0059 - table

## Problem

Canopy has no way to render tabular data. Consumers who need to show rows and columns - a
settings list, an invoice breakdown, an admin listing - have to hand-roll raw `<table>` markup
and re-apply borders, spacing, header contrast, and row hover every time, which drifts from the
token layer and reads inconsistently across surfaces. The design system exists to own that
presentation once.

This is a **presentational** primitive: styled semantic table parts with no data logic (no
sorting, no pagination, no selection, no virtualization). It fills the shadcn gap for a plain
`Table` and, critically, becomes the styling **foundation for `DataTable` (0064)** - the future
stateful, headless-data-driven grid - which will compose these parts rather than restyle
`<table>` from scratch. It sits alongside the other layout/content Branches (`Tabs` (0051),
`Item` (0042), `Empty` (0041)) as the structured-content primitive the catalogue is missing.

This is for any product surface that presents rows of records and wants them to match the rest
of the canopy system - light and dark - without bespoke CSS.

## Outcome

- A new canopy component family, `Table`, exported from `@rogueoak/canopy/branches`, that renders
  **native semantic table elements** styled with the 0005 recipe. Parts: `Table` (a `<table>`
  wrapped in a horizontally scrollable container so wide tables overflow gracefully),
  `TableHeader` (`<thead>`), `TableBody` (`<tbody>`), `TableFooter` (`<tfoot>`), `TableRow`
  (`<tr>`), `TableHead` (`<th>`), `TableCell` (`<td>`), and `TableCaption` (`<caption>`).
- **Semantics + a11y**: parts render real table elements, so the native `table` / `rowgroup` /
  `row` / `columnheader` / `cell` roles and screen-reader table navigation come for free;
  `TableCaption` provides an accessible name for the table. No ARIA is invented on top of what
  the native elements already provide.
- **Theming**: token borders (`border-border` row separators), a **muted header row**
  (`text-text-muted`, medium weight), and **row hover** (`hover:bg-muted`) plus a
  `data-[state=selected]` selected-row style so a future `DataTable` can drive selection through
  the same tokens. Styled with semantic-token Tailwind utilities, `cn()` merge, `forwardRef` +
  native prop spread, so it themes light/dark through the token layer with **no `dark:` on the
  common path**.
- **Composition**: each part is a thin `forwardRef` wrapper that spreads native props and merges
  `className` (caller wins), so callers write ordinary table markup (`Table > TableHeader >
  TableRow > TableHead`, `TableBody > TableRow > TableCell`) and get canopy styling.
- **Docs**: a Storybook catalog entry with a basic table, a table with caption and footer, and a
  wide/overflow-scroll story - light and dark; canopy `README.md` component list and the
  `overview/` living docs updated on completion.

## Scope

### In
- `packages/canopy/src/branches/Table.tsx` (+ `Table.test.tsx`) - the eight presentational parts,
  each a `forwardRef` wrapper over its native element with full literal token classes.
- Barrel export of every part and its props type from
  `packages/canopy/src/branches/index.ts`.
- `Table` renders `<table>` inside a `<div>` with `overflow-x-auto` (and forwards `ref` to the
  `<table>`) so wide content scrolls rather than breaking layout.
- Token styling: `border-border` separators, muted header (`text-text-muted`), row
  `hover:bg-muted`, `data-[state=selected]:bg-muted` selected-row hook, aligned cell padding, and
  `TableCaption` in `text-text-muted` `text-caption`.
- **No new runtime dependency** - pure native elements + `cva`/`cn`, so no `package.json` /
  `tsup.config.ts` external changes.
- Storybook story `apps/storybook/src/Table.stories.tsx` importing from
  `@rogueoak/canopy/branches`: Playground (basic), WithCaptionAndFooter, Overflow (wide table
  scrolls) - each rendering light and dark from the toolbar (no per-story theme code).
- Tests: renders a `table` with the correct native roles; `TableHead` renders `columnheader` and
  `TableCell` renders `cell`; `TableCaption` names the table; each part forwards `ref` and spreads
  native props; `className` merges with caller winning; the wrapper applies `overflow-x-auto`
  around the table (asserted via an observable outcome, not a class-only check where a role suffices).
- Canopy `README.md` component list + `overview/features.md` and `overview/architecture.md`
  updated on completion.

### Out
- **Data logic** - sorting, filtering, pagination, row selection state, column resizing,
  virtualization: all belong to `DataTable` (0064), which will compose these parts. This spec is
  presentational only.
- **Sticky header / sticky first column** - deferred; can be added later as opt-in props or left
  to `DataTable`.
- **Responsive card/stacked collapse** on small screens - out of scope; v1 relies on horizontal
  overflow scroll.
- Changing any unrelated component - `Table` is purely additive.

## Approach

**Primitive stack: native HTML table elements + the 0005 recipe.** There is no interaction state
and no portal here, so no Radix primitive is warranted; the parts are plain `<table>`, `<thead>`,
`<tbody>`, `<tfoot>`, `<tr>`, `<th>`, `<td>`, `<caption>` wrappers. Native elements give the
correct implicit ARIA roles and screen-reader table semantics for free, which is why they are
preferred over `div`-with-`role` scaffolding. **No new dependency** is introduced.

**Layer placement.** `Table` is a **Branch**: it is a multi-part family composed from several
styled parts that callers assemble, and it is the foundation the stateful `DataTable` (0064)
Branch will build on, so it lives with the other structured-content Branches rather than as a
single Seed atom. It imports nothing upward (Branches -> Twigs -> Seeds only).

**Part surface (mirrors the shadcn table, canopy-styled).**
- `Table` - wraps `<table>` in a `<div className="relative w-full overflow-x-auto">`; the
  `<table>` itself is `w-full caption-bottom text-body-sm text-text`; `ref` forwards to the
  `<table>`.
- `TableHeader` (`<thead>`) - bottom-bordered header group (`[&_tr]:border-b border-border`).
- `TableBody` (`<tbody>`) - removes the trailing row border (`[&_tr:last-child]:border-0`).
- `TableFooter` (`<tfoot>`) - muted footer band (`bg-muted font-medium text-text`,
  top border).
- `TableRow` (`<tr>`) - `border-b border-border transition-colors hover:bg-muted
  data-[state=selected]:bg-muted` (the `data-[state=selected]` hook lets `DataTable` mark
  selected rows through the same token, no new API here).
- `TableHead` (`<th>`) - left-aligned, `text-label`/medium, `text-text-muted`, cell padding
  (`h-10 px-2 text-left align-middle`), with the checkbox-column spacing helper shadcn uses.
- `TableCell` (`<td>`) - `px-2 py-2 align-middle text-text`, matching header padding.
- `TableCaption` - `mt-4 text-caption text-text-muted`.

**Styling & recipe.** FULL LITERAL token-utility strings on every part (so Tailwind v4's scanner
emits each class - no dynamic class names), `cn()` merge with caller `className` winning,
`forwardRef` on every part with a native prop spread, and **no `dark:` on the common path** -
light/dark is a token-layer property. Row hover uses `bg-muted` (this is inline content, not a
portalled raised surface, so `bg-muted` is correct rather than `bg-muted-raised`). Semantic
tokens only - no palette utilities. `React.ComponentRef`-style typing conventions per the repo
learnings; each part's props are the native element attributes (e.g.
`React.ThHTMLAttributes<HTMLTableCellElement>`).

**Accessibility.** The native elements supply `table` / `rowgroup` / `row` / `columnheader` /
`cell` roles and caption-as-name without extra ARIA; this is guarded by **observable tests**
(roles present, caption names the table) rather than class assertions, per the repo learning that
a11y is proven by outcomes. No focus/keyboard behaviour is added at this layer (the table is not
interactive); any keyboard affordances arrive with `DataTable`.

**Motion.** Only `transition-colors` on row hover - a cheap color transition, no keyframes, so no
motion-token or `motion-reduce` gating is required.

**Trade-offs.**
- *Native `<table>` vs a `div` grid*: native elements win on built-in a11y and screen-reader
  navigation; the cost is that CSS layout is table-layout rather than flexbox, which is exactly
  what we want for tabular data. Accepted.
- *Presentational-only vs shipping data features now*: keeping this layer pure makes it a stable
  base for `DataTable` (0064) and keeps the surface tiny; data behaviour is deferred by design,
  not omission.
- *No new dependency*: nothing to review for security/architecture - the component reuses
  canopy's existing `cva`/`cn` foundation only.

## Acceptance

- [ ] `Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`,
      and `TableCaption` (and their props types) ship from `@rogueoak/canopy/branches` via
      `branches/index.ts`; no new runtime dependency added.
- [ ] Recipe obeyed: full literal token-utility classes, `cn()` merge (caller `className` wins),
      `forwardRef` + native prop spread on every part, semantic tokens only, **no `dark:` on the
      common path**; renders correctly light **and** dark.
- [ ] `Table` wraps its `<table>` in an `overflow-x-auto` container so wide tables scroll instead
      of breaking layout; `ref` forwards to the `<table>`.
- [ ] Token styling present: `border-border` row separators, muted header (`text-text-muted`),
      row `hover:bg-muted`, and a `data-[state=selected]` selected-row style; `TableCaption`
      renders muted caption text.
- [ ] a11y: native `table` / `rowgroup` / `row` / `columnheader` / `cell` roles are present and
      `TableCaption` provides the table's accessible name - proven by observable tests, not
      class-only assertions.
- [ ] No interactive/disabled/invalid state at this layer (presentational only); those are
      explicitly deferred to `DataTable` (0064).
- [ ] Storybook catalog entry with basic, caption-plus-footer, and overflow/wide-scroll stories,
      each rendering light and dark from the toolbar; `pnpm storybook` build is green.
- [ ] Tests cover: correct native roles, `columnheader`/`cell` rendering, caption names the
      table, `ref` forwarding and native prop spread on each part, `className` merge with caller
      winning, and the overflow wrapper. `pnpm test` / `lint` / `build` all pass from the root.
- [ ] Canopy `README.md` component list includes Table; `overview/features.md` (new
      structured-content capability) and `overview/architecture.md` (Table as the presentational
      foundation for the future `DataTable` (0064), no new dependency) updated on completion.
