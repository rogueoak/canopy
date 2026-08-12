# 0073 - PartialDatePicker

**Follow-on to [0065 - DatePicker](0065-date-picker.md).** 0065 is not changed by this spec and
keeps its exact public API. This one adds what 0065 deliberately left out: a value that can be less
precise than a day, and typing. Read 0065 first; everything below assumes it.

## Problem

`DatePicker` (0065) is built on `Calendar` (0060), which is built on `react-day-picker`, whose
selection value is a `Date`. A `Date` is always a specific day. That is the right shape for a due
date or a booking, and it cannot represent what somebody remembers.

A family archive is the case in point. Famlistry records an account's birthday and a story's "when
it happened", and what somebody actually knows is uneven: `1968`, `1968-05`, `1968-05-14` are all
real answers. A year-only answer must never quietly become 1 January 1968 - inventing a day states
a false fact about somebody's grandmother, and once it is in the archive nobody can tell it was
invented. That is why a native `<input type="date">` was rejected there, and it rules out `0065`
for the same reason: both can only say a full day, so both force the lie.

So those two fields are still plain text inputs, and the owner has asked for a real picker.

Two things 0065 leaves out, and this spec picks up:

1. **A value less precise than a day.** Not "a day plus a precision flag beside it" - two fields to
   keep in step drift, and the invented day is still sitting there to be read by accident.
2. **Typing.** 0065's Out list names masked text entry explicitly. Its trigger is a `button`, so
   the text input a consumer is replacing gets *worse* at the thing it was good at: somebody who
   knows the date types it faster than they can click it.

This is for any surface that records something remembered rather than scheduled: birth and death
dates, a photo's date, when you joined, a historical event, an approximate start date on a CV.

## Outcome

- A new Branch, `PartialDatePicker`, exported from `@rogueoak/canopy/branches` alongside
  `DatePicker`, whose value is an **ISO 8601 reduced-precision date string** - exactly `YYYY`,
  `YYYY-MM`, or `YYYY-MM-DD`, and nothing else.

- **`DatePicker` (0065) and `Calendar` (0060) are untouched.** Same props, same `Date` value, same
  behaviour, same tests. A consumer picking an ordinary day keeps its exact API and notices
  nothing.

- **Precision is where you stop.** The popover opens on a grid of years. Tapping a year sets the
  value to `1968` and moves on to that year's months; tapping a month refines it to `1968-05` and
  moves on to that month's days; tapping a day refines it to `1968-05-14` and closes. Every tap is
  already a complete, valid answer, so a year-only date is expressed by choosing a year and
  stopping - no checkbox, no precision select, and no way to end up with a day nobody chose. Going
  back up and re-picking truncates: with `1968-05-14` set, picking `1968` again returns the value
  to `1968`.

- **The day level is `Calendar` (0060) itself**, not a second day grid. Its month grid, keyboard
  model, month navigation, `today` marker, disabled-day matchers and theming are reused as-is.

- **Typing stays first-class.** The field is a real text input. Input is lenient (`1968-5-4`,
  `1968/05/14`, surrounding spaces all normalize); output is always canonical. A two-digit year is
  refused rather than guessed - inventing a century is the same mistake as inventing a day.

- **Keyboard and screen reader.** The day level inherits `Calendar`'s grid keyboard model. The year
  and month grids follow the same APG rules: arrows, Home/End on the row, PageUp/PageDown for the
  enclosing period, Enter/Space, Escape. One always-mounted live region announces the selection
  with its precision ("1968, year only").

- **Usable with a thumb.** 44px cells on phones, no iOS auto-zoom on the field, and the year grid
  puts a year-only answer one tap from open.

- **Empty is a legitimate state.** No value renders the placeholder; `Clear` returns to empty.

- **Bounds are expressed, not just enforced.** `min` / `max` take partial dates, and out-of-range
  years, months and days render unavailable rather than being refused after the fact. The day level
  passes them to `Calendar` as `startMonth` / `endMonth` / `disabled`.

- **The parser ships with it, on its own entry.** `parsePartialDate`, `normalizePartialDate`,
  `formatPartialDate`, `formatPartialDateParts` and `isPartialDateWithin` ship from
  `@rogueoak/canopy/partial-date` - React-free and dependency-free, because the whole point is that
  a consumer's **server** shares them with the UI, and reaching them through `./branches` would
  evaluate the entire organism layer to get at a regex. They are re-exported from `./branches` too,
  for UI code that is importing the component anyway.

