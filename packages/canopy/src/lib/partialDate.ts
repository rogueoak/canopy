/**
 * partialDate - ISO 8601 reduced-precision calendar dates (spec 0073).
 *
 * A partial date is a string in exactly one of three shapes - `YYYY`, `YYYY-MM`, `YYYY-MM-DD` -
 * and its length carries its precision. It exists so a record can say what somebody actually
 * knows: `1968` is a complete answer, and it must never silently become 1 January 1968.
 *
 * Nothing here parses a date through `Date`. `new Date('1974-06')` is read as UTC midnight and
 * rendered in local time, so west of Greenwich it is MAY - the single bug this module exists to
 * make impossible. Every field is read from its own digits, month lengths come from a leap-year
 * rule, and ordering is tuple comparison. `Date` appears only where a calendar FIELD is
 * constructed locally and never parsed from a string: `today` and the `Intl` month name.
 *
 * Scope note: this is only the format. Weekday layout, day stepping and month navigation are NOT
 * here, because `Calendar` (spec 0060) already owns the day grid and PartialDatePicker composes it
 * rather than rebuilding it.
 */

/** How much of a date is known. The three shapes of the wire format, named. */
export type PartialDatePrecision = 'year' | 'month' | 'day';

/** A partial date read into its fields. `month` is 1-12; absent fields are absent, not zero. */
export interface PartialDateParts {
  /** The four-digit year. Always present - a partial date without a year is not a date. */
  year: number;
  /** The month, 1-12, when the value is month- or day-precision. */
  month?: number;
  /** The day of the month, 1-31, when the value is day-precision. */
  day?: number;
  /** Which of the three shapes this value is. */
  precision: PartialDatePrecision;
}

/** The bounds a partial date can be checked against. Both ends are themselves partial dates. */
export interface PartialDateBounds {
  /** Earliest allowed date, inclusive. A partial date - `1900` means "from the start of 1900". */
  min?: string;
  /** Latest allowed date, inclusive. A partial date - `2026` means "to the end of 2026". */
  max?: string;
}

/** Options for rendering a partial date as prose. */
export interface FormatPartialDateOptions {
  /** BCP 47 locale(s) for `Intl.DateTimeFormat`. Defaults to the runtime's locale. */
  locale?: string | string[];
}

/** Strict wire format: four-digit year, optional two-digit month, optional two-digit day. */
const WIRE = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/;

/**
 * Lenient entry format for typed text: `-`, `/` and `.` separate, month and day may be one or two
 * digits. The year stays exactly four digits - a two-digit year would have to guess a century, and
 * inventing a century is the same mistake as inventing a day.
 */
const TYPED = /^(\d{4})(?:[-/.](\d{1,2})(?:[-/.](\d{1,2}))?)?$/;

/** A calendar date as a comparable tuple. Not an instant - it names no time and no zone. */
type Ymd = [year: number, month: number, day: number];

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** Days in a given month, from the leap-year rule rather than from a `Date`. */
function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    if (isLeapYear(year)) return 29;
    return 28;
  }
  if (month === 4 || month === 6 || month === 9 || month === 11) return 30;
  return 31;
}

function partsFrom(
  year: number,
  month: number | undefined,
  day: number | undefined,
): PartialDateParts | null {
  // No upper year guard: both regexes cap the year at four digits, so one would be unreachable.
  if (!Number.isInteger(year) || year < 1) return null;
  if (month === undefined) return { year, precision: 'year' };
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;
  if (day === undefined) return { year, month, precision: 'month' };
  if (!Number.isInteger(day) || day < 1 || day > daysInMonth(year, month)) return null;
  return { year, month, day, precision: 'day' };
}

/**
 * Read a partial date in the wire format into its fields, or `null` if it is not one.
 *
 * Strict: exactly `YYYY`, `YYYY-MM` or `YYYY-MM-DD`, with real month and day numbers, so
 * `1969-02-29` is `null`. Use this to consume a stored value; use `normalizePartialDate` to accept
 * something a person typed.
 */
export function parsePartialDate(value: string | null | undefined): PartialDateParts | null {
  if (typeof value !== 'string') return null;
  const match = WIRE.exec(value);
  if (!match) return null;
  const [, year, month, day] = match;
  return partsFrom(
    Number(year),
    month === undefined ? undefined : Number(month),
    day === undefined ? undefined : Number(day),
  );
}

/** Render fields back into the wire format at their own precision. */
export function formatPartialDateParts(parts: PartialDateParts): string {
  const year = String(parts.year).padStart(4, '0');
  if (parts.precision === 'year' || parts.month === undefined) return year;
  const month = String(parts.month).padStart(2, '0');
  if (parts.precision === 'month' || parts.day === undefined) return `${year}-${month}`;
  return `${year}-${month}-${String(parts.day).padStart(2, '0')}`;
}

/**
 * Turn typed text into the wire format, or `null` if it does not name a date.
 *
 * Lenient about what a person types - surrounding space, `/` or `.` separators, a one-digit month
 * or day - and strict about what comes out: `1968-5-4` becomes `1968-05-04`. The year must still be
 * four digits.
 */
