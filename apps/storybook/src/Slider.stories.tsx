import type { Meta, StoryObj } from '@storybook/react';
import { Label, Slider } from '@rogueoak/canopy/seeds';

/**
 * Seeds/Slider - the canopy bounded-numeric-range Seed (spec 0038).
 *
 * Built on `@radix-ui/react-slider`: a `bg-muted` track whose filled `bg-primary` range grows to
 * the thumb, with one `role="slider"` thumb per value entry - a single-entry value is a single
 * slider, a two-entry value is a range with two thumbs and the fill between them. Radix owns the
 * value state (controlled `value` + `onValueChange`, uncontrolled `defaultValue`), stepping,
 * bounds, orientation, and the full keyboard model. Native `aria-invalid` drives a danger ring on
 * the thumbs. There is NO per-story theme code: toggle the toolbar Light / Dark control and every
 * story re-themes via the token layer (spec 0004).
 */
const meta = {
  title: 'Seeds/Slider',
  component: Slider,
  parameters: { layout: 'centered' },
  argTypes: {
    min: { control: { type: 'number' } },
    max: { control: { type: 'number' } },
    step: { control: { type: 'number' } },
    disabled: { control: 'boolean' },
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
  },
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ---------------------------------------------------------------- Playground */

export const Playground: Story = {
  args: { defaultValue: [50], min: 0, max: 100, step: 1, 'aria-label': 'Value' },
  render: (args) => (
    <div className="w-72">
      <Slider {...args} />
    </div>
  ),
};

/* ------------------------------------------------------------- Single value */

/**
 * Single value - one thumb over the track; the filled `bg-primary` range grows from `min` to the
 * thumb. The value is still a number array (`[40]`); callers read `value[0]` for the single case.
 */
export const Single: Story = {
  name: 'Single value',
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="w-72">
      <Slider defaultValue={[40]} aria-label="Volume" />
    </div>
  ),
};

/* -------------------------------------------------------------------- Range */

/**
 * Range - pass a two-entry value and the component renders two thumbs with the filled range
 * between them. No `range` prop: single vs range is expressed by the value length alone.
 */
export const Range: Story = {
  name: 'Range (two thumbs)',
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="w-72">
      <Slider defaultValue={[25, 75]} aria-label="Price range" />
    </div>
  ),
};

/* -------------------------------------------------------------------- Steps */

/**
 * Steps - `step` quantizes the value; here `step={10}` snaps the thumb to each tenth. Keyboard
 * arrows nudge by one step, `PageUp` / `PageDown` by a larger jump.
 */
export const Steps: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="w-72">
      <Slider defaultValue={[30]} min={0} max={100} step={10} aria-label="Stepped" />
    </div>
  ),
};

/* ----------------------------------------------------------------- Disabled */

/**
 * Disabled - the control is inert: `cursor-not-allowed` and reduced opacity, and the filled range
 * survives so the current value stays readable.
 */
export const Disabled: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="w-72">
      <Slider disabled defaultValue={[60]} aria-label="Disabled" />
    </div>
  ),
};

/* ------------------------------------------------------------------ Invalid */

/**
 * Invalid - set the native `aria-invalid` attribute and the danger ring takes over each thumb (no
 * custom prop). Pairs with a `FormField` error message downstream.
 */
export const Invalid: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex w-72 flex-col gap-2">
      <Label id="budget-label">Budget</Label>
      <Slider aria-labelledby="budget-label" aria-invalid defaultValue={[70]} />
    </div>
  ),
};

/* ----------------------------------------------------------------- Vertical */

/**
 * Vertical - `orientation="vertical"` stands the track up; the thumb carries
 * `aria-orientation="vertical"` and Up / Down arrows move the value.
 */
export const Vertical: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex h-56 items-center">
      <Slider orientation="vertical" defaultValue={[50]} aria-label="Vertical volume" />
    </div>
  ),
};
