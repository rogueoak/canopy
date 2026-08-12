import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import type { Matcher } from 'react-day-picker';
import { Button } from '../seeds/Button';
import { InputGroup, InputGroupButton, InputGroupInput } from '../twigs/InputGroup';
import { Calendar } from './Calendar';
import { cn } from '../lib/cn';
import {
  formatPartialDate,
  formatPartialDateParts,
  isPartialDateWithin,
  monthName,
  normalizePartialDate,
  parsePartialDate,
  partialDateRange,
  toCalendarDate,
  today,
  type PartialDateBounds,
  type PartialDateParts,
} from '../lib/partialDate';

/**
 * PartialDatePicker - the date field for a date somebody remembers (spec 0073), the follow-on to
 * `DatePicker` (0065) rather than a replacement for it.
 *
 * `DatePicker` selects a `Date`, which is always a specific day. That is right for a due date and
 * wrong for an archive: `1968`, `1968-05` and `1968-05-14` are all real answers, and turning a
 * year-only answer into 1 January 1968 states a fact nobody gave you. So this component's value is
 * an ISO 8601 reduced-precision string - exactly `YYYY`, `YYYY-MM` or `YYYY-MM-DD` - whose length
 * carries its own precision. Reach for `DatePicker` when you need a day; reach for this when the
 * answer might legitimately be coarser.
 *
 * Precision is expressed by where you stop. The popover opens on years; picking one commits `1968`
 * and offers that year's months, picking a month commits `1968-05` and offers its days, picking a
 * day commits `1968-05-14` and closes. Every pick is already a complete answer, so there is no
 * precision control to keep in step and no way to end up with a day nobody chose. Zooming back out
 * and re-picking truncates.
 *
 * The day level IS `Calendar` (0060), driven through its existing public props, so its grid,
 * keyboard model, month navigation and theming are reused rather than rebuilt. Only the year and
 * month grids are new. `DatePicker` and `Calendar` are not modified by this component.
 *
 * NO partial date is ever parsed through `Date`: `new Date('1974-06')` is May west of Greenwich.
 * The only `Date` here is the bridge to `Calendar`, built from local calendar FIELDS
 * (`new Date(year, month - 1, day)`) and read back with `getFullYear` / `getMonth` / `getDate`.
 *
 * It follows the 0005 recipe: FULL LITERAL semantic-token utility strings, `cn()` merge (caller
 * wins), `forwardRef` + native prop spread, `React.ComponentRef` ref types, and NO `dark:` on the
 * common path. It sits in Branches because it owns interaction state and portals its content.
 */

/**
 * Which of the three grids the popover is showing. Deliberately its own union rather than an alias
 * of `PartialDatePrecision`: a view is a UI affordance and the precision is the value contract, so
 * adding, say, a decade page must not widen the wire format.
 */
export type PartialDatePickerView = 'year' | 'month' | 'day';

/** Overridable wording for how much of a date is known, used in the selection announcement. */
export interface PartialDatePrecisionLabels {
  /** Announced after a year-precision selection. Default `'year only'`. */
  year?: string;
  /** Announced after a month-precision selection. Default `'month and year'`. */
  month?: string;
  /** Announced after a day-precision selection. Default `'full date'`. */
  day?: string;
}

