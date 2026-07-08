import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Combobox, type ComboboxOption } from '@rogueoak/canopy/branches';
import { Label } from '@rogueoak/canopy/seeds';

/**
 * Branches/Combobox - the filterable-select Branch (spec 0030), built on `@radix-ui/react-popover`
 * (the portalled popover shell) and `cmdk` (the filterable listbox: search input, keyboard
 * navigation, no-results slot). It lives in the Branches tier (like `Dialog`): it owns
 * interaction state and a portal, and composes the `Badge` Seed for its multi-select chips.
 *
 * Single-select reads like `Select` (pick commits and closes) with a type-to-filter input at the
 * top of the list; multi-select renders the chosen options as removable `Badge` chips in the
 * field, keeps the popover open across picks, and drops the last chip on `Backspace` in the empty
 * search input. There is NO per-story theme code: toggle the toolbar Light / Dark control and
 * every story - including the portalled popup - re-themes via the token layer (spec 0004).
 *
 * Note: filtering is client-side over the provided `options` for v1; async / remote search is a
 * follow-up (spec 0030 Out of scope).
 */
const meta = {
  title: 'Branches/Combobox',
  component: Combobox,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

/* A short reusable option set. */
const FRUITS: ComboboxOption[] = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Blueberry', value: 'blueberry' },
  { label: 'Grape', value: 'grape' },
  { label: 'Pineapple', value: 'pineapple' },
];

/* A long option set for the filtering / scroll story. */
const COUNTRIES: ComboboxOption[] = [
  'Argentina',
  'Australia',
  'Brazil',
  'Canada',
  'Chile',
  'Denmark',
  'Egypt',
  'Finland',
  'France',
  'Germany',
  'Greece',
  'Iceland',
  'India',
  'Ireland',
  'Italy',
  'Japan',
  'Kenya',
  'Mexico',
  'Morocco',
  'Netherlands',
  'New Zealand',
  'Norway',
  'Peru',
  'Portugal',
  'Spain',
  'Sweden',
  'Switzerland',
  'Thailand',
  'Turkey',
  'United Kingdom',
  'United States',
  'Vietnam',
].map((name) => ({ label: name, value: name.toLowerCase().replace(/\s+/g, '-') }));

/* ------------------------------------------------------------- SingleSelect */

/**
 * A single-select Combobox: type to filter, pick to commit and close. Reads like `Select` with a
 * search box at the top of the list.
 */
export const SingleSelect: Story = {
  render: () => {
    const Demo = () => {
      const [value, setValue] = useState<string>();
      return (
        <div className="flex w-64 flex-col gap-2">
          <Label htmlFor="fruit">Favourite fruit</Label>
          <Combobox
            id="fruit"
            options={FRUITS}
            value={value}
            onValueChange={setValue}
            placeholder="Pick a fruit"
            searchPlaceholder="Search fruit..."
          />
        </div>
      );
    };
    return <Demo />;
  },
};

/* ------------------------------------------------------- MultiSelectWithBadges */

/* A fruit set with one out-of-stock option to show the per-option `data-[disabled]` dimming. */
const FRUITS_WITH_DISABLED: ComboboxOption[] = FRUITS.map((option) =>
  option.value === 'blueberry'
    ? { ...option, label: 'Blueberry (out of stock)', disabled: true }
    : option,
);

/**
 * The priority path: multi-select. Picked options render as removable `Badge` chips in the field;
 * the popover stays open across picks, re-picking toggles a value off, and `Backspace` in the
 * empty search input removes the last chip. One option is `disabled` to show the dimmed,
 * non-selectable item state. Filtering is client-side (async is a follow-up).
 */
export const MultiSelectWithBadges: Story = {
  render: () => {
    const Demo = () => {
      const [value, setValue] = useState<string[]>(['apple', 'grape']);
      return (
        <div className="flex w-72 flex-col gap-2">
          <Label htmlFor="fruits">Fruit basket</Label>
          <Combobox
            multiple
            id="fruits"
            options={FRUITS_WITH_DISABLED}
            value={value}
            onValueChange={setValue}
            placeholder="Add fruit..."
            searchPlaceholder="Search fruit..."
          />
        </div>
      );
    };
    return <Demo />;
  },
};

/* ----------------------------------------------------------------- Disabled */

/** A disabled Combobox: the field uses the shared `bg-disabled` / `text-disabled-foreground` pair and won't open. */
export const Disabled: Story = {
  render: () => <Combobox options={FRUITS} placeholder="Pick a fruit" disabled className="w-64" />,
};

/* ------------------------------------------------------------------ Invalid */

/**
 * The invalid state is the native `aria-invalid` attribute on the field (styled via the
 * `aria-invalid:` variant) - the danger ramp takes over the border and focus ring, exactly as an
 * invalid Input or Select.
 */
export const Invalid: Story = {
  render: () => (
    <Combobox options={FRUITS} placeholder="Pick a fruit" aria-invalid className="w-64" />
  ),
};

/* --------------------------------------------------------- MultiSelectDisabled */

/**
 * Multi-select goes through a different field path (a `div` with its own `data-[disabled]`
 * tokens, not the single-mode trigger button). Disabled with chips already selected: the field
 * dims, the chip remove buttons are inert, and it won't open.
 */
export const MultiSelectDisabled: Story = {
  render: () => (
    <Combobox
      multiple
      options={FRUITS}
      defaultValue={['apple', 'grape']}
      placeholder="Add fruit..."
      disabled
      className="w-72"
    />
  ),
};

/* ---------------------------------------------------------- MultiSelectInvalid */

/**
 * The multi-select field also carries the `aria-invalid` danger ramp (on its `div` path). Shown
 * with chips selected so the danger border reads around the whole field.
 */
export const MultiSelectInvalid: Story = {
  render: () => (
    <Combobox
      multiple
      options={FRUITS}
      defaultValue={['apple', 'grape']}
      placeholder="Add fruit..."
      aria-invalid
      className="w-72"
    />
  ),
};

/* ------------------------------------------------------------------ LongList */

/**
 * A long option list: type to filter down the full set. Multi-select with badges makes the
 * filter-and-pick loop fast for tag-style pickers.
 */
export const LongList: Story = {
  render: () => {
    const Demo = () => {
      const [value, setValue] = useState<string[]>([]);
      return (
        <div className="w-72">
          <Combobox
            multiple
            options={COUNTRIES}
            value={value}
            onValueChange={setValue}
            placeholder="Add countries..."
            searchPlaceholder="Search countries..."
          />
        </div>
      );
    };
    return <Demo />;
  },
};

/* ----------------------------------------------------------------- EmptyState */

/**
 * The no-results state: with no options (or a filter that matches nothing) the friendly
 * `emptyMessage` shows in place of the list.
 */
export const EmptyState: Story = {
  render: () => (
    <Combobox
      options={[]}
      placeholder="Pick a fruit"
      emptyMessage="No fruit available yet."
      className="w-64"
    />
  ),
};
