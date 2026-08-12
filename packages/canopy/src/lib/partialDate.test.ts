import { afterEach, describe, expect, it } from 'vitest';
import {
  formatPartialDate,
  formatPartialDateParts,
  isPartialDateWithin,
  monthName,
  normalizePartialDate,
  parsePartialDate,
  partialDateRange,
  today,
} from './partialDate';

describe('parsePartialDate', () => {
  it('reads each of the three shapes at its own precision', () => {
    expect(parsePartialDate('1968')).toEqual({ year: 1968, precision: 'year' });
    expect(parsePartialDate('1968-05')).toEqual({ year: 1968, month: 5, precision: 'month' });
    expect(parsePartialDate('1968-05-14')).toEqual({
      year: 1968,
      month: 5,
      day: 14,
      precision: 'day',
    });
  });

  it('never invents a month or a day for a coarser value', () => {
    const parsed = parsePartialDate('1968');
    expect(parsed).not.toBeNull();
    expect(parsed?.month).toBeUndefined();
    expect(parsed?.day).toBeUndefined();
  });

  it('rejects anything that is not one of the three shapes', () => {
    for (const value of [
      '68',
      '196',
      '19680',
      '1968-5',
      '1968-05-4',
      '1968/05/14',
      '1968-05-14T00:00:00Z',
      '1968-05-14 ',
      'yesterday',
      '',
      '-1968',
    ]) {
      expect(parsePartialDate(value), value).toBeNull();
    }
  });

  it('rejects impossible month and day numbers', () => {
    expect(parsePartialDate('1968-00')).toBeNull();
    expect(parsePartialDate('1968-13')).toBeNull();
    expect(parsePartialDate('1968-05-00')).toBeNull();
    expect(parsePartialDate('1968-05-32')).toBeNull();
    expect(parsePartialDate('1968-04-31')).toBeNull();
  });

  it('knows the length of every month, not just a representative one', () => {
    const lengths: Record<number, number> = {
      1: 31,
      2: 28,
      3: 31,
      4: 30,
      5: 31,
      6: 30,
      7: 31,
      8: 31,
      9: 30,
      10: 31,
      11: 30,
      12: 31,
    };
    for (const [month, length] of Object.entries(lengths)) {
      const mm = month.padStart(2, '0');
      expect(parsePartialDate(`1969-${mm}-${length}`), `1969-${mm}-${length}`).not.toBeNull();
      expect(parsePartialDate(`1969-${mm}-${length + 1}`), `1969-${mm}-${length + 1}`).toBeNull();
    }
  });

  it('applies the full leap-year rule, not just divisible-by-four', () => {
    expect(parsePartialDate('1968-02-29')).not.toBeNull();
    expect(parsePartialDate('1969-02-29')).toBeNull();
    // 1900 is divisible by 4 but not a leap year; 2000 is, because of the 400 rule.
    expect(parsePartialDate('1900-02-29')).toBeNull();
    expect(parsePartialDate('2000-02-29')).not.toBeNull();
  });

  it('rejects a non-string', () => {
    expect(parsePartialDate(undefined)).toBeNull();
    expect(parsePartialDate(null)).toBeNull();
  });

  it('rejects year zero, which the four-digit shape can otherwise express', () => {
    expect(parsePartialDate('0000')).toBeNull();
    expect(parsePartialDate('0001')).not.toBeNull();
  });
});

describe('normalizePartialDate', () => {
  it('accepts what a person types and returns what the wire wants', () => {
    expect(normalizePartialDate('1968')).toBe('1968');
    expect(normalizePartialDate('1968-5')).toBe('1968-05');
    expect(normalizePartialDate('1968-5-4')).toBe('1968-05-04');
    expect(normalizePartialDate('1968/05/14')).toBe('1968-05-14');
    expect(normalizePartialDate('1968.5.4')).toBe('1968-05-04');
    expect(normalizePartialDate('  1968-05  ')).toBe('1968-05');
  });

  it('refuses a two-digit year rather than guessing a century', () => {
    expect(normalizePartialDate('68')).toBeNull();
    expect(normalizePartialDate('68-05-14')).toBeNull();
  });

  it('refuses a partial keystroke that does not yet name a date', () => {
    expect(normalizePartialDate('196')).toBeNull();
    expect(normalizePartialDate('1968-')).toBeNull();
    expect(normalizePartialDate('1968-05-')).toBeNull();
  });

  it('refuses an impossible date however it is punctuated', () => {
    expect(normalizePartialDate('1969/2/29')).toBeNull();
    expect(normalizePartialDate('1968-13-01')).toBeNull();
  });

  it('rejects a non-string', () => {
    expect(normalizePartialDate(undefined)).toBeNull();
  });
});