export interface PartialDatePickerProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'value' | 'defaultValue' | 'onChange' | 'min' | 'max' | 'size' | 'type' | 'className'
> {
  /**
   * The controlled value: a partial date (`'1968'`, `'1968-05'`, `'1968-05-14'`) or `undefined`
   * for a date nobody knows. Anything else is treated as no value.
   */
  value?: string;
  /** The initial value when uncontrolled. Normalized on mount, so `'1968-5'` becomes `'1968-05'`. */
  defaultValue?: string;
  /**
   * Fired with the new value whenever the field's contents name a date, and with `undefined`
   * whenever they do not - including mid-edit, so the value never lags what the field says.
   */
  onValueChange?: (value: string | undefined) => void;
  /** Earliest allowed date, itself a partial date. `'1900'` means "from the start of 1900". */
  min?: string;
  /**
   * Latest allowed date, itself a partial date. Bounds are interval overlaps, so `'2026-08-11'`
   * still admits `'2026'` (the year has partly happened) while refusing `'2026-09'` and `'2027'`.
   */
  max?: string;
  /** Field height, matching the Input / InputGroup size scale. */
  size?: 'sm' | 'md' | 'lg';
  /** Renders the whole field inert with the shared disabled tokens; the popover does not open. */
  disabled?: boolean;
  /** Whether the popover offers a Clear action once there is a value. Default `true`. */
  clearable?: boolean;
  /**
   * Which grid the popover opens on when there is no value yet. Default `'year'`, which puts a
   * year-only answer one tap from open; pass `'day'` for a field whose dates are usually recent.
   * When there IS a value, the popover always opens at that value's own precision.
   */
  defaultView?: PartialDatePickerView;
  /** BCP 47 locale(s) for month names and the spoken date. Defaults to the runtime's locale. */
  locale?: string | string[];
  /**
   * Extra classes for the FIELD (the bordered `InputGroup` frame), which is what a caller sizes and
   * positions. Native input props spread onto the `<input>` itself, and the forwarded `ref` is that
   * `<input>`.
   */
  className?: string;
  /** Placeholder for the empty field. Default `'1968, 1968-05 or 1968-05-14'`. */
  placeholder?: string;
  /** Accessible name for the button that opens the popover. Default `'Choose a date'`. */
  openLabel?: string;
  /** Accessible name for the step-back button. Default `'Previous'`. */
  previousLabel?: string;
  /** Accessible name for the step-forward button. Default `'Next'`. */
  nextLabel?: string;
  /** Appended to the period button's accessible name. Default `'Choose a broader period'`. */
  zoomOutLabel?: string;
  /** Label for the Clear action. Default `'Clear'`. */
  clearLabel?: string;
  /** Label for the action that closes the popover. Default `'Done'`. */
  doneLabel?: string;
  /**
   * The line explaining that stopping early is allowed. Default `'Stop at any level - a year on its
   * own is a complete answer.'`
   */
  hint?: string;
  /** Shown on blur when the text does not name a date. */
  invalidFormatMessage?: string;
  /**
   * Shown on blur when the text names a date outside `min` / `max`. Defaults to a message that
   * names the bounds, since "outside the allowed range" tells somebody they are wrong without
   * telling them how to be right.
   */
  outOfRangeMessage?: string;
  /** Announced when the value is cleared. Default `'Date cleared'`. */
  clearedLabel?: string;
  /** Wording for each precision in the selection announcement. */
  precisionLabels?: PartialDatePrecisionLabels;
}

const DEFAULT_PRECISION_LABELS: Required<PartialDatePrecisionLabels> = {
  year: 'year only',
  month: 'month and year',
  day: 'full date',
};

const YEARS_PER_PAGE = 20;
const YEAR_COLUMNS = 4;
const MONTH_COLUMNS = 3;

/** Which validation message the field is showing, if any. Raised on blur, cleared on the next key. */
type ErrorKind = 'format' | 'range' | null;

/** The period the popover is looking at. `month` is only meaningful below the year grid. */
interface Cursor {
  year: number;
  month: number;
}

/** One cell of the year or month grid. */
interface GridCell {
  key: string;
  label: string;
  /** The partial date this cell commits when activated. */
  value: string;
  selected: boolean;
  /** Whether this cell covers today, for the `aria-current` marker. */
  current: boolean;
  disabled: boolean;
}

function yearValue(year: number): string {
  return formatPartialDateParts({ year, precision: 'year' });
}

function monthValue(year: number, month: number): string {
  return formatPartialDateParts({ year, month, precision: 'month' });
}

function dayValue(year: number, month: number, day: number): string {
  return formatPartialDateParts({ year, month, day, precision: 'day' });
}

/**
 * The default out-of-range message. It names the bounds rather than only refusing, because the
 * bounds are never otherwise shown as text and "outside the allowed range" leaves somebody guessing
 * which end they hit.
 */
function describeRange(
  min: string | undefined,
  max: string | undefined,
  locale: string | string[] | undefined,
): string {
  const from = formatPartialDate(min, { locale });
  const to = formatPartialDate(max, { locale });
  if (from && to) return `Enter a date between ${from} and ${to}.`;
  if (to) return `Enter a date no later than ${to}.`;
  if (from) return `Enter a date no earlier than ${from}.`;
  return 'That date is outside the allowed range.';
}

function pageStartFor(year: number): number {
  return Math.floor(year / YEARS_PER_PAGE) * YEARS_PER_PAGE;
}

/** Step a year/month pair by whole months, carrying into the year. Grid navigation, not format. */
function stepMonths(cursor: Cursor, delta: number): Cursor {
  const zeroBased = cursor.year * 12 + (cursor.month - 1) + delta;
  return { year: Math.floor(zeroBased / 12), month: (((zeroBased % 12) + 12) % 12) + 1 };
}

