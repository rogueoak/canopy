import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox, Label } from '@rogueoak/canopy/seeds';

/**
 * Seeds/Checkbox — the canopy boolean-field Seed (spec 0009).
 *
 * Styled entirely with semantic-token utilities (`border-border-strong`, `bg-surface`, the
 * `data-[state=checked]` / `data-[state=indeterminate]` swap to `bg-primary` /
 * `text-primary-foreground`, the focus `ring`, and the disabled dim). There is NO per-story theme
 * code: toggle the toolbar Light / Dark control and every story re-themes via the token layer
 * (spec 0004).
 */
const meta = {
  title: 'Seeds/Checkbox',
  component: Checkbox,
  parameters: { layout: 'centered' },
  argTypes: {
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ---------------------------------------------------------------- Playground */

export const Playground: Story = {
  args: { 'aria-label': 'Accept terms' },
};

/* ------------------------------------------------------------------ Unchecked */

export const Unchecked: Story = {
  parameters: { controls: { disable: true } },
  args: { 'aria-label': 'Unchecked', defaultChecked: false },
};

/* -------------------------------------------------------------------- Checked */

export const Checked: Story = {
  parameters: { controls: { disable: true } },
  args: { 'aria-label': 'Checked', defaultChecked: true },
};

/**
 * Indeterminate — the "mixed" state (`checked="indeterminate"`), rendered with the inline dash
 * indicator. Common for a parent checkbox over a partially-selected group.
 */
export const Indeterminate: Story = {
  parameters: { controls: { disable: true } },
  args: { 'aria-label': 'Indeterminate', checked: 'indeterminate' },
};

/**
 * Disabled checkboxes dim via opacity and use `cursor-not-allowed`; both an unchecked and a
 * checked disabled box are shown.
 */
export const Disabled: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex items-center gap-3">
      <Checkbox aria-label="Disabled unchecked" disabled />
      <Checkbox aria-label="Disabled checked" disabled defaultChecked />
    </div>
  ),
};

/**
 * Paired with the canopy `Label` via `id` / `htmlFor` — clicking the label toggles the box and
 * the two share one accessible name.
 */
export const WithLabel: Story = {
  name: 'With Label',
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="terms" defaultChecked />
      <Label htmlFor="terms">Accept terms and conditions</Label>
    </div>
  ),
};

/**
 * Every state side by side: unchecked · checked · indeterminate · disabled.
 */
export const AllStates: Story = {
  name: 'All states',
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex items-center gap-4">
      <Checkbox aria-label="Unchecked" />
      <Checkbox aria-label="Checked" defaultChecked />
      <Checkbox aria-label="Indeterminate" checked="indeterminate" />
      <Checkbox aria-label="Disabled" disabled />
    </div>
  ),
};
