import * as React from 'react';
import {
  DayPicker,
  getDefaultClassNames,
  type DayPickerProps,
  type ChevronProps,
  type RootProps,
} from 'react-day-picker';
import { cn } from '../lib/cn';

/**
 * Calendar - the canopy date-grid Branch (spec 0060), built on `react-day-picker` v9 (which uses
 * `date-fns` for its date math). It renders an accessible month grid with single / range /
 * multiple selection, previous / next month navigation, disabled dates, and full keyboard
 * operation, and is the foundation for the popover-backed `DatePicker` (spec 0065).
 *
 * It follows the 0005 component recipe: react-day-picker is skinned entirely through its
 * `classNames` / `modifiersClassNames` maps with FULL LITERAL semantic-token Tailwind utility
 * strings (so Tailwind v4's scanner emits each one), `cn()` merges the caller `className` (caller
 * wins) onto the root, `forwardRef` forwards to the `DayPicker` root, `React.ComponentRef` types
 * the ref, and there is NO `dark:` on the common path - light/dark flips through the token layer
 * (spec 0004).
 *
 * It lives in the Branches tier: it owns interaction state (selection + month navigation) and
 * wraps a third-party stateful primitive, exactly like `Combobox`. Its props are `DayPicker`'s
 * props (`mode`, `selected`, `onSelect`, `disabled`, `defaultMonth`, ...) carried straight
 * through, so the value shape follows `mode` (single `Date`, range `{ from, to }`, multiple
 * `Date[]`) - react-day-picker's own discriminated typing - and selection is both controlled
 * (`selected` + `onSelect`) and uncontrolled (react-day-picker's internal state). Only a single
 * month with button navigation is styled for v1; multi-month, dropdown nav, and week numbers are
 * deferred (spec 0060 Out of scope).
 *
 * `DayPicker` is not a `forwardRef` component in v9 (it takes no `ref`), so the forwarded ref is
 * threaded to react-day-picker's own root `<div>` through its `Root` component slot (which exposes
 * a `rootRef`), giving callers the outermost DOM node exactly as a `forwardRef` on the root would.
 */
export type CalendarProps = DayPickerProps;

const Calendar = React.forwardRef<HTMLDivElement, CalendarProps>(
  ({ className, classNames, components, showOutsideDays = true, ...props }, ref) => {
    const defaults = getDefaultClassNames();
    // Bind the forwarded ref to react-day-picker's root `<div>` via its `Root` slot. `rootRef`
    // (used by rdp's animation path) is not a DOM attribute, so it is dropped before spreading.
    const RootWithRef = React.useCallback(
      ({ rootRef, ...rootProps }: RootProps) => {
        void rootRef;
        return <div ref={ref} {...rootProps} />;
      },
      [ref],
    );
    return (
      <DayPicker
        showOutsideDays={showOutsideDays}
        className={cn('p-3 text-text', className)}
        classNames={{
          // Layout scaffold (spacing/flex), keyed by react-day-picker's UI slots.
          months: cn(defaults.months, 'relative flex flex-col gap-4 sm:flex-row'),
          month: cn(defaults.month, 'flex flex-col gap-4'),
          month_caption: cn(defaults.month_caption, 'flex h-9 items-center justify-center px-9'),
          caption_label: cn(defaults.caption_label, 'text-sm font-medium text-text'),
          nav: cn(defaults.nav, 'absolute inset-x-0 top-0 flex items-center justify-between'),
          // Previous / next month buttons - the canopy Button outline/icon idiom.
          button_previous: cn(
            defaults.button_previous,
            'inline-flex h-7 w-7 items-center justify-center rounded-md border border-border-strong bg-transparent text-text transition-colors hover:bg-muted active:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-ring-offset disabled:pointer-events-none disabled:opacity-50',
          ),
          button_next: cn(
            defaults.button_next,
            'inline-flex h-7 w-7 items-center justify-center rounded-md border border-border-strong bg-transparent text-text transition-colors hover:bg-muted active:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-ring-offset disabled:pointer-events-none disabled:opacity-50',
          ),
          month_grid: cn(defaults.month_grid, 'w-full border-collapse space-y-1'),
          weekdays: cn(defaults.weekdays, 'flex'),
          weekday: cn(defaults.weekday, 'w-9 rounded-md text-caption font-normal text-text-muted'),
          week: cn(defaults.week, 'mt-2 flex w-full'),
          // The day cell (`td`, `role="gridcell"`). Range fills live here so the middle span reads
          // as one continuous band via the rounded end caps below.
          day: cn(
            defaults.day,
            'relative h-9 w-9 p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-muted [&:has([aria-selected].range_end)]:rounded-r-md [&:has([aria-selected].range_start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md',
          ),
          // The interactive day button (what receives focus + Enter/Space).
          day_button: cn(
            defaults.day_button,
            'inline-flex h-9 w-9 items-center justify-center rounded-md p-0 text-sm font-normal text-text transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-ring-offset aria-selected:opacity-100',
          ),
          // Selection states (react-day-picker SelectionState) - the primary fill.
          selected: cn(
            defaults.selected,
            '[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary-hover',
          ),
          range_start: cn(defaults.range_start, 'range_start rounded-l-md'),
          range_end: cn(defaults.range_end, 'range_end rounded-r-md'),
          // The in-between span keeps the muted band; endpoints stay primary.
          range_middle: cn(
            defaults.range_middle,
            '[&>button]:bg-transparent [&>button]:text-text [&>button]:hover:bg-muted',
          ),
          // Day flags (react-day-picker DayFlag).
          today: cn(defaults.today, '[&>button]:ring-1 [&>button]:ring-ring'),
          outside: cn(defaults.outside, 'text-text-muted [&>button]:text-text-muted'),
          disabled: cn(
            defaults.disabled,
            'cursor-not-allowed opacity-50 [&>button]:cursor-not-allowed',
          ),
          hidden: cn(defaults.hidden, 'invisible'),
          ...classNames,
        }}
        components={{
          Chevron: CalendarChevron,
          Root: RootWithRef,
          ...components,
        }}
        {...props}
      />
    );
  },
);
Calendar.displayName = 'Calendar';

/**
 * CalendarChevron - the nav chevron, swapped in through react-day-picker's `components` slot so
 * the previous / next buttons use canopy's inline chevron glyphs (no icon dependency), matching
 * the `Combobox` / `Select` recipe. `orientation` is `'left'` for the previous button and
 * `'right'` for the next.
 */
function CalendarChevron({ orientation, className }: ChevronProps) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn('h-4 w-4', className)}
    >
      {orientation === 'left' ? <path d="m15 18-6-6 6-6" /> : <path d="m9 18 6-6-6-6" />}
    </svg>
  );
}

export { Calendar };
