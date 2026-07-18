# 0060 - Calendar

## Problem

Canopy has form fields (`Input` 0002, `Select` 0013, `Combobox` 0030) but no way to **pick a
date from a month grid**. Any surface that needs a date today has to fall back to a raw
`<input type="date">` (inconsistent, unstyleable, no range or multi-date support) or hand-roll a
month grid - re-implementing month math, week layout, keyboard navigation, disabled-date logic,
and range selection every time. That grid is exactly the kind of primitive the design system
should own once.

`Calendar` is the standalone date-grid: a themed month view with single, range, and multiple
selection, month navigation, disabled dates, and full keyboard support. It is the direct
foundation for the popover-backed **`DatePicker`** (0060's sibling, spec 0065), the same way the
raw grid underpins the shadcn calendar/date-picker pair. shadcn ships this on
`react-day-picker`; canopy has no equivalent, so `DatePicker` cannot be built until the grid
exists. This spec builds the grid; 0065 wraps it in a field + popover.

This is for scheduling, filtering by date range, booking, and any "choose a day" surface.

## Outcome

- A new canopy Branch, `Calendar`, exported from `@rogueoak/canopy/branches`, that renders an
  accessible month grid on `react-day-picker` v9 (which uses `date-fns` for date math).
- **Selection modes**: `single` (one day), `range` (a start/end span with the in-between days
  highlighted), and `multiple` (a set of independent days) - selected via the standard
  react-day-picker `mode` + `selected` / `onSelect` API, so the value shape follows `mode`.
- **Navigation**: previous / next month buttons (styled with canopy `Button`'s outline/icon
  idiom) and a month caption; disabled dates (`disabled` matcher) render inert and are not
  selectable.
- **States, themed with tokens**: the selected day uses `bg-primary` / `text-primary-foreground`;
  **today** carries a `ring` marker; days **outside** the visible month are `text-text-muted`;
  disabled days use the toggle-style `opacity-50` + `cursor-not-allowed` idiom; the focused day
  takes the shared focus-visible ring.
- **A11y / roles**: react-day-picker emits the `grid` / `gridcell` roles, a labelled month
  caption, and `aria-selected` / `aria-disabled` on days; full keyboard operation (arrow keys
  move by day, PageUp/PageDown by month, Home/End, Enter/Space selects), guarded by observable
  tests.
- **Theming**: built to the 0005 recipe - full literal semantic-token utility strings mapped
  through react-day-picker's `classNames`, `cn()` merge (caller `className` wins), `forwardRef`
  + native prop spread, semantic tokens only, **no `dark:` on the common path** - so it themes
  light/dark through the token layer.
- **Docs**: a Storybook catalog entry (single, range, multiple, disabled-dates, both themes);
  canopy README component list and the `overview/` living docs updated on completion.

## Scope

### In

- `packages/canopy/src/branches/Calendar.tsx` (+ `Calendar.test.tsx`) - the component, exported
  from `packages/canopy/src/branches/index.ts` (`export { Calendar }` +
  `export type { CalendarProps }`).
- All three react-day-picker selection **modes** (`single`, `range`, `multiple`) surfaced
  through the component's props (the `DayPicker` `mode` / `selected` / `onSelect` API is passed
  through; value shape follows `mode`), plus month navigation and the `disabled` matcher.
- Token-mapped styling via react-day-picker's `classNames`/`modifiersClassNames`: selected =
  `bg-primary text-primary-foreground`, today = `ring` marker, outside = `text-text-muted`,
  disabled = `opacity-50 cursor-not-allowed`, focus = shared focus-visible ring; nav buttons
  reuse `Button` (0005) styling (outline/ghost icon buttons with the chevron icons already used
  elsewhere in canopy).
- Two new runtime **dependencies** on `@rogueoak/canopy`: **`react-day-picker`** (the date-grid
  engine, v9) and **`date-fns`** (its date-math peer). Both added to
  `packages/canopy/package.json` `dependencies` **and** externalized in
  `packages/canopy/tsup.config.ts` `external: [...]` (per the canopy externalization rule),
  then `pnpm install` at the repo root.
