import type { Meta, StoryObj } from '@storybook/react';
import { Progress } from '@rogueoak/canopy/seeds';

/**
 * Seeds/Progress - the canopy determinate progress-bar Seed (spec 0037), the determinate sibling
 * to Spinner (0017).
 *
 * Built on `@radix-ui/react-progress`: a `role="progressbar"` track (`bg-muted`) whose indicator
 * (`bg-primary`) fills proportionally to `value` (0-100). Omit `value` for an indeterminate,
 * gently-pulsing bar (no `aria-valuenow`), gated with `motion-reduce:animate-none`. There is NO
 * per-story theme code: toggle the toolbar Light / Dark control and every story re-themes via the
 * token layer (spec 0004).
 */
const meta = {
  title: 'Seeds/Progress',
  component: Progress,
  parameters: { layout: 'centered' },
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 100, step: 1 } },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ---------------------------------------------------------------- Playground */

export const Playground: Story = {
  args: { value: 60, size: 'md', 'aria-label': 'Progress' },
  render: (args) => (
    <div className="w-72">
      <Progress {...args} />
    </div>
  ),
};

/* ------------------------------------------------------------------- Values */

/**
 * A determinate bar at a range of values - the indicator fills proportionally and Radix carries
 * `aria-valuenow` for each.
 */
export const Values: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex w-72 flex-col gap-4">
      <Progress value={0} aria-label="0 percent" />
      <Progress value={25} aria-label="25 percent" />
      <Progress value={50} aria-label="50 percent" />
      <Progress value={75} aria-label="75 percent" />
      <Progress value={100} aria-label="100 percent" />
    </div>
  ),
};

/* -------------------------------------------------------------------- Sizes */

/**
 * The two track heights - `sm` and `md` (the default).
 */
export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex w-72 flex-col gap-4">
      <Progress size="sm" value={60} aria-label="Small" />
      <Progress size="md" value={60} aria-label="Medium" />
    </div>
  ),
};

/* ------------------------------------------------------------ Indeterminate */

/**
 * Omit `value` for the indeterminate state - a gently-pulsing bar with no `aria-valuenow`, for
 * bounded-but-unknown-duration tasks. The pulse is gated with `motion-reduce:animate-none`.
 */
export const Indeterminate: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="w-72">
      <Progress aria-label="Working" />
    </div>
  ),
};

/* ------------------------------------------------------------- On surfaces */

/**
 * The same determinate bar on the default surface and a raised-surface card - `bg-muted` /
 * `bg-primary` read correctly on both in either theme.
 */
export const OnSurfaces: Story = {
  name: 'On surfaces',
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="w-72 rounded-md border border-border bg-surface p-6 text-text">
        <Progress value={60} aria-label="On surface" />
      </div>
      <div className="w-72 rounded-md border border-border bg-surface-raised p-6 text-text shadow-md">
        <Progress value={60} aria-label="On raised surface" />
      </div>
    </div>
  ),
};