describe('formatPartialDateParts', () => {
  it('round-trips each precision', () => {
    expect(formatPartialDateParts({ year: 1968, precision: 'year' })).toBe('1968');
    expect(formatPartialDateParts({ year: 1968, month: 5, precision: 'month' })).toBe('1968-05');
    expect(formatPartialDateParts({ year: 1968, month: 5, day: 4, precision: 'day' })).toBe(
      '1968-05-04',
    );
  });

  it('pads a short year to four digits', () => {
    expect(formatPartialDateParts({ year: 5, precision: 'year' })).toBe('0005');
  });

  it('honours the precision even when finer fields are present', () => {
    expect(formatPartialDateParts({ year: 1968, month: 5, day: 14, precision: 'year' })).toBe(
      '1968',
    );
    expect(formatPartialDateParts({ year: 1968, month: 5, day: 14, precision: 'month' })).toBe(
      '1968-05',
    );
  });
});

describe('isPartialDateWithin', () => {
  it('admits a coarse value whose interval overlaps the bound', () => {
    // The whole point: 2026 has partly happened, so a year-only answer of 2026 claims nothing
    // about a future day and must be allowed.
    expect(isPartialDateWithin('2026', { max: '2026-08-11' })).toBe(true);
    expect(isPartialDateWithin('2026-08', { max: '2026-08-11' })).toBe(true);
  });

  it('refuses a value whose interval starts after the bound ends', () => {
    expect(isPartialDateWithin('2027', { max: '2026-08-11' })).toBe(false);
    expect(isPartialDateWithin('2026-09', { max: '2026-08-11' })).toBe(false);
    expect(isPartialDateWithin('2026-08-12', { max: '2026-08-11' })).toBe(false);
  });

  it('refuses a value whose interval ends before the lower bound starts', () => {
    expect(isPartialDateWithin('1899', { min: '1900' })).toBe(false);
    expect(isPartialDateWithin('1900-01-01', { min: '1900' })).toBe(true);
    expect(isPartialDateWithin('1899-12', { min: '1900-01-01' })).toBe(false);
  });

  it('expands a month bound to the end of that month', () => {
    expect(isPartialDateWithin('1968-05-31', { max: '1968-05' })).toBe(true);
    expect(isPartialDateWithin('1968-06-01', { max: '1968-05' })).toBe(false);
    // February in a leap year ends on the 29th, so the expansion must use the leap rule.
    expect(isPartialDateWithin('1968-02-29', { max: '1968-02' })).toBe(true);
    expect(isPartialDateWithin('1969-02-28', { max: '1969-02' })).toBe(true);
  });

  it('applies both ends together', () => {
    const bounds = { min: '1900', max: '2026-08-11' };
    expect(isPartialDateWithin('1968-05-14', bounds)).toBe(true);
    expect(isPartialDateWithin('1899-12-31', bounds)).toBe(false);
    expect(isPartialDateWithin('2026-12-31', bounds)).toBe(false);
  });

  it('is true with no bounds at all, for any valid partial date', () => {
    expect(isPartialDateWithin('1968')).toBe(true);
    expect(isPartialDateWithin('1968', {})).toBe(true);
  });

  it('is false for a value that is not a partial date, bounds or no bounds', () => {
    expect(isPartialDateWithin('68')).toBe(false);
    expect(isPartialDateWithin(undefined)).toBe(false);
    expect(isPartialDateWithin('1969-02-29', { min: '1900' })).toBe(false);
  });

  it('ignores a bound that is not a partial date rather than forbidding everything', () => {
    expect(isPartialDateWithin('1968', { min: 'nonsense' })).toBe(true);
    expect(isPartialDateWithin('1968', { max: 'nonsense' })).toBe(true);
  });
});

describe('partialDateRange', () => {
  it('expands each precision to the interval it denotes', () => {
    expect(partialDateRange('1968')).toEqual({ start: [1968, 1, 1], end: [1968, 12, 31] });
    expect(partialDateRange('1968-05')).toEqual({ start: [1968, 5, 1], end: [1968, 5, 31] });
    expect(partialDateRange('1968-05-14')).toEqual({ start: [1968, 5, 14], end: [1968, 5, 14] });
  });

  it('ends February on the right day in each kind of year', () => {
    expect(partialDateRange('1968-02')?.end).toEqual([1968, 2, 29]);
    expect(partialDateRange('1900-02')?.end).toEqual([1900, 2, 28]);
  });

  it('is null for anything that is not a partial date', () => {
    expect(partialDateRange('68')).toBeNull();
  });
});

