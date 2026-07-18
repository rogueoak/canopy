# 0065 - DatePicker

## Problem

Canopy is adding a `Calendar` (0060) - a themed month grid for choosing days - but a calendar on
its own is not how most apps ask for a date. The everyday pattern is a **field the user clicks to
open a calendar in a popover, pick a day, and see the chosen date formatted back in the trigger**.
Today a canopy consumer who needs "pick a date" has to wire that composition by hand every time:
mount `Calendar` (0060) inside `@radix-ui/react-popover`, drive open state, format the selected
value, and reconcile keyboard/focus handoff between the trigger button and the grid. That is
exactly the compose-once job the design system should own, and it is the missing piece between the
raw `Calendar` grid and a real form control.

shadcn ships this only as a copy-paste **recipe** (Popover + Button + Calendar glued in app code),
not a component - so there is no themed, tested, reusable `DatePicker` to import. Canopy already
owns every primitive this needs: `Calendar` (0060) for the grid, the `Button` (0005) idiom for the
trigger, and `@radix-ui/react-popover` (already a canopy dependency, used by `Combobox` 0030) for
the portalled shell. This spec composes them into one Branch so the whole system gets a single,
consistent date field.

This is for any form or filter surface that captures a day or a day range: created-after filters,
due-date and start/end pickers, booking and scheduling ranges. Single date is the common case; the
range variant falls out of the same `Calendar` (0060) `mode` for free.

## Outcome

- A new canopy component family, `DatePicker`, exported from `@rogueoak/canopy/branches`, that
  renders a **trigger button** which opens a `Calendar` (0060) inside a **Radix Popover** and
  writes the selected date back into the trigger as formatted text.
- **Single date** (`mode="single"`): clicking the trigger opens the popover; picking a day sets the
  value, closes the popover, and shows the formatted date (via `date-fns` `format`, already pulled
  in by `Calendar` 0060 - no new dependency) in the trigger. A `placeholder` shows when no date is
  set.
- **Range** (`mode="range"`): the calendar selects a start and end day; the trigger shows the
  formatted `start - end` range (or the partial start while the range is being completed); the
  popover stays open until the range is complete, then closes.
- **States**: `disabled` renders the trigger inert with the shared disabled tokens and does not
  open; `placeholder` renders as muted trigger text; an unset value reads as the placeholder, a set
  value reads as the formatted date/range.
- **Controlled + uncontrolled**: works with `value`/`onValueChange` (controlled) and
  `defaultValue` (uncontrolled), matching the other canopy field families.
- **Keyboard + a11y**: the trigger is a real `button` with `aria-haspopup="dialog"` and
  `aria-expanded`; `Enter`/`Space` open it, `Escape` closes and returns focus to the trigger, and
  focus moves into the `Calendar` grid on open (arrow-key day navigation is owned by `Calendar`
  0060). Pairs with `Label` / `FormField` as a labelled control and supports `aria-invalid`.
- **Theming**: styled with the 0005 recipe (full-literal semantic-token Tailwind utilities, `cn()`
  merge, `forwardRef` + native prop spread), so it themes light/dark through the token layer with
  **no `dark:` on the common path**; the portalled popover themes correctly the same way
  `ComboboxContent` (0030) and `SelectContent` (0013) do.
- **Docs**: a Storybook catalog entry with single, range, placeholder, disabled, invalid
  (`aria-invalid`), and controlled stories; canopy `README.md` component list and the `overview/`
  living docs updated on completion.

## Scope

### In
- `packages/canopy/src/branches/DatePicker.tsx` (+ `DatePicker.test.tsx`) - the component family
  and its parts, exported from `packages/canopy/src/branches/index.ts` (Branch barrel).
- Composition of existing canopy primitives only: `Calendar` (0060) for the grid,
  `@radix-ui/react-popover` (already a canopy dependency and already externalized in
  `tsup.config.ts`) for the popover shell, and the `Button` (0005) trigger idiom.
- Both **`single`** and **`range`** modes in one public API, driven by the `Calendar` (0060)
  `mode` prop; trigger renders the formatted date (single) or formatted range (range) using
  `date-fns` `format` (transitively available via `Calendar` 0060 - **no new dependency added by
  this spec**).
- `placeholder`, `disabled`, and `aria-invalid` states matching the `SelectTrigger` / `Input`
  field styling for visual parity; controlled (`value`/`onValueChange`) and uncontrolled
  (`defaultValue`) operation.
- A configurable trigger date **format string** (default a readable format, e.g. `PPP`) and an
  optional caller-provided range separator.
