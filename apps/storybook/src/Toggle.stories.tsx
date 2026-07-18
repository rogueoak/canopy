import type { Meta, StoryObj } from '@storybook/react';
import { Toggle } from '@rogueoak/canopy/seeds';

/**
 * Seeds/Toggle - the canopy two-state pressed-button Seed (spec 0039).
 *
 * A control that reads as a button (`aria-pressed`), not a form field - the bold / italic / mute
 * button in a toolbar. Styled entirely with semantic-token utilities (cva → `data-[state=on]:
 * bg-accent` default / `data-[state=on]:bg-muted` outline, the focus `ring`, the `disabled`
 * pair). There is NO per-story theme code: toggle the toolbar Light / Dark control and every
 * story re-themes via the token layer (spec 0004).
 */
const meta = {
  title: 'Seeds/Toggle',
  component: Toggle,
  parameters: { layout: 'centered' },
  args: { children: 'Toggle' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['default', 'outline'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    pressed: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

/* A small inline icon (semantic via `currentColor`) for the icon-content examples. */
function BoldIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 4h8a4 4 0 0 1 0 8H6z" />
      <path d="M6 12h9a4 4 0 0 1 0 8H6z" />
    </svg>
  );
}

/* ---------------------------------------------------------------- Playground */

export const Playground: Story = {};

/* ------------------------------------------------------------------ Variants */

export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Toggle variant="default">Default</Toggle>
      <Toggle variant="default" defaultPressed>
        Default (on)
      </Toggle>
      <Toggle variant="outline">Outline</Toggle>
      <Toggle variant="outline" defaultPressed>
        Outline (on)
      </Toggle>
    </div>
  ),
};

/* --------------------------------------------------------------------- Sizes */

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Toggle size="sm">Small</Toggle>
      <Toggle size="md">Medium</Toggle>
      <Toggle size="lg">Large</Toggle>
    </div>
  ),
};

/* -------------------------------------------------------------------- States */

/**
 * Off · on · disabled. Click a toggle to flip it between `data-state="off"` and `on`; the on
 * state applies the filled tokens. Disabled uses `disabled:opacity-50` and blocks toggling.
 */
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Toggle aria-label="Off">Off</Toggle>
      <Toggle defaultPressed aria-label="On">
        On
      </Toggle>
      <Toggle disabled aria-label="Disabled (off)">
        Disabled
      </Toggle>
      <Toggle disabled defaultPressed aria-label="Disabled (on)">
        Disabled on
      </Toggle>
    </div>
  ),
};

/* ----------------------------------------------------------------- With Icon */

/**
 * Icon content - callers pass icon children (here a bold glyph). Icon-only toggles should carry
 * an `aria-label` so the control keeps an accessible name.
 */
export const WithIcon: Story = {
  name: 'With Icon',
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Toggle aria-label="Bold">
        <BoldIcon />
      </Toggle>
      <Toggle defaultPressed aria-label="Bold (on)">
        <BoldIcon />
      </Toggle>
      <Toggle variant="outline" aria-label="Bold (outline)">
        <BoldIcon />
        Bold
      </Toggle>
    </div>
  ),
};
