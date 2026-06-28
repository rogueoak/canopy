import type { Meta, StoryObj } from '@storybook/react';
import { Label, RadioGroup, RadioGroupItem } from '@rogueoak/canopy/seeds';

/**
 * Seeds/RadioGroup - the single-choice selection Seed (spec 0011), built on
 * `@radix-ui/react-radio-group`. Each `RadioGroupItem` pairs with a canopy `Label` via
 * `htmlFor`/`id`, so clicking the label selects its radio and assistive tech reads the name.
 *
 * Styled entirely with semantic-token utilities (the `border-strong` idle ring, the `primary`
 * selected border + dot, the focus `ring`). There is NO per-story theme code: toggle the
 * toolbar Light / Dark control and every story re-themes via the token layer (spec 0004).
 * Keyboard: Tab into the group, then ArrowUp/ArrowDown (or Left/Right) roves focus and
 * selection - all from Radix.
 */
const meta = {
  title: 'Seeds/RadioGroup',
  component: RadioGroup,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A labelled row: the radio circle + its canopy Label, associated via id/htmlFor. */
function Option({ value, label, disabled }: { value: string; label: string; disabled?: boolean }) {
  const id = `plan-${value}`;
  return (
    <div className="flex items-center gap-2">
      <RadioGroupItem value={value} id={id} disabled={disabled} />
      <Label htmlFor={id}>{label}</Label>
    </div>
  );
}

/* --------------------------------------------------------------- Default */

/** Three options, none selected. Tab in and use the arrow keys to rove selection. */
export const Default: Story = {
  render: () => (
    <RadioGroup aria-label="Plan">
      <Option value="seed" label="Seed" />
      <Option value="sprout" label="Sprout" />
      <Option value="tree" label="Tree" />
    </RadioGroup>
  ),
};

/* -------------------------------------------------------------- Selected */

/** `defaultValue` pre-selects an option - note the `primary` border + centred dot. */
export const Selected: Story = {
  render: () => (
    <RadioGroup aria-label="Plan" defaultValue="sprout">
      <Option value="seed" label="Seed" />
      <Option value="sprout" label="Sprout" />
      <Option value="tree" label="Tree" />
    </RadioGroup>
  ),
};

/* --------------------------------------------------------- Disabled item */

/** A single disabled option inside an otherwise interactive group. */
export const DisabledItem: Story = {
  name: 'Disabled item',
  render: () => (
    <RadioGroup aria-label="Plan" defaultValue="seed">
      <Option value="seed" label="Seed" />
      <Option value="sprout" label="Sprout (coming soon)" disabled />
      <Option value="tree" label="Tree" />
    </RadioGroup>
  ),
};

/* -------------------------------------------------------- Disabled group */

/** The whole group disabled - every item inherits the disabled affordance. */
export const DisabledGroup: Story = {
  name: 'Disabled group',
  render: () => (
    <RadioGroup aria-label="Plan" defaultValue="sprout" disabled>
      <Option value="seed" label="Seed" />
      <Option value="sprout" label="Sprout" />
      <Option value="tree" label="Tree" />
    </RadioGroup>
  ),
};