function chunk(cells: GridCell[], columns: number): GridCell[][] {
  const rows: GridCell[][] = [];
  for (let index = 0; index < cells.length; index += columns) {
    rows.push(cells.slice(index, index + columns));
  }
  return rows;
}

/** Keep an anchor year inside the bounds, so an empty field does not open on an unreachable page. */
function clampYear(year: number, bounds: PartialDateBounds): number {
  const min = parsePartialDate(bounds.min);
  if (min && year < min.year) return min.year;
  const max = parsePartialDate(bounds.max);
  if (max && year > max.year) return max.year;
  return year;
}

/**
 * react-day-picker's month caption is itself a `role="status" aria-live="polite"` region. This
 * panel already has one live region under the field, and the header above already names the month,
 * so the caption is REMOVED rather than visually hidden: a `display:none` node would leave a second
 * live region in the DOM, and whether it announces would depend on a stylesheet. The grid keeps its
 * accessible name either way - react-day-picker sets `aria-label` on the table itself, not through
 * the caption.
 */
// An empty fragment rather than `null`: react-day-picker types the slot as returning an Element.
const NoMonthCaption = () => <></>;

/**
 * Calendar (0060) is tuned for the page canvas, and this panel is a raised surface, so the two
 * tokens it defines RELATIVE to the background have to be re-pointed by the composing component -
 * the Seed cannot know where it was dropped. `hover:bg-muted` is one step up from `bg-bg` but is
 * DARKER than `surface-raised` in dark, so a hovered day would recede while a hovered year lifts;
 * and `ring-offset-ring-offset` draws the page-canvas halo inside a raised card.
 *
 * These replace Calendar's strings wholesale (it spreads the caller's `classNames` last), so they
 * are complete and literal. The range selectors from Calendar's own `day` are dropped because this
 * composition is always `mode="single"`. Sizing also carries the 44px phone target the year and
 * month grids use, so the panel does not change touch scale between levels.
 */
const CALENDAR_DAY =
  'rdp-day relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:rounded-md [&:has([aria-selected])]:bg-muted-raised';
const CALENDAR_DAY_BUTTON =
  'rdp-day_button inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-md p-0 text-sm font-normal text-text transition-colors hover:bg-muted-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised aria-selected:opacity-100 md:h-9 md:w-9';
NoMonthCaption.displayName = 'NoMonthCaption';