- Storybook stories (single, range, placeholder, disabled, invalid, controlled) and canopy
  `README.md` + `overview/features.md` / `overview/architecture.md` updates on completion.
- Tests: opens on trigger click/keyboard; single-select sets value, closes, and shows formatted
  date; range-select shows the formatted range and closes when complete; placeholder shows when
  unset; disabled is inert and does not open; `Escape` closes and restores focus; controlled and
  uncontrolled both work; trigger exposes `aria-haspopup`/`aria-expanded` and honours
  `aria-invalid`; `className` merge (caller wins).

### Out
- **No new runtime dependency.** `@radix-ui/react-popover` and `date-fns` are already in the
  canopy footprint via `Combobox` (0030) and `Calendar` (0060); this spec adds neither a package
  nor a `tsup` external.
- **Time-of-day / datetime picking** (hour/minute selection, timezone handling) - v1 is
  day-granularity only; a `DateTimePicker` is a clean follow-up spec.
- **Preset ranges** ("Last 7 days", "This month" quick-pick buttons beside the calendar) - deferred
  to a follow-up that composes `DatePicker` with a preset list.
- **Multiple non-contiguous dates** (`Calendar` `mode="multiple"`) - v1 ships `single` and `range`
  only; multiple can be added later off the same `Calendar` mode.
- **Masked text entry** (typing a date directly into the trigger to parse) - v1 selection is via
  the calendar grid only; a parse-on-type input is a separate concern.
- Changing `Calendar` (0060) or `Button` (0005) - `DatePicker` is additive and composes them
  unchanged; it does **not** modify any existing component's public API.

## Approach

**Primitive stack: canopy `Calendar` (0060) + `@radix-ui/react-popover` + the `Button` (0005)
trigger idiom.** This is the shadcn "date picker" recipe promoted into a real, themed, tested
canopy component. Everything it needs already exists in the system: `Calendar` (0060) is the grid
(and already brings `date-fns` for formatting and `react-day-picker` for selection), and
`@radix-ui/react-popover` is already a canopy dependency and already externalized in
`tsup.config.ts` (added for `Combobox` 0030). So `DatePicker` introduces **no new dependency** -
it is pure composition. It lives in `src/branches` because it owns interaction state (open/close,
selected value) and portals its content, matching the Branch definition (same layer as `Combobox`
0030 and `Dialog`), and it imports downward only (`Branch -> Twig -> Seed`), never upward.

**Part surface (mirrors the shadcn date-picker recipe, canopy-styled).** A small family so callers
compose like the other Branches, with a batteries-included default:
- `DatePicker` - the stateful root: owns open state and the selected value; takes `mode`
  (`"single"` | `"range"`, default `"single"`), `value`/`onValueChange`, `defaultValue`,
  `placeholder`, `disabled`, `format` (a `date-fns` format string), and standard field props.
  `mode` switches the value shape (a `Date` for single, a `{ from; to }` range for range) and the
  trigger rendering. Renders `DatePickerTrigger` + `DatePickerContent` internally so the common
  case is a single component.
- `DatePickerTrigger` - the field button, styled to match `SelectTrigger` / `Input`
  (`border-border` / `bg-surface` / `text-text`, focus-visible ring, `disabled:*` token pair,
  `aria-invalid:` danger overrides, a leading calendar icon). Shows the formatted date/range, or a
  muted `text-text-muted` placeholder when unset. Carries `aria-haspopup="dialog"` and
  `aria-expanded`.
- `DatePickerContent` - the `Popover.Content` wrapper (`bg-surface-raised` + `border-border` +
  `shadow-md`, matched to `ComboboxContent` 0030 / `SelectContent` 0013), portalled and collision-
  aware, housing the `Calendar` (0060). Uses `bg-muted-raised` for any raised-surface hover, per
  the raised-surface rule.

**Formatting.** The trigger text is produced by `date-fns` `format` with a caller-configurable
format string (default a readable long form such as `PPP`). Range mode formats both ends with a
separator (default `" - "`, overridable). Formatting reuses the `date-fns` already present via
`Calendar` (0060); no formatting is hand-rolled.

**Styling & recipe.** FULL LITERAL semantic-token utility strings (so Tailwind v4's scanner emits
each - no dynamically built class names), `cn()` merge with caller `className` winning, `forwardRef`
on every styled wrapper with a native prop spread, `React.ComponentRef` (not the deprecated
`React.ElementRef`) for ref types, semantic tokens only, and **no `dark:` on the common path** -
identical to 0005/0030. Field states (`disabled`, `aria-invalid`) reuse the exact token classes
`SelectTrigger`/`Input` use so an invalid/disabled `DatePicker` reads identically to an
invalid/disabled `Select` or `Input`. The portalled content inherits `.dark` from `<html>`, so no
per-portal theme wiring is needed.

