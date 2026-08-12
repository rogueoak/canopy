# 0073 - PartialDatePicker (build plan)

Source: [`docs/specs/0073-partial-date-picker.md`](../specs/0073-partial-date-picker.md), a
follow-on to [0065](../specs/0065-date-picker.md).

Built in the worktree `.worktrees/0073-partial-date-picker` on `feat/partial-date-picker-0073`.

**Standing constraint for every step:** `DatePicker.tsx` and `Calendar.tsx` are not edited. If a
step seems to need a change there, stop - it means the composition is wrong.

## Steps

1. **The format** - `packages/canopy/src/lib/partialDate.ts`.
   `parsePartialDate`, `normalizePartialDate`, `formatPartialDate`, `isPartialDateWithin`, plus the
   internal leap-year rule and interval comparison. No `Date` in any parsing path.
   Scoped to what the component actually needs now that `Calendar` owns the day grid: no weekday
   arithmetic, no day stepping, no month stepping - `react-day-picker` already does all of that.
   Verification: `partialDate.test.ts`, including the negative-offset-timezone pin.

2. **The component** - `packages/canopy/src/branches/PartialDatePicker.tsx`.
   Field (`InputGroup` + `InputGroupInput` + `InputGroupButton`) inside a Radix Popover. Panel =
   header (step / zoom out) + one of three levels + footer (hint, Clear, Done), with one
   always-mounted live region under the field. Year and month levels are a shared
   `<table role="grid">`; the day level is `<Calendar>` driven by `month` / `onMonthChange` /
   `selected` / `onSelect` / `startMonth` / `endMonth`.
   The only `Date` in the file is the `Calendar` bridge, built from local calendar fields and read
   back with `getFullYear` / `getMonth` / `getDate`.
   Verification: `PartialDatePicker.test.tsx`.

3. **Barrel** - export the component, the four helpers and their types from
   `packages/canopy/src/branches/index.ts`. Nothing else in the barrel moves.

4. **Stories** - `apps/storybook/src/PartialDatePicker.stories.tsx`: playground, year only, typing,
   bounds, empty, disabled, invalid, controlled, and one story beside `DatePicker` showing which to
   reach for. Hooks live in named components, never in a `render` callback.

5. **Test, then mutate.** Full suite green, then mutate every load-bearing branch of the two source
   files one at a time and confirm the suite goes red. Record mutations run and killed; add a test
   for every survivor.

6. **Docs** - `packages/canopy/README.md` (both pickers, and which is for which),
   `overview/features.md`, `overview/architecture.md`, `overview/learnings.md`, `CHANGELOG.md`.

7. **Gate** - full `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm format:check` from the repo root
   (the FULL turbo run, not a package filter - learning: a package-scoped gate misses Storybook).

8. **Ship** - Conventional Commit, PR, personas review (engineer, tester, architect, designer),
   address comments, merge, then cut the minor tag.

## Files touched

- `docs/specs/0073-partial-date-picker.md` (new)
- `docs/specs/0065-date-picker.md` (one pointer line in Out, so the two specs are not rivals)
- `docs/plans/0073-partial-date-picker.md` (new)
- `packages/canopy/src/lib/partialDate.ts` (new)
- `packages/canopy/src/lib/partialDate.test.ts` (new)
- `packages/canopy/src/branches/PartialDatePicker.tsx` (new)
- `packages/canopy/src/branches/PartialDatePicker.test.tsx` (new)
- `packages/canopy/src/branches/index.ts`
- `apps/storybook/src/PartialDatePicker.stories.tsx` (new)
- `packages/canopy/README.md`
- `docs/overview/features.md`, `architecture.md`, `learnings.md`
- `CHANGELOG.md`

## Not touched

- `packages/canopy/src/branches/DatePicker.tsx`, `Calendar.tsx` and their tests.
