import type { Meta, StoryObj } from '@storybook/react';
import { Separator } from '@rogueoak/canopy/seeds';

/**
 * Seeds/Separator — the canopy hairline divider Seed (spec 0016).
 *
 * Styled entirely with semantic-token utilities (`bg-border` + the `data-[orientation=…]`
 * sizing rules). There is NO per-story theme code: toggle the toolbar Light / Dark control and
 * every story re-themes via the token layer (spec 0004). `decorative` (the default) renders no
 * ARIA role; `decorative={false}` exposes `role="separator"` with the orientation.
 */
const meta = {
  title: 'Seeds/Separator',
  component: Separator,
  parameters: { layout: 'centered' },
  argTypes: {
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    decorative: { control: 'boolean' },
  },
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ----------------------------------------------------------------- Horizontal */

/**
 * A horizontal rule (the default) separating two blocks of text — the common case for
 * dividing sections of a card or page.
 */
export const Horizontal: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="w-80 text-text">
      <div className="space-y-1">
        <h4 className="text-body font-medium">Canopy</h4>
        <p className="text-body-sm text-text-muted">A semantic-token component catalogue.</p>
      </div>
      <Separator className="my-4" />
      <div className="space-y-1">
        <h4 className="text-body font-medium">Seeds</h4>
        <p className="text-body-sm text-text-muted">The atoms the catalogue is grown from.</p>
      </div>
    </div>
  ),
};

/* ------------------------------------------------------------------- Vertical */

/**
 * A vertical separator between inline items, sized to its `flex h-5 items-center` row — the
 * toolbar / breadcrumb pattern.
 */
export const Vertical: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex h-5 items-center gap-3 text-body-sm text-text">
      <span>Docs</span>
      <Separator orientation="vertical" />
      <span>Source</span>
      <Separator orientation="vertical" />
      <span>About</span>
    </div>
  ),
};

/* ----------------------------------------------------------------- Playground */

export const Playground: Story = {
  args: { orientation: 'horizontal', decorative: true },
  render: (args) => (
    <div className="flex h-24 w-80 items-center justify-center text-text">
      <Separator {...args} />
    </div>
  ),
};
