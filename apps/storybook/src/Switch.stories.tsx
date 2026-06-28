import type { Meta, StoryObj } from '@storybook/react';
import { Label, Switch } from '@rogueoak/canopy/seeds';

/**
 * Seeds/Switch - the canopy on/off toggle Seed (spec 0010).
 *
 * Styled entirely with semantic-token utilities (the pill track `bg-border` → `bg-primary` when
 * on, the `bg-surface` thumb, the focus `ring`). There is NO per-story theme code: toggle the
 * toolbar Light / Dark control and every story re-themes via the token layer (spec 0004).
 */
const meta = {
  title: 'Seeds/Switch',
  component: Switch,
  parameters: { layout: 'centered' },
  argTypes: {
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ---------------------------------------------------------------- Playground */

export const Playground: Story = {
  args: { 'aria-label': 'Toggle setting' },
};

/* ----------------------------------------------------------------------- Off */

export const Off: Story = {
  parameters: { controls: { disable: true } },
  render: () => <Switch aria-label="Notifications" />,
};

/* ------------------------------------------------------------------------ On */

export const On: Story = {
  parameters: { controls: { disable: true } },
  render: () => <Switch defaultChecked aria-label="Notifications" />,
};

/* ------------------------------------------------------------------ Disabled */

/**
 * Disabled - off and on. The `disabled` state uses `cursor-not-allowed` + reduced opacity and
 * blocks toggling.
 */
export const Disabled: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex items-center gap-4">
      <Switch disabled aria-label="Notifications (off, disabled)" />
      <Switch disabled defaultChecked aria-label="Notifications (on, disabled)" />
    </div>
  ),
};

/* ---------------------------------------------------------------- With Label */

/**
 * Paired with the canopy `Label` via `htmlFor`/`id` - clicking the label toggles the switch and
 * the two share one accessible name, the settings-row pattern.
 */
export const WithLabel: Story = {
  name: 'With Label',
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex items-center gap-3">
      <Switch id="airplane-mode" defaultChecked />
      <Label htmlFor="airplane-mode">Airplane mode</Label>
    </div>
  ),
};