## Scope

### In

- `packages/canopy/src/lib/partialDate.ts` (+ test) - the format: parse, normalize, format for
  humans, range containment. Pure functions, no React, no `Date` in any parsing path. Shipped as
  its own `./partial-date` package export.
- `packages/canopy/src/branches/PartialDatePicker.tsx` (+ test) - the component, exported from the
  Branch barrel with the four helpers and their types.
- A year grid (a page of 20) and a month grid (12), hand-rolled because nothing in the system has
  them; the day level composes `Calendar` (0060).
- The field: `InputGroup` (0044) + `InputGroupInput` + `InputGroupButton`, in a Radix Popover.
- Controlled (`value` / `onValueChange`) and uncontrolled (`defaultValue`); `min` / `max`;
  `disabled`, `aria-invalid`, `clearable`, `defaultView`, `size`, `locale`, and defaulted props for
  every user-facing string.
- Storybook catalog entry and README / living-doc updates.

### Out

- **Any change to `DatePicker` (0065) or `Calendar` (0060).** Additive only. `Calendar` is consumed
  through its existing public props; nothing is added to it.
- **Time of day, and time zones.** The value is a calendar date to a precision. It names no
  instant, so there is nothing to convert.
- **Ranges and multiple dates.** One partial date. 0065 owns ranges of full days; a range of
  partial dates is a different value shape and a different spec.
- **Eras, circa, decades.** `1960s`, `c. 1968`, `before 1970` are real archival answers and none of
  them is ISO 8601. The wire format is the three shapes and nothing else.
- **A new dependency.** `date-fns` is deliberately not used for the value: it works in `Date`,
  which is exactly what must not touch a partial date. The arithmetic here is a leap-year rule and
  tuple comparison; the prose formatting is `Intl`.

## Approach

**Compose, do not fork - and the seam is the value type.** The reason this is a second component
rather than a `precision` mode on 0065 is that `mode` there already means *cardinality*
(`single` | `range`). Adding precision behind the same prop makes one prop mean two unrelated
things and puts a second value type behind the same `value`, turning 0065's props into a three-way
discriminated union: every existing caller's inference changes and the union leaks into its
published types, for a feature they did not ask for. A `Date`-valued picker and a string-valued
partial-date picker are different contracts, so they are different components - and the way to
guarantee the common case does not get worse is to not touch the file.

What is *not* duplicated is the hard part. The day level renders `<Calendar>` driven by its
existing `month` / `onMonthChange` / `selected` / `onSelect` / `startMonth` / `endMonth` /
`disabled` props, so the day grid, its roving-tabindex keyboard model, its month navigation, its
`today` marker and its whole theme come from 0060 unchanged. Only the year and month grids are new,
because nothing in the system has them: `react-day-picker`'s `captionLayout="dropdown"` navigates
but cannot *commit*, and "navigate here, then press a separate button to mean it" is the bolted-on
precision control this spec exists to avoid.

**The value is a string, and it is the wire format.** `YYYY`, `YYYY-MM`, `YYYY-MM-DD`. Not a `Date`
(always a full instant), not `{ date, precision }` (two fields to keep in step, and the day is
still there to be read by accident). The string carries its precision in its length, so there is no
second field to drift and nothing to read that was never given. It is also directly storable and
directly comparable as text within a precision.

**No `Date` in the parsing path, ever.** `new Date('1974-06')` is read as UTC midnight and rendered
in local time, so west of Greenwich it is **May**. The consuming product shipped that exact bug.
Every field is read from its own digits: a strict regex, integer fields, a leap-year rule for month
lengths, tuple comparison for ordering. `Date` exists in exactly one place - the bridge to
`Calendar`, which needs one - and it is only ever built from local calendar *fields*
(`new Date(year, month - 1, day)`) and read back with `getFullYear` / `getMonth` / `getDate`. A
string is never parsed into a `Date` and a `Date` is never serialized into the value. A test pins
this by mutating `process.env.TZ` to a negative-offset zone, asserting the trap is live there
(`new Date('1974-06').getMonth() === 4`), and asserting the parser and the round trip still say
June.

