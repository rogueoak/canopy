import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { DatePicker, PartialDatePicker, formatPartialDate } from '@rogueoak/canopy/branches';
import {
  FormField,
  FormFieldControl,
  FormFieldDescription,
  FormFieldLabel,
} from '@rogueoak/canopy/twigs';

/**
 * Branches/PartialDatePicker - the date field for a date somebody remembers (spec 0073), the
 * follow-on to `DatePicker` (0065) rather than a replacement for it.
 *
 * `DatePicker` selects a `Date`, which is always a specific day. This one's value is an ISO 8601
 * reduced-precision string - `YYYY`, `YYYY-MM` or `YYYY-MM-DD` - so `1968` can stay `1968` instead
 * of quietly becoming 1 January 1968. Precision is expressed by where you stop: pick a year and
 * you are done, or carry on into months and days.
 *
 * The day level is canopy's own `Calendar` (0060), composed rather than rebuilt. Typing works
 * throughout - somebody who knows the date types it faster than they can click it.
 *
 * No per-story theme code: toggle the toolbar Light / Dark control and every story, including the
 * portalled popover, re-themes through the token layer (spec 0004).
 */
const meta = {
  title: 'Branches/PartialDatePicker',
  component: PartialDatePicker,
  parameters: { layout: 'centered' },
  argTypes: {
    defaultView: { control: 'inline-radio', options: ['year', 'month', 'day'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof PartialDatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/* --------------------------------------------------------------- Playground */

/** Open it, pick a year, and stop. Or carry on into months and days. */
export const Playground: Story = {
  args: { 'aria-label': 'Date', className: 'w-72' },
};

/* ---------------------------------------------------------------- Year only */

function YearOnlyExample() {
  const [value, setValue] = useState<string | undefined>('1968');
  return (
    <div className="flex w-72 flex-col gap-3">
      <PartialDatePicker aria-label="Birthday" value={value} onValueChange={setValue} />
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-caption text-text-muted">
        <dt>Stored</dt>
        <dd className="text-text">
          <code>{value ?? 'null'}</code>
        </dd>
        <dt>Reads as</dt>
        <dd className="text-text">{formatPartialDate(value) || 'unknown'}</dd>
      </dl>
    </div>
  );
}

/**
 * The headline case. The stored value stays `1968` - there is no day in it to be read by accident,
 * because none was ever given. Pick a month to refine it to `1968-05`, and a day for `1968-05-14`;
 * zoom back out with the period button and re-pick the year to truncate it again.
 */
export const YearOnly: Story = {
  render: () => <YearOnlyExample />,
};

/* ------------------------------------------------------------------- Typing */

function TypingExample() {
  const [value, setValue] = useState<string | undefined>();
  return (
    <div className="flex w-72 flex-col gap-3">
      <PartialDatePicker aria-label="Date" value={value} onValueChange={setValue} />
      <p className="text-caption text-text-muted">
        Try <code>1968</code>, <code>1968-05</code>, <code>1968/5/14</code>. Stored:{' '}
        <code className="text-text">{value ?? 'null'}</code>
      </p>
    </div>
  );
}

/**
 * Typing is a first-class path, not a fallback. Input is lenient about punctuation and padding and
 * output is always canonical; a two-digit year is refused rather than guessed at, and nothing is
 * marked invalid until you leave the field.
 */
export const Typing: Story = {
  render: () => <TypingExample />,
};

/* ------------------------------------------------------------------- Bounds */

/**
 * `min` and `max` are partial dates too, and they are interval overlaps: with a maximum of today,
 * `2026` is still offered (the year has partly happened and claims nothing about a future day)
 * while `2027` is greyed out. This is the memory-date field of an archive: nothing in the future,
 * nothing before photography.
 */
export const Bounds: Story = {
  args: {
    'aria-label': 'When it happened',
    min: '1826',
    max: '2026-08-11',
    defaultValue: '2026',
    className: 'w-72',
  },
};

/* -------------------------------------------------------------------- Empty */

/** A date nobody knows is a legitimate answer: leave it empty, or use Clear to get back to it. */
export const Empty: Story = {
  args: { 'aria-label': 'Birthday', placeholder: 'Not known', className: 'w-72' },
};

/* ------------------------------------------------------------ Starting on days */

/** For a field whose dates are usually recent, `defaultView="day"` opens on the calendar instead. */
export const StartingOnDays: Story = {
  args: { 'aria-label': 'Date', defaultView: 'day', className: 'w-72' },
};

/* ----------------------------------------------------------------- Disabled */

/** Disabled renders the field inert with the shared disabled tokens and does not open. */
export const Disabled: Story = {
  args: { 'aria-label': 'Birthday', defaultValue: '1968-05', disabled: true, className: 'w-72' },
};

/* ------------------------------------------------------------------ Invalid */

/** `aria-invalid` applies the danger frame, exactly as it does on an Input or a Select. */
export const Invalid: Story = {
  args: { 'aria-label': 'Birthday', 'aria-invalid': true, className: 'w-72' },
};

/* -------------------------------------------------------------------- Sizes */

/** The field follows the Input size scale. */
export const Sizes: Story = {
  render: () => (
    <div className="flex w-72 flex-col gap-3">
      <PartialDatePicker aria-label="Small" size="sm" defaultValue="1968" />
      <PartialDatePicker aria-label="Medium" size="md" defaultValue="1968-05" />
      <PartialDatePicker aria-label="Large" size="lg" defaultValue="1968-05-14" />
    </div>
  ),
};

/* --------------------------------------------------------------- In a form */

/** Paired with `FormField` (0020), which supplies the label and description wiring. */
export const InAFormField: Story = {
  render: () => (
    <FormField className="w-80">
      <FormFieldLabel>Birthday</FormFieldLabel>
      <FormFieldControl>
        <PartialDatePicker max="2026-08-11" />
      </FormFieldControl>
      <FormFieldDescription>However much you know. A year on its own is fine.</FormFieldDescription>
    </FormField>
  ),
};

/* ------------------------------------------------------------ Which to use */

function ComparisonExample() {
  const [partial, setPartial] = useState<string | undefined>('1968');
  const [exact, setExact] = useState<Date | undefined>(new Date(2026, 7, 11));
  return (
    <div className="flex w-96 flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-label text-text">PartialDatePicker - a date somebody remembers</p>
        <PartialDatePicker aria-label="Birthday" value={partial} onValueChange={setPartial} />
        <p className="text-caption text-text-muted">
          Value: <code className="text-text">{partial ?? 'null'}</code> (a string, at whatever
          precision was given)
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-label text-text">DatePicker - a day you are choosing</p>
        <DatePicker aria-label="Due date" value={exact} onValueChange={setExact} />
        <p className="text-caption text-text-muted">
          Value: <code className="text-text">{exact?.toDateString() ?? 'null'}</code> (a Date,
          always a specific day)
        </p>
      </div>
    </div>
  );
}

/**
 * Which one to reach for. `DatePicker` (0065) is unchanged and still right whenever a day is what
 * you mean - a due date, a booking, a filter. Reach for `PartialDatePicker` when the honest answer
 * might be coarser than a day, and a made-up day would be a lie rather than a default.
 */
export const WhichToUse: Story = {
  render: () => <ComparisonExample />,
};
