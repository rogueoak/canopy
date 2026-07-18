import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { format as formatDate } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { Calendar } from './Calendar';
import { cn } from '../lib/cn';

/**
 * DatePicker - the canopy popover date-field Branch (spec 0065). It promotes the shadcn
 * "date picker" recipe (a `Button`-idiom trigger + a `@radix-ui/react-popover` shell + a
 * `Calendar` grid) into one themed, tested canopy component, so a consumer imports a single
 * date field instead of re-wiring the composition by hand.
 *
 * It composes existing canopy primitives only: `Calendar` (spec 0060) for the month grid (which
 * already brings `react-day-picker` + `date-fns`), `@radix-ui/react-popover` (already a canopy
 * dependency via `Combobox` 0030) for the portalled shell, and the `Button` (0005) trigger idiom
 * for the field. It adds NO new dependency and NO new `tsup` external.
 *
 * It follows the 0005 recipe: FULL LITERAL semantic-token Tailwind utility strings (so Tailwind
 * v4's scanner emits each one), `cn()` merges the caller `className` (caller wins), `forwardRef`
 * on every styled wrapper with a native prop spread, `React.ComponentRef` ref types, and NO
 * `dark:` on the common path - light/dark flips through the token layer (spec 0004). Because the
 * `.dark` class lives on `<html>`, the Radix-portalled content themes correctly too, exactly like
 * `ComboboxContent` (0030) / `SelectContent` (0013).
 *
 * It lives in the Branches tier: it owns interaction state (open/close, the selected value) and
 * portals its content, and imports downward only (Branch -> Twig -> Seed), never upward.
 *
 * One `mode` prop discriminates the value shape and the trigger rendering: `"single"` selects a
 * `Date` (pick commits and closes); `"range"` selects a `{ from, to }` `DateRange` (the popover
 * stays open until both ends are set, then closes). Controlled (`value` + `onValueChange`) or
 * uncontrolled (`defaultValue`), matching the other canopy field families.
 */

/* --------------------------------------------------------------- primitives */

const DatePicker_Root = PopoverPrimitive.Root;

/**
 * DatePickerTrigger - the field button that opens the popover (`Popover.Trigger`). Class tokens
 * mirror the Input field (spec 0006) and `SelectTrigger` / `ComboboxTrigger` for visual parity:
 * `border-border` + `bg-surface` + `text-text`, the shared focus-visible ring, the `disabled:*`
 * token pair (not opacity), and the `aria-invalid:` danger overrides so an invalid DatePicker
 * reads identically to an invalid Select or Input. Carries `aria-haspopup="dialog"` and a leading
 * calendar glyph. A muted placeholder shows when unset.
 */
const DatePickerTrigger = React.forwardRef<
  React.ComponentRef<typeof PopoverPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <PopoverPrimitive.Trigger
    ref={ref}
    aria-haspopup="dialog"
    className={cn(
      'flex h-10 w-full items-center justify-start gap-2 rounded-md border border-border bg-surface px-3 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-ring-offset disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-foreground aria-invalid:border-danger aria-invalid:ring-danger [&>span]:line-clamp-1',
      className,
    )}
    {...props}
  >
    <CalendarIcon />
    {children}
  </PopoverPrimitive.Trigger>
));
DatePickerTrigger.displayName = 'DatePickerTrigger';

/**
 * DatePickerContent - the portalled popover surface housing the `Calendar` (0060). Rendered
 * through `Popover.Portal` (so it escapes overflow / stacking contexts) onto a raised-surface
 * card: `bg-surface-raised` + `text-text` + `border border-border` + `rounded-md` + `shadow-md`,
 * matched to `ComboboxContent` (0030) / `SelectContent` (0013). Open / close uses the shared pop
 * animation gated with `motion-reduce:animate-none`.
 */
const DatePickerContent = React.forwardRef<
  React.ComponentRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = 'start', sideOffset = 4, children, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        'z-50 w-auto rounded-md border border-border bg-surface-raised p-0 text-text shadow-md data-[state=open]:animate-pop-in data-[state=closed]:animate-pop-out motion-reduce:animate-none',
        className,
      )}
      {...props}
    >
      {children}
    </PopoverPrimitive.Content>
  </PopoverPrimitive.Portal>
));
DatePickerContent.displayName = 'DatePickerContent';

/* --------------------------------------------------------------------- root */

interface DatePickerBaseProps {
  /** Placeholder shown as muted trigger text when no date is set. */
  placeholder?: string;
  /**
   * `date-fns` format string for the trigger label (default `'PPP'`, a readable long form such
   * as "June 12th, 2024"). See date-fns `format` tokens.
   */
  format?: string;
  /** Render the whole field inert with the shared disabled tokens; it does not open. */
  disabled?: boolean;
  /** Apply the danger border / ring, exactly like an invalid Input / Select. */
  'aria-invalid'?: React.AriaAttributes['aria-invalid'];
  /** Accessible name for the field trigger (pair with `Label` via `id` / `htmlFor` instead). */
  'aria-label'?: string;
  /** Id of a labelling element for the field trigger. */
  'aria-labelledby'?: string;
  /** Id forwarded to the field trigger (for `Label htmlFor` association). */
  id?: string;
  /** Extra classes merged onto the field trigger. */
  className?: string;
}

/** Single-date DatePicker: `value` is a `Date`. */
export interface DatePickerSingleProps extends DatePickerBaseProps {
  mode?: 'single';
  /** The controlled selected date. */
  value?: Date;
  /** The initial date when uncontrolled. */
  defaultValue?: Date;
  /** Fired with the newly selected date (or `undefined` when cleared). */
  onValueChange?: (value: Date | undefined) => void;
}