**Precision is where you stop - the zoom stack.** Three levels over one panel: years (a page of 20,
4x5), months (12, 3x4), days (`Calendar`). Selecting at any level **commits that level's
precision** and descends one; only a day, having nothing left to refine, closes the popover. This
is the whole design decision. The alternative - a precision control beside a day picker - makes the
honest answer the awkward one, and a UI that makes honesty awkward gets lied to. Truncation falls
out for free: zoom back out, re-pick the year, and the value is a year again, so a mistake at day
precision is one tap from repair rather than stuck.

The panel carries a permanent one-line hint, because "stop whenever you like" is not something a
calendar grid has ever meant before. Opening on the **year** view rather than the current month is
the other half of the same argument: it puts the coarsest answer first instead of burying it three
taps deep. `defaultView` lets a consumer whose dates are usually recent start on days.

**Typing and picking are one field.** The field is the `InputGroup` Twig (0044) - a real `Input`
with a flush calendar button - so it inherits the field frame, the `focus-within` ring, the shared
disabled tokens, the `aria-invalid` danger overrides and the >=16px mobile font size, and reads
identically to every other Canopy field. The input holds the **wire text**, not prose: `1968-05` is
what you type, what you see, and what is stored, so the difference between `1968` and `1968-05`
stays visible. `formatPartialDate` is exported for consumers who want prose elsewhere.

The text is a draft and the value is what the draft parses to. Every keystroke that parses and is
in range emits; a draft that does not is worth `undefined`, because a field that no longer names a
date should not leave a stale one in the parent's state. Nothing is marked invalid **while typing**
- `1968-` is a legitimate halfway house - so the message is raised on blur and cleared on the next
keystroke. Draft and value are reconciled during render against the last-seen prop, so a controlled
parent echoing a value back never clobbers lenient text mid-edit.

**Bounds are an interval overlap, not a point comparison.** A partial date denotes an interval:
`1968` is the whole of 1968. So `max="2026-08-11"` must still admit `2026` - the year 2026 has
partly happened, and saying "2026" claims nothing about a future day - while refusing `2027` and
`2026-09`. The rule is `value.end >= min.start && value.start <= max.end`, and one function drives
the disabled state of every year and month cell, the header's step buttons, the `startMonth` /
`endMonth` / `disabled` handed to `Calendar`, and the check on typed text. Exporting it is the
point: the consumer's server refuses a future memory date with the same function the grid greys it
out with, instead of a second implementation that disagrees about 2026.

**Composing on a raised surface.** `Calendar` is tuned for the page canvas, so dropping it into a
portalled panel means the composing component re-points every token defined *relative to the
background*: `hover:bg-muted` is darker than `surface-raised` in dark and would make a hovered day
recede while a hovered year lifts, and `ring-offset-ring-offset` draws the page-canvas halo inside a
raised card. Both are corrected through `Calendar`'s public `classNames` (which replaces rather than
merges), along with the 44px phone target the hand-rolled grids use, so touch scale does not change
between levels. Composing also means inheriting the library's ARIA: `react-day-picker`'s month
caption is itself a `role="status"` live region, so it is **removed** through the `components` slot
rather than hidden with a class - a `display:none` node stays in the tree and whether it announces
would then depend on a stylesheet.

**Accessibility.** The day level is `Calendar`'s grid, unchanged. The year and month grids follow
the same APG rules on a real `<table role="grid">`: roving tabindex, arrows within, Home/End for
the row, PageUp/PageDown for the enclosing period, Enter/Space to select, Escape to close. Two
documented deviations. (1) APG describes one month grid; here PageUp/PageDown means "the period one
level up" at each level. (2) APG returns focus to the button that opened the dialog; this returns
it to the **text input**, because typing is a first-class path and dropping the caret back in the
field is what lets somebody correct a pick by typing. Out-of-range cells take `aria-disabled` and
ignore activation rather than the `disabled` attribute, so they stay reachable for exploration and
never drop focus. One always-mounted live region carries both the selection announcement
(`sr-only`) and the validation message (visible, danger) - one message, one element.

**Trade-offs.**

- *A second component rather than a mode on 0065.* Two date pickers in the catalog is a real cost:
  a consumer has to choose. The naming carries it (`DatePicker` for a day, `PartialDatePicker` for
  a date somebody remembers) and the README says which is which. The alternative costs every
  existing 0065 caller a type change for a feature they did not ask for.