- Storybook stories in `apps/storybook/src/Calendar.stories.tsx`: Playground, Single, Range,
  Multiple, DisabledDates, and a both-themes view (theme via the toolbar, not per-story).
- Tests: renders a month `grid` with `gridcell` days; single-select sets/reports the day;
  range-select reports start/end; multiple-select toggles days in the set; next/prev buttons
  change the month; a `disabled` day is inert (not selectable, `aria-disabled`); keyboard
  (arrow navigation + Enter/Space select) works; controlled and uncontrolled selection; caller
  `className` merges (caller wins).
- Canopy `README.md` component list, `overview/features.md` (new capability),
  `overview/architecture.md` (the new `react-day-picker` + `date-fns` primitives in the canopy
  dependency footprint) updated on completion.

### Out

- **`DatePicker`** - the field-trigger + popover wrapper that opens this Calendar - is the
  separate sibling spec **0065**; this spec ships only the standalone grid.
- **Time selection** (hour/minute), **date-time**, and locale/format configuration beyond
  react-day-picker's defaults - deferred; the grid takes react-day-picker's locale prop through
  but v1 documents only the default.
- **Multi-month display**, dropdown month/year navigation, and week-number columns -
  react-day-picker supports these; v1 renders a single month with button navigation and defers
  the extras to a follow-up.
- Changing any existing component (`Input`, `Select`, `Combobox`, `Button`); Calendar is
  additive and only **reuses** `Button` styling.
- Introducing a second date engine or a custom date-math layer - v1 stays on
  react-day-picker + date-fns (decision recorded below).

## Approach

