import type { Meta, StoryObj } from '@storybook/react';
import { Label, Textarea } from '@rogueoak/canopy/seeds';

/**
 * Seeds/Textarea - the canopy multi-line text-field Seed (spec 0012).
 *
 * Styled entirely with semantic-token utilities (`border-border`, `bg-surface`, `text-text`,
 * the muted placeholder, the focus `ring`, the `disabled` pair, and the `aria-invalid` danger
 * overrides) - mirrors Input for visual parity. There is NO per-story theme code: toggle the
 * toolbar Light / Dark control and every story re-themes via the token layer (spec 0004).
 *
 * Auto-resize (grow-to-content) is out of scope (spec 0012): set the height with the native
 * `rows` prop, and a reader can drag the `resize-y` handle to fine-tune it.
 */
const meta = {
  title: 'Seeds/Textarea',
  component: Textarea,
  parameters: { layout: 'centered' },
  args: { placeholder: 'Plant a seed…' },
  argTypes: {
    rows: { control: 'number' },
    disabled: { control: 'boolean' },
  },
  render: (args) => (
    <div className="w-80">
      <Textarea {...args} />
    </div>
  ),
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ---------------------------------------------------------------- Playground */

export const Playground: Story = {};

/* ------------------------------------------------------------------ Default */

export const Default: Story = {
  parameters: { controls: { disable: true } },
  args: { placeholder: undefined, defaultValue: 'A handful of acorns.' },
};

/* ------------------------------------------------------------- Placeholder */

export const WithPlaceholder: Story = {
  parameters: { controls: { disable: true } },
  args: { placeholder: 'Write a few lines…' },
};

/* ----------------------------------------------------------------- Focused */

/**
 * Auto-focused on mount to show the focus-visible ring (`ring-ring` + `ring-offset`) - parity
 * with Input's Focused story.
 */
export const Focused: Story = {
  parameters: { controls: { disable: true } },
  args: { autoFocus: true, defaultValue: 'Focused - note the ring.' },
};

/* ----------------------------------------------------------------- Invalid */

/**
 * `aria-invalid` drives the danger state - the `aria-invalid:` variant swaps the border and
 * focus ring to the `danger` ramp, keeping the accessible attribute and the styling in sync.
 */
export const Invalid: Story = {
  parameters: { controls: { disable: true } },
  args: { 'aria-invalid': true, defaultValue: 'This message is too short.' },
};

/* ---------------------------------------------------------------- Disabled */

/**
 * Disabled uses the `bg-disabled` / `text-disabled-foreground` token pair (not opacity) plus
 * `cursor-not-allowed`.
 */
export const Disabled: Story = {
  parameters: { controls: { disable: true } },
  args: { disabled: true, defaultValue: 'Read only - no edits here.' },
};

/* ------------------------------------------------------------- With Label */

/**
 * Pairs the textarea with the canopy `Label` (spec 0007). The `htmlFor`/`id` association lets
 * a reader click the label to focus the field, and names the control for assistive tech.
 */
export const WithLabel: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex w-80 flex-col gap-1.5">
      <Label htmlFor="textarea-bio">Bio</Label>
      <Textarea id="textarea-bio" rows={4} placeholder="Tell us about yourself…" />
    </div>
  ),
};