const PartialDatePicker = React.forwardRef<HTMLInputElement, PartialDatePickerProps>(
  (props, ref) => {
    const {
      value: valueProp,
      defaultValue,
      onValueChange,
      min,
      max,
      size = 'md',
      disabled = false,
      clearable = true,
      defaultView = 'year',
      locale,
      className,
      placeholder = '1968, 1968-05 or 1968-05-14',
      openLabel = 'Choose a date',
      previousLabel = 'Previous',
      nextLabel = 'Next',
      zoomOutLabel = 'Choose a broader period',
      clearLabel = 'Clear',
      doneLabel = 'Done',
      hint = 'Stop at any level - a year on its own is a complete answer.',
      invalidFormatMessage = 'Enter a year (1968), a year and month (1968-05), or a full date (1968-05-14).',
      outOfRangeMessage,
      clearedLabel = 'Date cleared',
      precisionLabels,
      id: idProp,
      onBlur,
      onKeyDown,
      'aria-invalid': ariaInvalidProp,
      'aria-describedby': ariaDescribedByProp,
      ...inputProps
    } = props;

    const generatedId = React.useId();
    const id = idProp ?? `${generatedId}-partial-date`;
    const messageId = `${id}-message`;
    const bounds = React.useMemo<PartialDateBounds>(() => ({ min, max }), [min, max]);
    const precision = React.useMemo(
      () => ({ ...DEFAULT_PRECISION_LABELS, ...precisionLabels }),
      [precisionLabels],
    );

    // Latch controlledness on whether the prop was PASSED, not on whether it currently holds a
    // value. Empty is the ordinary starting state for this field - a birthday nobody knows - so a
    // controlled parent very often mounts with `value={undefined}`, and testing the value would
    // read that as uncontrolled and then fight the parent for the rest of the component's life.
    const isControlledRef = React.useRef('value' in props);
    const isControlled = isControlledRef.current;
    const [internalValue, setInternalValue] = React.useState<string | undefined>(
      () => normalizePartialDate(defaultValue) ?? undefined,
    );
    const value = isControlled ? valueProp : internalValue;
    const selected = parsePartialDate(value);

    // The input holds a DRAFT. Reconcile it with the prop during render (rather than in an effect,
    // which would flicker): adopt an incoming value only when it disagrees with what the draft
    // already says, so a controlled parent echoing our own emission back never rewrites lenient
    // text mid-edit, and an unparseable draft is not wiped by the `undefined` it caused.
    const [text, setText] = React.useState<string>(() => value ?? '');
    const [lastValue, setLastValue] = React.useState<string | undefined>(value);
    if (value !== lastValue) {
      setLastValue(value);
      const draftValue = normalizePartialDate(text) ?? undefined;
      if (value !== draftValue) setText(value ?? '');
    }

    const [open, setOpen] = React.useState(false);
    const [errorKind, setErrorKind] = React.useState<ErrorKind>(null);
    const [announcement, setAnnouncement] = React.useState('');

    const anchor = React.useMemo(() => {
      const now = today();
      if (selected) return { year: selected.year, month: selected.month ?? now.month };
      return { year: clampYear(now.year, bounds), month: now.month };
      // `selected` is derived from `value`; depending on the value keeps the anchor stable.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, bounds]);

    const [view, setView] = React.useState<PartialDatePickerView>(
      () => selected?.precision ?? defaultView,
    );
    const [cursor, setCursor] = React.useState<Cursor>(() => anchor);

    const inputRef = React.useRef<HTMLInputElement | null>(null);
    const panelRef = React.useRef<HTMLDivElement | null>(null);
    const pendingFocus = React.useRef(false);
    const closeReason = React.useRef<'select' | 'outside'>('select');

    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    /**
     * Move focus to the cell the panel considers current. All three levels use a roving tabindex,
     * so the one tabbable cell IS the current one - our own grids by construction, and the day
     * level by react-day-picker's own contract.
     */
    const focusPanelCell = React.useCallback(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const cell = panel.querySelector<HTMLElement>('[role="gridcell"] button[tabindex="0"]');
      if (cell) {
        cell.focus();
        return;
      }
      panel.focus();
    }, []);

    React.useEffect(() => {
      if (!pendingFocus.current) return;
      pendingFocus.current = false;
      focusPanelCell();
    });

    const emit = React.useCallback(
      (next: string | undefined) => {
        if (!isControlled) setInternalValue(next);
        onValueChange?.(next);
      },
      [isControlled, onValueChange],
    );

    const announce = React.useCallback(
      (next: string | undefined) => {
        if (!next) {
          setAnnouncement(clearedLabel);
          return;
        }
        const parts = parsePartialDate(next) as PartialDateParts;
        setAnnouncement(`${formatPartialDate(next, { locale })}, ${precision[parts.precision]}`);
      },
      [clearedLabel, locale, precision],
    );

    /**
     * Commit a value chosen in the popover. The draft only follows when uncontrolled: a controlled
     * parent that ignores `onValueChange` must see the field stay put, not pretend.
     */
    const commit = React.useCallback(
      (next: string | undefined) => {
        if (!isControlled) setText(next ?? '');
        emit(next);
        setErrorKind(null);
        announce(next);
      },
      [announce, emit, isControlled],
    );

    const closePopover = React.useCallback((reason: 'select' | 'outside') => {
      closeReason.current = reason;
      setOpen(false);
    }, []);

    const selectYear = React.useCallback(
      (year: number) => {
        if (!isPartialDateWithin(yearValue(year), bounds)) return;
        commit(yearValue(year));
        setCursor((previous) => ({ year, month: previous.month }));
        setView('month');
        pendingFocus.current = true;
      },
      [bounds, commit],
    );

    const selectMonth = React.useCallback(
      (year: number, month: number) => {
        if (!isPartialDateWithin(monthValue(year, month), bounds)) return;
        commit(monthValue(year, month));
        setCursor({ year, month });
        setView('day');
        pendingFocus.current = true;
      },
      [bounds, commit],
    );

    const selectDay = React.useCallback(
      (date: Date) => {
        // Bounded by the `disabled` matcher handed to Calendar, which is why there is no second
        // check here: react-day-picker does not select a day it has disabled.
        commit(dayValue(date.getFullYear(), date.getMonth() + 1, date.getDate()));
        closePopover('select');
      },
      [closePopover, commit],
    );

    const clearValue = React.useCallback(() => {
      commit(undefined);
      closePopover('select');
    }, [closePopover, commit]);

    /* -------------------------------------------------------------------- typing */

    const handleTextChange = React.useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const next = event.target.value;
        setText(next);
        // No error while typing: `1968-` is a legitimate halfway house, and a field that flashes
        // red at every keystroke teaches people to ignore it. The message is raised on blur.
        setErrorKind(null);
        const normalized = normalizePartialDate(next);
        if (normalized === null || !isPartialDateWithin(normalized, bounds)) {
          emit(undefined);
          return;
        }
        emit(normalized);
      },
      [bounds, emit],
    );

    const handleBlur = React.useCallback(
      (event: React.FocusEvent<HTMLInputElement>) => {
        onBlur?.(event);
        const trimmed = text.trim();
        if (trimmed === '') {
          setErrorKind(null);
          setText('');
          return;
        }
        const normalized = normalizePartialDate(trimmed);
        if (normalized === null) {
          setErrorKind('format');
          return;
        }
        if (!isPartialDateWithin(normalized, bounds)) {
          setErrorKind('range');
          return;
        }
        setErrorKind(null);
        setText(normalized);
      },
      [bounds, onBlur, text],
    );

    /* --------------------------------------------------------------- popover open */

    const handleOpenChange = React.useCallback(
      (next: boolean) => {
        // Guards opening only. Guarding both directions would trap an open popover on a field that
        // became disabled while it was showing.
        if (next && disabled) return;
        if (next) {
          // Re-open where the value actually is, not where the last visit wandered to.
          setView(selected?.precision ?? defaultView);
          setCursor(anchor);
          // A previous visit closed by clicking away must not leave that reason latched, or the
          // next Escape would decline to return focus to the field.
          closeReason.current = 'select';
        }
        setOpen(next);
      },
      [anchor, defaultView, disabled, selected?.precision],
    );

    const handleInputKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLInputElement>) => {
        onKeyDown?.(event);
        if (event.defaultPrevented || disabled) return;
        if (event.key !== 'ArrowDown') return;
        event.preventDefault();
        if (open) {
          focusPanelCell();
          return;
        }
        pendingFocus.current = true;
        // Through `handleOpenChange`, not `setOpen`: Radix only calls `onOpenChange` for ITS own
        // interactions, so opening the state directly here would skip the view, cursor and
        // close-reason resets that every other way in goes through.
        handleOpenChange(true);
      },
      [disabled, focusPanelCell, handleOpenChange, onKeyDown, open],
    );

    /* ------------------------------------------------------------------- the grids */

    const todayParts = today();
    const pageStart = pageStartFor(cursor.year);
    const pageEnd = pageStart + YEARS_PER_PAGE - 1;

    const yearCells = React.useMemo<GridCell[]>(() => {
      const cells: GridCell[] = [];
      for (let year = pageStart; year <= pageEnd; year += 1) {
        const cellValue = yearValue(year);
        cells.push({
          key: `year-${year}`,
          label: String(year),
          value: cellValue,
          selected: selected?.year === year,
          current: todayParts.year === year,
          disabled: !isPartialDateWithin(cellValue, bounds),
        });
      }
      return cells;
    }, [pageStart, pageEnd, selected?.year, todayParts.year, bounds]);

    const monthCells = React.useMemo<GridCell[]>(() => {
      const cells: GridCell[] = [];
      for (let month = 1; month <= 12; month += 1) {
        const cellValue = monthValue(cursor.year, month);
        cells.push({
          key: `month-${cursor.year}-${month}`,
          label: monthName(month, 'short', locale),
          value: cellValue,
          selected: selected?.year === cursor.year && selected?.month === month,
          current: todayParts.year === cursor.year && todayParts.month === month,
          disabled: !isPartialDateWithin(cellValue, bounds),
        });
      }
      return cells;
    }, [
      cursor.year,
      selected?.year,
      selected?.month,
      todayParts.year,
      todayParts.month,
      bounds,
      locale,
    ]);

    /* ------------------------------------------------------------ header navigation */

    let periodLabel = `${pageStart} - ${pageEnd}`;
    if (view === 'month') periodLabel = String(cursor.year);
    if (view === 'day') periodLabel = `${monthName(cursor.month, 'long', locale)} ${cursor.year}`;

    function canReach(target: Cursor, targetView: PartialDatePickerView): boolean {
      if (targetView === 'day')
        return isPartialDateWithin(monthValue(target.year, target.month), bounds);
      if (targetView === 'month') return isPartialDateWithin(yearValue(target.year), bounds);
      const start = pageStartFor(target.year);
      for (let year = start; year < start + YEARS_PER_PAGE; year += 1) {
        if (isPartialDateWithin(yearValue(year), bounds)) return true;
      }
      return false;
    }

    function stepped(delta: number): Cursor {
      if (view === 'day') return stepMonths(cursor, delta);
      if (view === 'month') return { year: cursor.year + delta, month: cursor.month };
      return { year: cursor.year + delta * YEARS_PER_PAGE, month: cursor.month };
    }

    const previousCursor = stepped(-1);
    const nextCursor = stepped(1);
    const canGoPrevious = canReach(previousCursor, view);
    const canGoNext = canReach(nextCursor, view);

    function step(delta: number) {
      const target = stepped(delta);
      if (!canReach(target, view)) return;
      setCursor(target);
    }

    function zoomOut() {
      if (view === 'day') setView('month');
      if (view === 'month') setView('year');
      pendingFocus.current = true;
    }

    /* ----------------------------------------------------------- grid keyboard model */

    function moveYear(delta: number) {
      setCursor((previous) => ({ ...previous, year: previous.year + delta }));
      pendingFocus.current = true;
    }

    function moveToYear(year: number) {
      setCursor((previous) => ({ ...previous, year }));
      pendingFocus.current = true;
    }

    function moveMonth(delta: number) {
      setCursor((previous) => stepMonths(previous, delta));
      pendingFocus.current = true;
    }

    function handleYearGridKeyDown(event: React.KeyboardEvent<HTMLTableElement>) {
      const index = cursor.year - pageStart;
      const rowStart = index - (index % YEAR_COLUMNS);
      const handlers: Record<string, () => void> = {
        ArrowLeft: () => moveYear(-1),
        ArrowRight: () => moveYear(1),
        ArrowUp: () => moveYear(-YEAR_COLUMNS),
        ArrowDown: () => moveYear(YEAR_COLUMNS),
        Home: () => moveToYear(pageStart + rowStart),
        End: () => moveToYear(pageStart + rowStart + YEAR_COLUMNS - 1),
        PageUp: () => moveYear(-YEARS_PER_PAGE),
        PageDown: () => moveYear(YEARS_PER_PAGE),
        Enter: () => selectYear(cursor.year),
        ' ': () => selectYear(cursor.year),
      };
      const handler = handlers[event.key];
      if (!handler) return;
      event.preventDefault();
      handler();
    }

    function handleMonthGridKeyDown(event: React.KeyboardEvent<HTMLTableElement>) {
      const index = cursor.month - 1;
      const rowStart = index - (index % MONTH_COLUMNS);
      const handlers: Record<string, () => void> = {
        ArrowLeft: () => moveMonth(-1),
        ArrowRight: () => moveMonth(1),
        ArrowUp: () => moveMonth(-MONTH_COLUMNS),
        ArrowDown: () => moveMonth(MONTH_COLUMNS),
        Home: () => setCursorMonth(rowStart + 1),
        End: () => setCursorMonth(rowStart + MONTH_COLUMNS),
        PageUp: () => moveMonth(-12),
        PageDown: () => moveMonth(12),
        Enter: () => selectMonth(cursor.year, cursor.month),
        ' ': () => selectMonth(cursor.year, cursor.month),
      };
      const handler = handlers[event.key];
      if (!handler) return;
      event.preventDefault();
      handler();
    }

    function setCursorMonth(month: number) {
      setCursor((previous) => ({ ...previous, month }));
      pendingFocus.current = true;
    }

    /* ------------------------------------------------------------------- rendering */

    const invalid =
      errorKind !== null ||
      (ariaInvalidProp != null && ariaInvalidProp !== false && ariaInvalidProp !== 'false');

    let messageText = announcement;
    let messageClassName = 'sr-only';
    if (errorKind === 'format') {
      messageText = invalidFormatMessage;
      messageClassName = 'mt-1 text-caption text-danger';
    }
    if (errorKind === 'range') {
      messageText = outOfRangeMessage ?? describeRange(min, max, locale);
      messageClassName = 'mt-1 text-caption text-danger';
    }

    const describedBy = [ariaDescribedByProp, messageId].filter(Boolean).join(' ');

    const minRange = partialDateRange(min);
    const maxRange = partialDateRange(max);
    const disabledDays: Matcher[] = [];
    if (minRange) disabledDays.push({ before: toCalendarDate(minRange.start) });
    if (maxRange) disabledDays.push({ after: toCalendarDate(maxRange.end) });

    let selectedDay: Date | undefined;
    if (selected?.precision === 'day') {
      selectedDay = toCalendarDate([
        selected.year,
        selected.month as number,
        selected.day as number,
      ]);
    }

    let periodControl = (
      <span className="flex-1 text-center text-sm font-medium text-text">{periodLabel}</span>
    );
    if (view !== 'year') {
      periodControl = (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={zoomOut}
          className="h-9 flex-1 text-sm font-medium hover:bg-muted-raised active:bg-muted-raised focus-visible:ring-offset-surface-raised"
        >
          {periodLabel}
          <span className="sr-only">{`, ${zoomOutLabel}`}</span>
        </Button>
      );
    }

    let clearControl = null;
    if (clearable && value !== undefined) {
      clearControl = (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clearValue}
          className="h-11 hover:bg-muted-raised active:bg-muted-raised focus-visible:ring-offset-surface-raised md:h-9"
        >
          {clearLabel}
        </Button>
      );
    }

    let level = (
      <PartialDateGrid
        label={periodLabel}
        rows={chunk(yearCells, YEAR_COLUMNS)}
        focusedValue={yearValue(cursor.year)}
        onActivate={(cell) => selectYear(Number(cell.label))}
        onKeyDown={handleYearGridKeyDown}
      />
    );
    if (view === 'month') {
      level = (
        <PartialDateGrid
          label={periodLabel}
          rows={chunk(monthCells, MONTH_COLUMNS)}
          focusedValue={monthValue(cursor.year, cursor.month)}
          onActivate={(cell) => {
            const parts = parsePartialDate(cell.value) as PartialDateParts;
            selectMonth(parts.year, parts.month as number);
          }}
          onKeyDown={handleMonthGridKeyDown}
        />
      );
    }
    if (view === 'day') {
      level = (
        <Calendar
          mode="single"
          month={toCalendarDate([cursor.year, cursor.month, 1])}
          onMonthChange={(month) =>
            setCursor({ year: month.getFullYear(), month: month.getMonth() + 1 })
          }
          selected={selectedDay}
          onSelect={(day) => {
            if (day) selectDay(day);
          }}
          startMonth={minRange ? toCalendarDate(minRange.start) : undefined}
          endMonth={maxRange ? toCalendarDate(maxRange.end) : undefined}
          disabled={disabledDays}
          hideNavigation
          autoFocus
          className="p-2"
          components={{ MonthCaption: NoMonthCaption }}
          classNames={{ day: CALENDAR_DAY, day_button: CALENDAR_DAY_BUTTON }}
        />
      );
    }

    return (
      <PopoverPrimitive.Root open={open} onOpenChange={handleOpenChange}>
        {/*
          One in-flow root. `Popover.Root` renders no DOM, so without this wrapper the field and its
          message would be two siblings, and a caller dropping the component into a flex row or a
          grid would get the message as its own track beside the field rather than a line under it.
          `sr-only` is `position: absolute`, so the region still takes no space while it is only
          carrying an announcement.
        */}
        <div className="flex flex-col">
          <InputGroup
            size={size}
            disabled={disabled}
            aria-invalid={invalid || undefined}
            className={className}
          >
            <InputGroupInput
              ref={inputRef}
              id={id}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              spellCheck={false}
              value={text}
              placeholder={placeholder}
              aria-describedby={describedBy}
              onChange={handleTextChange}
              onBlur={handleBlur}
              onKeyDown={handleInputKeyDown}
              {...inputProps}
            />
            <PopoverPrimitive.Trigger asChild>
              <InputGroupButton aria-label={openLabel} className="w-11 px-0 md:w-10">
                <CalendarGlyph />
              </InputGroupButton>
            </PopoverPrimitive.Trigger>
          </InputGroup>

          <p id={messageId} role="status" className={messageClassName}>
            {messageText}
          </p>
        </div>

        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            ref={panelRef}
            align="start"
            sideOffset={4}
            collisionPadding={8}
            aria-label={openLabel}
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              focusPanelCell();
            }}
            onInteractOutside={() => {
              closeReason.current = 'outside';
            }}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              // Focus goes back to the INPUT, not the trigger button: typing is a first-class path
              // here, so landing the caret in the field is what lets somebody correct a pick.
              if (closeReason.current === 'outside') return;
              inputRef.current?.focus();
            }}
            className="z-50 w-[22rem] max-w-[calc(100vw-1rem)] rounded-md border border-border bg-surface-raised p-0 text-text shadow-md md:w-72 data-[state=open]:animate-pop-in data-[state=closed]:animate-pop-out motion-reduce:animate-none"
          >
            <div className="flex items-center gap-1 border-b border-border p-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label={previousLabel}
                aria-disabled={!canGoPrevious || undefined}
                onClick={() => step(-1)}
                className="h-9 w-9 shrink-0 px-0 hover:bg-muted-raised active:bg-muted-raised focus-visible:ring-offset-surface-raised aria-disabled:pointer-events-none aria-disabled:opacity-50"
              >
                <ChevronGlyph orientation="left" />
              </Button>
              {periodControl}
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label={nextLabel}
                aria-disabled={!canGoNext || undefined}
                onClick={() => step(1)}
                className="h-9 w-9 shrink-0 px-0 hover:bg-muted-raised active:bg-muted-raised focus-visible:ring-offset-surface-raised aria-disabled:pointer-events-none aria-disabled:opacity-50"
              >
                <ChevronGlyph orientation="right" />
              </Button>
            </div>

            <p className="px-3 pt-2 text-caption text-text-muted">{hint}</p>

            {level}

            <div className="border-t border-border p-2">
              <div className="flex items-center justify-end gap-2">
                {clearControl}
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => closePopover('select')}
                  className="h-11 focus-visible:ring-offset-surface-raised md:h-9"
                >
                  {doneLabel}
                </Button>
              </div>
            </div>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    );
  },
);
PartialDatePicker.displayName = 'PartialDatePicker';