export function normalizePartialDate(text: string | null | undefined): string | null {
  if (typeof text !== 'string') return null;
  const match = TYPED.exec(text.trim());
  if (!match) return null;
  const [, year, month, day] = match;
  const parts = partsFrom(
    Number(year),
    month === undefined ? undefined : Number(month),
    day === undefined ? undefined : Number(day),
  );
  if (!parts) return null;
  return formatPartialDateParts(parts);
}

/** The first day the value could refer to. `1968` starts on 1968-01-01. */
function startOf(parts: PartialDateParts): Ymd {
  return [parts.year, parts.month ?? 1, parts.day ?? 1];
}

/** The last day the value could refer to. `1968` ends on 1968-12-31. */
function endOf(parts: PartialDateParts): Ymd {
  const month = parts.month ?? 12;
  const day = parts.day ?? daysInMonth(parts.year, month);
  return [parts.year, month, day];
}

function compareYmd(a: Ymd, b: Ymd): number {
  if (a[0] !== b[0]) return a[0] - b[0];
  if (a[1] !== b[1]) return a[1] - b[1];
  return a[2] - b[2];
}

/**
 * Whether a partial date is allowed by `min` / `max`.
 *
 * A partial date denotes an INTERVAL, not a point: `1968` is the whole of 1968. So the test is
 * whether the value's interval overlaps the allowed one, which is why `max: '2026-08-11'` still
 * admits `2026` - the year 2026 has partly happened, and saying "2026" claims nothing about a
 * future day - while refusing `2027` and `2026-09`. A point comparison would reject the honest
 * coarse answer, and that is why this is exported: a consumer's server should refuse a date with
 * the same rule the grid greys it out with.
 *
 * A value that is not a partial date is never within bounds. A bound that is not a partial date is
 * ignored, so a typo cannot silently forbid everything.
 */
export function isPartialDateWithin(
  value: string | null | undefined,
  bounds: PartialDateBounds = {},
): boolean {
  const parts = parsePartialDate(value);
  if (!parts) return false;
  const min = parsePartialDate(bounds.min);
  if (min && compareYmd(endOf(parts), startOf(min)) < 0) return false;
  const max = parsePartialDate(bounds.max);
  if (max && compareYmd(startOf(parts), endOf(max)) > 0) return false;
  return true;
}

/**
 * The first and last day a partial date could refer to, as calendar fields. `1968` spans
 * 1968-01-01 to 1968-12-31; a day-precision value spans one day. `null` if the value is not a
 * partial date.
 *
 * Used to hand `Calendar` (spec 0060) the `Date` bounds it needs. Fields, so the caller builds the
 * `Date` locally rather than parsing one.
 */
export function partialDateRange(
  value: string | null | undefined,
): { start: Ymd; end: Ymd } | null {
  const parts = parsePartialDate(value);
  if (!parts) return null;
  return { start: startOf(parts), end: endOf(parts) };
}

/**
 * A `Date` at the given calendar fields, in the local zone. The one sanctioned way to build a
 * `Date` from a partial date - a string is never parsed into one.
 *
 * `setFullYear` is not decoration: `new Date(79, 7, 24)` is **1979**, because the constructor
 * remaps years 0-99 onto 1900-1999. That would corrupt exactly the early years the four-digit wire
 * format advertises, so the year is always set explicitly afterwards.
 */
export function toCalendarDate(fields: Ymd): Date {
  const date = new Date(fields[0], fields[1] - 1, fields[2]);
  date.setFullYear(fields[0]);
  return date;
}

/**
 * A month's name, 1-12. Built from a local-field `Date` in an arbitrary year (only the month is
 * read from it), never from a parsed string.
 */
export function monthName(
  month: number,
  width: 'long' | 'short',
  locale?: string | string[],
): string {
  return new Intl.DateTimeFormat(locale, { month: width }).format(new Date(2001, month - 1, 1));
}

/**
 * Render a partial date as prose at its own precision: `1968`, `May 1968`, `14 May 1968` (exact
 * wording follows the locale). Returns an empty string for anything that is not a partial date.
 *
 * The `Date` handed to `Intl` is built from local calendar FIELDS and formatted in the same local
 * zone, so the day that goes in is the day that comes out. The value is never parsed into a `Date`.
 */
export function formatPartialDate(
  value: string | null | undefined,
  options: FormatPartialDateOptions = {},
): string {
  const parts = parsePartialDate(value);
  if (!parts) return '';
  const { locale } = options;
  const date = toCalendarDate(startOf(parts));
  const year = new Intl.DateTimeFormat(locale, { year: 'numeric' }).format(date);
  if (parts.precision === 'year') return year;
  const month = parts.month as number;
  if (parts.precision === 'month') return `${monthName(month, 'long', locale)} ${year}`;
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' }).format(
    date,
  );
}

/**
 * Today, as local calendar fields. `getFullYear` / `getMonth` / `getDate` read the LOCAL calendar,
 * which is what "today" means to the person looking at the screen; `toISOString()` would convert to
 * UTC and can name yesterday or tomorrow.
 */
export function today(): { year: number; month: number; day: number; precision: 'day' } {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
    precision: 'day',
  };
}