/** Range DatePicker: `value` is a `{ from, to }` `DateRange`; the trigger shows `from - to`. */
export interface DatePickerRangeProps extends DatePickerBaseProps {
  mode: 'range';
  /** The controlled selected range. */
  value?: DateRange;
  /** The initial range when uncontrolled. */
  defaultValue?: DateRange;
  /** Fired with the newly selected range (or `undefined` when cleared). */
  onValueChange?: (value: DateRange | undefined) => void;
  /** Separator rendered between the two formatted ends (default `' - '`). */
  rangeSeparator?: string;
}

/**
 * The public `DatePicker` props. `mode` discriminates the value shape: omit it (or pass
 * `"single"`) for a `Date`; pass `"range"` for a `{ from, to }` `DateRange` (formatted
 * `from - to`).
 */
export type DatePickerProps = DatePickerSingleProps | DatePickerRangeProps;

function isRangeValue(value: unknown): value is DateRange {
  return typeof value === 'object' && value !== null && 'from' in value;
}

/**
 * DatePicker - the stateful root. Owns open state and the selected value, and renders
 * `DatePickerTrigger` + `DatePickerContent` (housing `Calendar`) internally so the common case is
 * a single component. See the module header for the full behaviour contract.
 */
const DatePicker = React.forwardRef<HTMLButtonElement, DatePickerProps>((props, ref) => {
  const {
    mode = 'single',
    placeholder = 'Pick a date',
    format: formatStr = 'PPP',
    disabled = false,
    className,
    id,
    'aria-invalid': ariaInvalid,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
  } = props;

  const rangeSeparator =
    props.mode === 'range' ? (props.rangeSeparator ?? ' - ') : ' - ';

  const [open, setOpen] = React.useState(false);

  // Latch controlledness once on mount so a controlled parent holding `undefined` is not misread
  // as uncontrolled on later renders (React's controlled / uncontrolled contract).
  const isControlledRef = React.useRef(props.value !== undefined);
  const isControlled = isControlledRef.current;
  const [internal, setInternal] = React.useState<Date | DateRange | undefined>(
    () => props.defaultValue,
  );

  const selected = isControlled ? props.value : internal;

  const emit = React.useCallback(
    (next: Date | DateRange | undefined) => {
      if (!isControlled) setInternal(next);
      if (mode === 'range') {
        (props.onValueChange as ((value: DateRange | undefined) => void) | undefined)?.(
          next as DateRange | undefined,
        );
      } else {
        (props.onValueChange as ((value: Date | undefined) => void) | undefined)?.(
          next as Date | undefined,
        );
      }
    },
    [isControlled, mode, props.onValueChange],
  );

  const handleSelectSingle = React.useCallback(
    (day: Date | undefined) => {
      emit(day);
      // Picking a day commits and closes the popover.
      if (day) setOpen(false);
    },
    [emit],
  );

  const handleSelectRange = React.useCallback(
    (range: DateRange | undefined) => {
      emit(range);
      // Stay open until the range spans two distinct days, then close. react-day-picker reports
      // the first click as `{ from: d, to: d }` (start only); the closing click sets a later `to`,
      // so a differing `to` is the "range complete" signal.
      if (range?.from && range?.to && range.to.getTime() !== range.from.getTime()) {
        setOpen(false);
      }
    },
    [emit],
  );

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (disabled) return;
      setOpen(next);
    },
    [disabled],
  );

  const label = React.useMemo(() => {
    if (mode === 'range') {
      const range = isRangeValue(selected) ? selected : undefined;
      if (!range?.from) return undefined;
      // A partial range (only a start picked) reads as just the start. react-day-picker reports
      // that first click as `{ from: d, to: d }`, so treat `to === from` as still partial.
      if (!range.to || range.to.getTime() === range.from.getTime()) {
        return formatDate(range.from, formatStr);
      }
      return `${formatDate(range.from, formatStr)}${rangeSeparator}${formatDate(range.to, formatStr)}`;
    }
    const day = selected instanceof Date ? selected : undefined;
    return day ? formatDate(day, formatStr) : undefined;
  }, [mode, selected, formatStr, rangeSeparator]);

  return (
    <DatePicker_Root open={open} onOpenChange={handleOpenChange}>
      <DatePickerTrigger
        ref={ref}
        id={id}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        className={className}
      >
        <span className={cn('text-left', label ? undefined : 'text-text-muted')}>
          {label ?? placeholder}
        </span>
      </DatePickerTrigger>
      <DatePickerContent>
        {mode === 'range' ? (
          <Calendar
            mode="range"
            selected={isRangeValue(selected) ? selected : undefined}
            onSelect={handleSelectRange}
            defaultMonth={isRangeValue(selected) ? selected.from : undefined}
          />
        ) : (
          <Calendar
            mode="single"
            selected={selected instanceof Date ? selected : undefined}
            onSelect={handleSelectSingle}
            defaultMonth={selected instanceof Date ? selected : undefined}
          />
        )}
      </DatePickerContent>
    </DatePicker_Root>
  );
});
DatePicker.displayName = 'DatePicker';

/* ------------------------------------------------------------------- glyphs */
/* Inline SVG, matching the Combobox / Select recipe (no new icon dependency). */

function CalendarIcon() {
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
      className="h-4 w-4 shrink-0 opacity-70"
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}

export { DatePicker, DatePickerTrigger, DatePickerContent };
