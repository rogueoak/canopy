import type { Meta, StoryObj } from '@storybook/react';
import { Sprout } from '@rogueoak/canopy/seeds';

/**
 * Seeds/Sprout — the placeholder component from @rogueoak/canopy.
 * Proves a component consuming a Roots token renders in Storybook.
 */
const meta = {
  title: 'Seeds/Sprout',
  component: Sprout,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Sprout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomLabel: Story = {
  args: { label: 'roots/color-sample' },
};
