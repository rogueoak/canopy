import type { Meta, StoryObj } from '@storybook/react';
import { Button, Spinner } from '@rogueoak/canopy/seeds';

/**
 * Seeds/Spinner — the canopy busy-indicator Seed (spec 0017).
 *
 * Pure CSS/SVG: a `<span role="status">` with an `aria-label` (default "Loading") and an inline
 * spinning SVG drawn with `currentColor`, so it inherits the surrounding text colour or a token
 * utility (`text-primary`, `text-muted-foreground`). The rotation is `animate-spin`, gated with
 * `motion-reduce:animate-none` for reduced-motion users. There is NO per-story theme code: toggle
 * the toolbar Light / Dark control and every story re-themes via the token layer (spec 0004).
 */
const meta = {
  title: 'Seeds/Spinner',
  component: Spinner,
  parameters: { layout: 'centered' },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ---------------------------------------------------------------- Playground */

export const Playground: Story = {};

/* --------------------------------------------------------------------- Sizes */

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex items-center gap-6">
      <Spinner size="sm" />
      <Spinner size="md" />
      <Spinner size="lg" />
    </div>
  ),
};

/* -------------------------------------------------------------------- Tinted */

/**
 * Colour comes from `currentColor`, so a text-colour token tints the indicator — here
 * `text-primary` and `text-muted-foreground`.
 */
export const Tinted: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex items-center gap-6">
      <Spinner className="text-primary" />
      <Spinner className="text-muted-foreground" />
    </div>
  ),
};

/* ------------------------------------------------------------- On a surface */

/**
 * The same indicator on the default surface and a raised-surface card — it inherits the text
 * colour of whatever it sits on.
 */
export const OnSurfaces: Story = {
  name: 'On surfaces',
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex items-center gap-6">
      <div className="flex items-center justify-center rounded-md border border-border bg-surface p-6 text-text">
        <Spinner />
      </div>
      <div className="flex items-center justify-center rounded-md border border-border bg-surface-raised p-6 text-text shadow-md">
        <Spinner />
      </div>
    </div>
  ),
};

/* ------------------------------------------------------------ Inside a Button */

/**
 * A Spinner inside a Button — the loading-action pattern. The indicator inherits the button's
 * `currentColor` (`text-primary-foreground`), so it needs no explicit tint.
 */
export const InButton: Story = {
  name: 'In a button',
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex items-center gap-3">
      <Button disabled>
        <Spinner size="sm" aria-label="Saving" />
        Saving…
      </Button>
      <Button variant="secondary" disabled>
        <Spinner size="sm" aria-label="Loading" />
        Loading…
      </Button>
    </div>
  ),
};
