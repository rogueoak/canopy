import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { DatePicker } from '@rogueoak/canopy/branches';

/** A minimal range shape, matching react-day-picker's `{ from, to }` selection value. */
type DateRange = { from: Date | undefined; to?: Date | undefined };

/**
 * Branches/DatePicker - the popover date-field Branch (spec 0065). It composes canopy's
 * `Calendar` (0060) inside a `@radix-ui/react-popover` shell opened by a `Button`-idiom trigger
 * that shows the chosen date formatted back via `date-fns`. One `mode` prop switches between a
 * single `Date` (pick commits and closes) and a `{ from, to }` range (the popover stays open
 * until both ends are set).
 *
 * It follows the 0005 recipe: full literal semantic-token utilities, `cn()` merge (caller wins),
 * `forwardRef` + native prop spread, and NO per-story theme code - toggle the toolbar Light /
 * Dark control and every story (including the portalled popover) re-themes through the token
 * layer (spec 0004).
 */
const meta = {
  title: 'Branches/DatePicker',
  component: DatePicker,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/* --------------------------------------------------------------- Playground */

/** The default single-date field: click the trigger, pick a day, see it formatted back. */
export const Playground: Story = {
  args: { mode: 'single', placeholder: 'Pick a date' },
};

/* ------------------------------------------------------------------- Single */

/** Single mode: picking a day sets the value, closes the popover, and formats the trigger. */
export const Single: Story = {
  render: () => {
    const Demo = () => {
      const [value, setValue] = useState<Date | undefined>(new Date(2024, 5, 12));
      return <DatePicker mode="single" value={value} onValueChange={setValue} />;
    };
    return <Demo />;
  },
};

/* -------------------------------------------------------------------- Range */

/** Range mode: the trigger shows `from - to`; the popover stays open until the range completes. */
export const Range: Story = {
  render: () => {
    const Demo = () => {
      const [value, setValue] = useState<DateRange | undefined>({
        from: new Date(2024, 5, 9),
        to: new Date(2024, 5, 14),
      });
      return (
        <DatePicker
          mode="range"
          value={value}
          onValueChange={setValue}
          placeholder="Pick a range"
        />
      );
    };
    return <Demo />;
  },
};

/* -------------------------------------------------------------- Placeholder */

/** An unset value reads as the muted placeholder text. */
export const Placeholder: Story = {
  args: { mode: 'single', placeholder: 'Select a due date' },
};

/* ----------------------------------------------------------------- Disabled */

/** Disabled renders the trigger inert with the shared disabled tokens and does not open. */
export const Disabled: Story = {
  args: { mode: 'single', disabled: true, placeholder: 'Pick a date' },
};

/* ------------------------------------------------------------------ Invalid */

/** `aria-invalid` applies the danger border / ring, exactly like an invalid Input / Select. */
export const Invalid: Story = {
  args: { mode: 'single', 'aria-invalid': true, placeholder: 'Pick a date' },
};

/* --------------------------------------------------------------- Controlled */

/** Controlled: the parent owns the value and echoes the current selection beside the field. */
export const Controlled: Story = {
  render: () => {
    const Demo = () => {
      const [value, setValue] = useState<Date | undefined>();
      return (
        <div className="flex flex-col items-start gap-3">
          <DatePicker mode="single" value={value} onValueChange={setValue} format="PPP" />
          <p className="text-body-sm text-text-muted">
            Selected: {value ? value.toDateString() : 'none'}
          </p>
        </div>
      );
    };
    return <Demo />;
  },
};