- *Auto-advance after picking a year.* Descending on every pick risks reading as "that was not
  enough". Standing still is worse: the user would have to find a "narrow this" control, and the
  common case (knowing more than the year) would cost an extra interaction. The value is committed
  before the descent, and the hint says stopping is fine.
- *A string value, not a typed object.* Stringly-typed, and uncheckable by the compiler. It is also
  the wire format, so there is no serialization step, no impedance mismatch with a database column,
  and no chance of a component-shaped object leaking into storage. `parsePartialDate` gives the
  typed view where one is wanted.
- *Two grid idioms in one panel.* The year and month grids are hand-rolled while the day grid is
  `react-day-picker`'s. They are styled from the same tokens and sized on the same scale, but they
  are not the same code, so a future restyle has two places to touch. Accepted: the alternative is
  either forking `Calendar` or shipping a precision control instead of a zoom stack.

## Acceptance

- [ ] `DatePicker` (0065) and `Calendar` (0060) source, props and tests are **unchanged** by this
      PR, proved by the diff.
- [ ] `PartialDatePicker` ships from `@rogueoak/canopy/branches`; the format ships from
      `@rogueoak/canopy/partial-date` (React-free, dependency-free) and is re-exported from
      `./branches`. No new dependency and no new `tsup` external.
- [ ] The composed `Calendar` is re-pointed for the raised surface (interaction fill, ring offset)
      and the panel carries exactly one live region at every level.
- [ ] The day level renders `Calendar` (0060), driven by its existing public props.
- [ ] The value is only ever `YYYY`, `YYYY-MM`, `YYYY-MM-DD` or `undefined` - proved by a test
      driving every path that can emit (typing, each of the three levels, clear).
- [ ] Picking a year emits `YYYY` and descends to months; a month emits `YYYY-MM` and descends to
      days; a day emits `YYYY-MM-DD` and closes. Re-picking a year after a day truncates to `YYYY`.
- [ ] Typing `1968`, `1968-05`, `1968-05-14` each set the value; `1968-5-4` and `1968/05/14`
      normalize; `68`, `1968-13`, `1969-02-29`, `1968-05-32` do not, and raise the message on blur
      rather than during typing.
- [ ] No parsing path calls `Date`, pinned by tests that mutate `process.env.TZ` and assert the
      trap is **live** in that zone before asserting the code is not fooled - for the parser, and
      for the `Calendar` round trip driven end to end, once westward and once eastward (CI runs in
      UTC, where local and UTC fields are identical and the bug would be invisible).
- [ ] Early years the four-digit format admits (`0079`) survive the `Date` bridge, which remaps
      years 0-99 onto 1900-1999 unless the year is set explicitly.
- [ ] `min` / `max` accept partial dates with interval-overlap semantics (`max="2026-08-11"` admits
      `2026`, refuses `2027`); out-of-range years and months are `aria-disabled` and ignore
      activation; the day level receives `startMonth` / `endMonth`; header step buttons disable at
      the bounds.
- [ ] Keyboard: arrows, Home/End, PageUp/PageDown and Enter/Space operate the year and month grids;
      Escape closes and returns focus to the text input; ArrowDown from the input opens the panel
      and moves focus into the grid; roving tabindex keeps exactly one cell tabbable.
- [ ] Grids are labelled with the period they show, selected cells carry `aria-selected`, and one
      always-mounted live region announces the selection with its precision and switches to the
      visible danger message for a validation error.
- [ ] Controlled and uncontrolled both work; `disabled` is inert and does not open; `aria-invalid`
      applies the danger frame; `className` merge, caller wins.
- [ ] Recipe obeyed: full-literal semantic-token utilities, `cn()` merge, `forwardRef` + native prop
      spread, `React.ComponentRef` ref types, no `dark:` on the common path.
- [ ] Storybook catalog entry (playground, year only, typing, bounds, empty, disabled, invalid,
      controlled, beside `DatePicker` for contrast).
- [ ] Mutation testing run over the suite, with mutations run and killed reported honestly.
- [ ] Full `pnpm build` / `pnpm test` / `pnpm lint` / `pnpm format:check` green from the repo root.
- [ ] `packages/canopy/README.md` component list (saying which picker is for which),
      `overview/features.md`, `overview/architecture.md`, `overview/learnings.md` and `CHANGELOG.md`
      updated.
