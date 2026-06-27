import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { SearchBar } from '@rogueoak/canopy/twigs';

/**
 * Twigs/SearchBar - the search-input Twig (spec 0021), composing the Input, Button and Keyboard
 * Seeds into one accessible search control: a leading magnifier, a clear (x) Button that appears
 * with a value and refocuses the input, an `onSearch` submit, and an optional display-only
 * `shortcutHint`.
 *
 * There is NO per-story theme code: toggle the toolbar Light / Dark control and every story
 * re-themes through the token layer (spec 0004) - the muted icon, the ghost clear Button and the
 * Keyboard hint all ride semantic tokens.
 */
const meta = {
  title: 'Twigs/SearchBar',
  component: SearchBar,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SearchBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The empty default: leading magnifier, placeholder, no clear button yet. */
export const Default: Story = {
  args: { placeholder: 'Search...' },
};

/**
 * With a value: a controlled wrapper drives the field, so the clear (x) Button is visible. Clicking
 * it empties the value and refocuses the input.
 */
function ControlledSearchBar(args: React.ComponentProps<typeof SearchBar>) {
  const [value, setValue] = React.useState('Granny Smith');
  return <SearchBar {...args} value={value} onValueChange={setValue} placeholder="Search..." />;
}

export const WithValue: Story = {
  render: (args) => <ControlledSearchBar {...args} />,
};

/**
 * With a shortcut hint: a display-only `Keyboard` sits at the trailing edge while the field is
 * empty (SearchBar binds no key). It is hidden once there is a value, where the clear button takes
 * the slot.
 */
export const WithShortcutHint: Story = {
  args: { placeholder: 'Search...', shortcutHint: '⌘K' },
};

/** Disabled: the field dims through the token layer and the clear affordance never appears. */
export const Disabled: Story = {
  args: { placeholder: 'Search...', defaultValue: 'Granny Smith', disabled: true },
};
