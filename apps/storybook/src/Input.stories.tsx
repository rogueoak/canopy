import type { Meta, StoryObj } from '@storybook/react';
import { Input } from '@rogueoak/canopy/seeds';

/**
 * Seeds/Input — the canopy text-field Seed (spec 0006).
 *
 * Styled entirely with semantic-token utilities (cva → `border-border`, `bg-surface`,
 * `text-text`, the focus `ring`, the `disabled` pair, and the `aria-invalid` danger
 * overrides). There is NO per-story theme code: toggle the toolbar Light / Dark control and
 * every story re-themes via the token layer (spec 0004).
 */
const meta = {
  title: 'Seeds/Input',
  component: Input,
  parameters: { layout: 'centered' },
  args: { placeholder: 'Plant a seed…' },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    type: { control: 'text' },
    disabled: { control: 'boolean' },
  },
  render: (args) => (
    <div className="w-64">
      <Input {...args} />
    </div>
  ),
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ---------------------------------------------------------------- Playground */

export const Playground: Story = {};

/* ------------------------------------------------------------------ Default */

export const Default: Story = {
  parameters: { controls: { disable: true } },
  args: { placeholder: undefined, defaultValue: 'Acorn' },
};

/* ------------------------------------------------------------- Placeholder */

export const WithPlaceholder: Story = {
  parameters: { controls: { disable: true } },
  args: { placeholder: 'Plant a seed…' },
};

/* ----------------------------------------------------------------- Focused */

/**
 * Focus is interactive — click into the field (or Tab to it) to see the focus-visible ring
 * (`focus-visible:ring-2 focus-visible:ring-ring`). Storybook can't paint a `:focus-visible`
 * state statically, so focus the input to view it.
 */
export const Focused: Story = {
  parameters: { controls: { disable: true } },
  args: { placeholder: 'Click or Tab to focus me' },
};

/* ----------------------------------------------------------------- Invalid */

/**
 * `aria-invalid` drives the danger state — the `aria-invalid:` variant swaps the border and
 * focus ring to the `danger` ramp, keeping the accessible attribute and the styling in sync.
 */
export const Invalid: Story = {
  parameters: { controls: { disable: true } },
  args: { 'aria-invalid': true, defaultValue: 'not-an-email' },
};

/* ---------------------------------------------------------------- Disabled */

/**
 * Disabled uses the `bg-disabled` / `text-disabled-foreground` token pair (not opacity) plus
 * `cursor-not-allowed`.
 */
export const Disabled: Story = {
  parameters: { controls: { disable: true } },
  args: { disabled: true, defaultValue: 'Read only' },
};

/* ------------------------------------------------------------------- Sizes */

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex w-64 flex-col gap-3">
      <Input size="sm" placeholder="Small" />
      <Input size="md" placeholder="Medium" />
      <Input size="lg" placeholder="Large" />
    </div>
  ),
};
