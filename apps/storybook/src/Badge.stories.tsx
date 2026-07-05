import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from '@rogueoak/canopy/seeds';

/**
 * Seeds/Badge - a small, non-interactive label for status and metadata (spec 0008).
 *
 * The first Seed to exercise the semantic status tokens end-to-end (`bg-success`,
 * `bg-warning`, `bg-danger`, `bg-info`) alongside the role/neutral fills. There is NO
 * per-story theme code: toggle the toolbar Light / Dark control and every story re-themes
 * via the token layer (spec 0004) - the proof those status roles read in both themes.
 */
const meta = {
  title: 'Seeds/Badge',
  component: Badge,
  parameters: { layout: 'centered' },
  args: { children: 'Badge' },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['neutral', 'primary', 'success', 'warning', 'danger', 'info'],
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ---------------------------------------------------------------- Playground */

export const Playground: Story = {};

/* ------------------------------------------------------------------ Variants */

export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge variant="neutral">Neutral</Badge>
      <Badge variant="primary">Primary</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="danger">Danger</Badge>
      <Badge variant="info">Info</Badge>
    </div>
  ),
};

/* ------------------------------------------------------------------- asChild */

/**
 * `asChild` renders the single child element (here an `<a>`) while inheriting Badge's
 * classes - a linked badge without nesting elements.
 */
export const AsChildLink: Story = {
  name: 'asChild (link)',
  parameters: { controls: { disable: true } },
  render: () => (
    <Badge asChild variant="info">
      <a href="https://rogueoak.github.io/canopy/" target="_blank" rel="noreferrer">
        Docs
      </a>
    </Badge>
  ),
};