**Primitive stack: react-day-picker v9 (+ date-fns), styled with the 0005 recipe.** canopy owns
no calendar/date math, and building month/week/leap-year/range logic by hand is exactly the
error-prone work a dependency should absorb. react-day-picker v9 is the de-facto React date-grid
(what shadcn's calendar wraps): it ships the month grid, all three selection modes, the
`disabled` matcher, month navigation, and complete keyboard + ARIA behaviour, and delegates date
math to **`date-fns`**. We wrap `DayPicker` rather than re-implement it, and skin it entirely
through its `classNames` / `modifiersClassNames` maps with **full literal** semantic-token
utility strings (so Tailwind v4's scanner emits each), `cn()` to merge the caller `className`
(caller wins), `forwardRef` to the root with a native prop spread, `React.ComponentRef` for the
ref type, and **no `dark:` on the common path** - light/dark is a token-layer property, identical
to 0005/0030. Both `react-day-picker` and `date-fns` are added as runtime **dependencies** and
**externalized in `tsup.config.ts`** exactly like the Radix deps and `cmdk`, so the consumer
installs one copy.

**Part surface.** A single component (react-day-picker owns the internal grid parts, so no canopy
sub-parts are exported):
- `Calendar` - the root. Its props are `DayPicker`'s props (`mode`, `selected`, `onSelect`,
  `disabled`, `defaultMonth`, `numberOfMonths` left at 1 for v1, etc.) plus `className`; the
  value shape follows `mode` (single `Date`, range `{ from, to }`, multiple `Date[]`), which is
  react-day-picker's own discriminated typing carried straight through. Selection is thus both
  **controlled** (`selected` + `onSelect`) and **uncontrolled** (react-day-picker's internal
  state), matching the repo rule that interactive components support both.

**Styling map (token vocabulary only).**
- day base: neutral text, rounded, `hover:bg-muted`, shared `focus-visible:` ring.
- selected day: `bg-primary text-primary-foreground` (and range endpoints; the in-range span
  uses a muted fill so the endpoints stay primary).
- today: a `ring` marker (ring token) so the current day reads even when unselected.
- outside days: `text-text-muted`.
- disabled days: `opacity-50 cursor-not-allowed` (the toggle-style disabled idiom, since a day
  is a toggle, not a field - matches the Checkbox/Switch/Radio rule in the recipe).
- nav buttons: canopy `Button` outline/ghost icon styling with the existing chevron icons.

**Accessibility.** react-day-picker supplies the `grid`/`gridcell` roles, the labelled month
caption, `aria-selected`/`aria-disabled` on days, and the arrow/PageUp/PageDown/Home/End/Enter
keyboard model. We add a labelled previous/next button pair and guard every a11y promise with
**observable** tests (grid + gridcells render, a disabled day is `aria-disabled` and not
selectable, keyboard navigation + Enter/Space select fire `onSelect`), per the repo learning that
a11y is proven by outcomes, not by asserting a class exists.

**Motion.** None beyond react-day-picker's default (no custom keyframes); the focus ring and
hover are static token utilities.

**Trade-offs.**
- *react-day-picker + date-fns vs hand-rolled grid*: two more runtime deps on canopy, but both
  are small, ubiquitous, well-audited, and exactly the missing primitive; hand-rolling date math
  would be far more code to own and test. The new-dependency surface (two packages) should be
  weighed by the **security** and **architecture** review personas.
- *react-day-picker's own value typing (mode-discriminated) vs a canopy-normalized value*: we
  pass react-day-picker's typing straight through so the API matches its well-known docs, at the
  cost of the value shape being mode-dependent (documented, and the standard react-day-picker
  contract).
- *Single month, button nav for v1*: keeps the surface small and the styling map tight;
  multi-month, dropdown nav, and week numbers are deferred (react-day-picker supports them when
  wanted).

## Acceptance

- [ ] `Calendar` (and `CalendarProps`) ship from `@rogueoak/canopy/branches` (exported via
      `branches/index.ts`), built on `react-day-picker` v9 + `date-fns`, both added to
      `packages/canopy/package.json` `dependencies` **and** externalized in
      `packages/canopy/tsup.config.ts`; `pnpm install` run at the root.
- [ ] Recipe obeyed: styling is full literal semantic-token utility strings mapped through
      react-day-picker's `classNames`/`modifiersClassNames`, `cn()` merges caller `className`
      (caller wins), `forwardRef` + native prop spread, `React.ComponentRef` ref type, **no
      `dark:` on the common path** - themes light **and** dark through the token layer.
- [ ] **Single** mode selects one day; **range** mode reports a `{ from, to }` span with the
      in-between days highlighted; **multiple** mode toggles days in a set. Controlled
      (`selected`/`onSelect`) and uncontrolled selection both work.
- [ ] Previous / next month buttons (canopy `Button` styling) navigate the month; the selected
      day uses `bg-primary text-primary-foreground`, today shows the `ring` marker, outside days
      are `text-text-muted`.
- [ ] **Disabled dates** (`disabled` matcher) render inert with `opacity-50 cursor-not-allowed`,
      are `aria-disabled`, and cannot be selected.
- [ ] A11y / keyboard: month renders with `grid` + `gridcell` roles and a labelled caption; arrow
      keys move by day, Enter/Space selects; guarded by observable tests.
- [ ] Storybook catalog entry (`apps/storybook/src/Calendar.stories.tsx`) with Playground,
      Single, Range, Multiple, and DisabledDates stories in both themes; `pnpm storybook` build
      is green.
- [ ] Tests cover: month grid + gridcells render; single sets day; range reports start/end;
      multiple toggles set; next/prev change month; disabled day inert + `aria-disabled`;
      keyboard navigation + Enter/Space select; controlled and uncontrolled; `className` merge.
- [ ] `pnpm test` / `pnpm lint` / `pnpm build` pass from the root.
- [ ] Canopy `README.md` component list includes Calendar; `overview/features.md` (new date-grid
      capability) and `overview/architecture.md` (new `react-day-picker` + `date-fns` primitives
      in the canopy dependency footprint) updated on completion.
