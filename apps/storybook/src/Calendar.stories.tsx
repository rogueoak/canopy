import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Calendar } from '@rogueoak/canopy/branches';

/** A minimal range shape, matching react-day-picker's `{ from, to }` selection value. */
type DateRange = { from: Date | undefined; to?: Date | undefined };

/**
 * Branches/Calendar - the date-grid Branch (spec 0060), built on `react-day-picker` v9 (which
 * uses `date-fns` for date math). It renders an accessible month grid with single / range /
 * multiple selection, previous / next month navigation, disabled dates, and full keyboard
 * operation, and is the foundation for the popover-backed `DatePicker` (spec 0065).
 *
 * It follows the 0005 recipe: react-day-picker is skinned entirely through its `classNames` maps
 * with full literal semantic-token utilities - the selected day is `bg-primary` /
 * `text-primary-foreground`, today carries a `ring` marker, outside days are `text-text-muted`,
 * and disabled days use the toggle-style `opacity-50` + `cursor-not-allowed`. There is NO
 * per-story theme code: toggle the toolbar Light / Dark control and every story re-themes through
 * the token layer (spec 0004).
 */
const meta = {
  title: 'Branches/Calendar',
  component: Calendar,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

/* A fixed month so the catalog renders the same grid regardless of the current date. */
const DEFAULT_MONTH = new Date(2024, 5, 1);

/* --------------------------------------------------------------- Playground */

/**
 * The default single-month grid in single-select mode. Pick a day; today shows the ring marker
 * and outside days are muted.
 */
export const Playground: Story = {
  args: { mode: 'single', defaultMonth: DEFAULT_MONTH },
};

/* ------------------------------------------------------------------- Single */

/** Single mode: exactly one day is selected; picking another moves the selection. */
export const Single: Story = {
  render: () => {
    const Demo = () => {
      const [selected, setSelected] = useState<Date | undefined>(new Date(2024, 5, 12));
      return (
        <Calendar mode="single" defaultMonth={DEFAULT_MONTH} selected={selected} onSelect={setSelected} />
      );
    };
    return <Demo />;
  },
};

/* -------------------------------------------------------------------- Range */

/**
 * Range mode: click a start day then an end day to select a `{ from, to }` span; the in-between
 * days render with the highlighted middle band while the endpoints stay `bg-primary`.
 */
export const Range: Story = {
  render: () => {
    const Demo = () => {
      const [range, setRange] = useState<DateRange | undefined>({
        from: new Date(2024, 5, 9),
        to: new Date(2024, 5, 14),
      });
      return <Calendar mode="range" defaultMonth={DEFAULT_MONTH} selected={range} onSelect={setRange} />;
    };
    return <Demo />;
  },
};

/* ----------------------------------------------------------------- Multiple */

/** Multiple mode: pick a set of independent days; re-picking a day toggles it back off. */
export const Multiple: Story = {
  render: () => {
    const Demo = () => {
      const [days, setDays] = useState<Date[] | undefined>([
        new Date(2024, 5, 4),
        new Date(2024, 5, 11),
        new Date(2024, 5, 18),
      ]);
      return <Calendar mode="multiple" defaultMonth={DEFAULT_MONTH} selected={days} onSelect={setDays} />;
    };
    return <Demo />;
  },
};

/* ------------------------------------------------------------ DisabledDates */

/**
 * Disabled dates via the `disabled` matcher render inert with `opacity-50` + `cursor-not-allowed`
 * and cannot be selected. Here every weekend plus a fixed mid-month day are disabled.
 */
export const DisabledDates: Story = {
  render: () => {
    const Demo = () => {
      const [selected, setSelected] = useState<Date>();
      return (
        <Calendar
          mode="single"
          defaultMonth={DEFAULT_MONTH}
          selected={selected}
          onSelect={setSelected}
          disabled={[{ dayOfWeek: [0, 6] }, new Date(2024, 5, 12)]}
        />
      );
    };
    return <Demo />;
  },
};