/* --------------------------------------------------------------------- the grid */

interface PartialDateGridProps {
  label: string;
  rows: GridCell[][];
  /** The cell that carries `tabIndex={0}` - the grid has exactly one tab stop (roving tabindex). */
  focusedValue: string;
  onActivate: (cell: GridCell) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLTableElement>) => void;
}

/**
 * The year and month grids, which share every rule: a real `<table role="grid">`, one tab stop, and
 * out-of-range cells that take `aria-disabled` (still reachable, activation ignored) rather than
 * the `disabled` attribute, so exploring the grid can never drop focus onto nothing.
 */
function PartialDateGrid({
  label,
  rows,
  focusedValue,
  onActivate,
  onKeyDown,
}: PartialDateGridProps) {
  return (
    <table
      role="grid"
      aria-label={label}
      className="w-full border-collapse p-2"
      onKeyDown={onKeyDown}
    >
      <tbody>
        {rows.map((row) => (
          <tr role="row" key={row[0]?.key}>
            {row.map((cell) => (
              <PartialDateGridCell
                key={cell.key}
                cell={cell}
                focused={cell.value === focusedValue}
                onActivate={onActivate}
              />
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

interface PartialDateGridCellProps {
  cell: GridCell;
  focused: boolean;
  onActivate: (cell: GridCell) => void;
}

function PartialDateGridCell({ cell, focused, onActivate }: PartialDateGridCellProps) {
  let current: 'date' | undefined;
  if (cell.current) current = 'date';

  return (
    <td role="gridcell" aria-selected={cell.selected} className="p-0.5 text-center">
      <button
        type="button"
        tabIndex={focused ? 0 : -1}
        aria-disabled={cell.disabled || undefined}
        aria-current={current}
        onClick={() => onActivate(cell)}
        className={cn(
          'inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-md text-sm font-normal text-text transition-colors hover:bg-muted-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised aria-disabled:pointer-events-none aria-disabled:opacity-50 md:h-9',
          cell.selected && 'bg-primary text-primary-foreground hover:bg-primary-hover',
          cell.current && !cell.selected && 'ring-1 ring-ring',
        )}
      >
        {cell.label}
      </button>
    </td>
  );
}

/* ------------------------------------------------------------------------ glyphs */
/* Inline SVG, matching the Calendar / Combobox recipe - canopy takes no icon dependency. */

function CalendarGlyph() {
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
      className="h-4 w-4 shrink-0"
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}

function ChevronGlyph({ orientation }: { orientation: 'left' | 'right' }) {
  let path = <path d="m9 18 6-6-6-6" />;
  if (orientation === 'left') path = <path d="m15 18-6-6 6-6" />;
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
      className="h-4 w-4"
    >
      {path}
    </svg>
  );
}

export { PartialDatePicker };