**Accessibility.** The trigger is a real `button` with `aria-haspopup="dialog"` and `aria-expanded`
reflecting open state; `Enter`/`Space` open the popover, `Escape` closes it and returns focus to
the trigger (Radix Popover behaviour), and focus moves into the `Calendar` grid on open where
`Calendar` (0060) owns arrow-key day navigation and the grid roles. `aria-invalid` is honoured on
the trigger for form validation. These promises are guarded by **observable tests** (roles/attrs
present, open/close via keyboard, focus restoration, disabled inert), per the repo learning that
a11y is verified by outcomes, not by asserting a class exists.

**Motion.** Popover open/close uses the shared pop animation (`animate-pop-in` / `animate-pop-out`)
gated with `motion-reduce:animate-none`; no new keyframes are introduced.

**Trade-offs.**
- *Compose vs. build new*: promoting the shadcn recipe into a canopy Branch (rather than leaving it
  as copy-paste app glue) means the system owns the open-state/format/focus wiring once and every
  consumer gets the same tested behaviour; the cost is one more component surface to maintain,
  which is small because it is pure composition of existing parts. Accepted.
- *One `mode` prop vs two components*: a single component with a `mode` switch keeps the surface
  small and mirrors `Calendar` (0060)'s own `mode`; the value-type discrimination (`Date` vs
  range) is the cost, documented and typed so `mode` implies the value shape.
- *No new dependency*: because `date-fns` and `@radix-ui/react-popover` already ride along with
  `Calendar` (0060) and `Combobox` (0030), this spec deliberately adds nothing to the dependency
  footprint - there is **no** new-dependency surface for security/architecture personas to weigh
  here; the review focus is the composition and the a11y/focus handoff.

## Acceptance

- [ ] `DatePicker` and its parts (`DatePicker`, `DatePickerTrigger`, `DatePickerContent`) ship from
      `@rogueoak/canopy/branches` (exported via `branches/index.ts`), composing `Calendar` (0060) +
      `@radix-ui/react-popover` + the `Button` (0005) trigger idiom; **no new dependency** and no
      new `tsup` external added.
- [ ] Recipe obeyed: full-literal semantic-token utility strings, `cn()` merge (caller `className`
      wins), `forwardRef` + native prop spread on every styled wrapper, `React.ComponentRef` ref
      types, semantic tokens only, and **no `dark:` on the common path**.
- [ ] **Single** (`mode="single"`): clicking/keyboard-opening the trigger opens the popover;
      picking a day sets the value, closes the popover, and shows the `date-fns`-formatted date in
      the trigger; an unset value shows the muted `placeholder`.
- [ ] **Range** (`mode="range"`): the calendar selects start/end; the trigger shows the formatted
      range with the separator; the popover stays open until the range is complete, then closes.
- [ ] Controlled (`value`/`onValueChange`) and uncontrolled (`defaultValue`) both work.
- [ ] `disabled` renders the trigger inert with the shared disabled tokens and does not open;
      `aria-invalid` applies the danger border/ring exactly as `SelectTrigger`/`Input` do.
- [ ] Keyboard + a11y: trigger is a `button` with `aria-haspopup="dialog"` and `aria-expanded`;
      `Enter`/`Space` open, `Escape` closes and restores focus to the trigger; focus moves into the
      `Calendar` grid on open (grid arrow-key navigation owned by `Calendar` 0060).
- [ ] Storybook catalog entry with single, range, placeholder, disabled, invalid, and controlled
      stories in `apps/storybook/src/`; light and dark render via the toolbar; `pnpm storybook`
      build is green.
- [ ] Tests cover: opens on click and keyboard; single-select sets value + closes + shows formatted
      date; range-select shows formatted range + closes when complete; placeholder shows when unset;
      disabled inert (does not open); `Escape` closes + restores focus; controlled and uncontrolled;
      `aria-haspopup`/`aria-expanded`/`aria-invalid` present; `className` merge caller wins.
- [ ] `pnpm test` / `pnpm lint` / `pnpm build` all pass from the repo root; ASCII-only text and
      source.
- [ ] Canopy `README.md` component list includes `DatePicker`; `overview/features.md` (new
      date-field capability) and `overview/architecture.md` (DatePicker as a Branch composing
      `Calendar` 0060 + the already-present `@radix-ui/react-popover`, adding no new dependency)
      updated on completion.