describe('formatPartialDate', () => {
  it('renders each precision without inventing the fields it does not have', () => {
    expect(formatPartialDate('1968', { locale: 'en-GB' })).toBe('1968');
    expect(formatPartialDate('1968-05', { locale: 'en-GB' })).toBe('May 1968');
    expect(formatPartialDate('1968-05-14', { locale: 'en-GB' })).toBe('14 May 1968');
  });

  it('does not leak a month or a day into a year-only value', () => {
    const rendered = formatPartialDate('1968', { locale: 'en-GB' });
    expect(rendered).toBe('1968');
    expect(rendered).not.toMatch(/January|Jan|\b1\b/);
  });

  it('follows the locale', () => {
    expect(formatPartialDate('1968-05-14', { locale: 'en-US' })).toBe('May 14, 1968');
    expect(formatPartialDate('1968-05', { locale: 'de-DE' })).toBe('Mai 1968');
  });

  it('is an empty string for anything that is not a partial date', () => {
    expect(formatPartialDate('68')).toBe('');
    expect(formatPartialDate(undefined)).toBe('');
  });
});

describe('monthName', () => {
  it('names every month at both widths, off by no months', () => {
    expect(monthName(1, 'long', 'en-GB')).toBe('January');
    expect(monthName(12, 'long', 'en-GB')).toBe('December');
    expect(monthName(5, 'short', 'en-GB')).toBe('May');
    expect(monthName(2, 'long', 'en-GB')).toBe('February');
  });
});

describe('today', () => {
  it('reads the local calendar, matching a locally constructed Date', () => {
    const now = new Date();
    expect(today()).toEqual({
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
      precision: 'day',
    });
  });
});

/**
 * The timezone pin. `new Date('1974-06')` is parsed as UTC midnight and rendered in local time, so
 * anywhere west of Greenwich it is MAY - the exact bug the consuming product shipped. These tests
 * first prove the trap is live in the zone (so they cannot pass vacuously in UTC) and then prove
 * this module is unaffected.
 *
 * Node re-reads `process.env.TZ` for each subsequent Date operation, so the zone can be switched
 * inside the test.
 */
describe('partial dates are read by their digits, never through Date', () => {
  const originalTz = process.env.TZ;

  afterEach(() => {
    process.env.TZ = originalTz;
  });

  /**
   * A spread of offsets, west and east. `new Date('1974-06')` is UTC midnight, so only a NEGATIVE
   * offset can drag the date backwards - which is why the trap assertions below name western zones
   * specifically, while the invariance assertions sweep the whole spread.
   */
  const zones = [
    'America/Los_Angeles',
    'America/New_York',
    'UTC',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Pacific/Kiritimati',
  ];

  it.each(['America/Los_Angeles', 'America/New_York'])(
    'reads 1974-06 as June in %s, where Date reads May',
    (zone) => {
      process.env.TZ = zone;

      // The trap, live in this zone. If this assertion ever fails the test below proves nothing,
      // so it is asserted rather than assumed.
      expect(new Date('1974-06').getMonth()).toBe(4);

      expect(parsePartialDate('1974-06')).toEqual({ year: 1974, month: 6, precision: 'month' });
      expect(normalizePartialDate('1974-6')).toBe('1974-06');
      expect(formatPartialDate('1974-06', { locale: 'en-GB' })).toBe('June 1974');
    },
  );

  it('does not shift a January day backwards into the previous year', () => {
    process.env.TZ = 'America/Los_Angeles';
    expect(new Date('1974-01-01').getFullYear()).toBe(1973);

    expect(parsePartialDate('1974-01-01')).toEqual({
      year: 1974,
      month: 1,
      day: 1,
      precision: 'day',
    });
    expect(formatPartialDate('1974-01-01', { locale: 'en-GB' })).toBe('1 January 1974');
  });

  it('gives byte-identical answers in every zone, west and east', () => {
    const answers = zones.map((zone) => {
      process.env.TZ = zone;
      return JSON.stringify({
        zone: 'pinned',
        year: parsePartialDate('1974'),
        month: parsePartialDate('1974-06'),
        firstOfYear: parsePartialDate('1974-01-01'),
        lastOfYear: parsePartialDate('1974-12-31'),
        normalized: normalizePartialDate('1974/6/1'),
        prose: formatPartialDate('1974-01-01', { locale: 'en-GB' }),
        januaryName: monthName(1, 'long', 'en-GB'),
        decemberName: monthName(12, 'long', 'en-GB'),
      });
    });
    expect(new Set(answers).size, `differed across ${zones.join(', ')}`).toBe(1);
    expect(JSON.parse(answers[0]).prose).toBe('1 January 1974');
    expect(JSON.parse(answers[0]).month).toEqual({ year: 1974, month: 6, precision: 'month' });
  });

  it('compares bounds by digits, so a boundary date is not nudged across it by the zone', () => {
    for (const zone of zones) {
      process.env.TZ = zone;
      expect(isPartialDateWithin('1974-01-01', { min: '1974' }), zone).toBe(true);
      expect(isPartialDateWithin('1973-12-31', { min: '1974' }), zone).toBe(false);
      expect(isPartialDateWithin('1974-12-31', { max: '1974' }), zone).toBe(true);
      expect(isPartialDateWithin('1975-01-01', { max: '1974' }), zone).toBe(false);
    }
  });
});
