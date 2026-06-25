import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@rogueoak/canopy/seeds';

/**
 * Seeds/Button — the first real Canopy Seed (spec 0005).
 *
 * Styled entirely with semantic-token utilities (cva → `bg-primary`, `hover:bg-primary-hover`,
 * the focus `ring`, the `disabled` pair, …). There is NO per-story theme code: toggle the
 * toolbar Light / Dark control and every story re-themes via the token layer (spec 0004).
 */
const meta = {
  title: 'Seeds/Button',
  component: Button,
  parameters: { layout: 'centered' },
  args: { children: 'Plant a seed' },
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['primary', 'secondary', 'outline', 'ghost', 'destructive'],
    },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg', 'icon'] },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

/* A small inline icon for the `icon` size + leading-icon examples (semantic via `currentColor`). */
function LeafIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6" />
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
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
    </div>
  ),
};

/* --------------------------------------------------------------------- Sizes */

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="icon" aria-label="Plant a seed">
        <LeafIcon />
      </Button>
    </div>
  ),
};

/* -------------------------------------------------------------------- States */

/**
 * Default · hover · disabled. Hover is interactive — move the pointer over the middle
 * button to see `hover:bg-primary-hover`; disabled uses the `bg-disabled` /
 * `text-disabled-foreground` token pair, not opacity.
 */
export const States: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button>Default</Button>
      <Button>Hover me</Button>
      <Button disabled>Disabled</Button>
    </div>
  ),
};

/* ------------------------------------------------------------------- asChild */

/**
 * `asChild` renders the single child element (here an `<a>`) while inheriting Button's
 * classes/behaviour — for link-styled buttons without nesting an `<a>` inside a `<button>`.
 */
export const AsChildLink: Story = {
  name: 'asChild (link)',
  parameters: { controls: { disable: true } },
  render: () => (
    <Button asChild>
      <a href="https://rogueoak.github.io/canopy/" target="_blank" rel="noreferrer">
        Open Storybook
      </a>
    </Button>
  ),
};

/* ----------------------------------------------------------------- With icon */

export const WithIcon: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button>
        <LeafIcon />
        Leading icon
      </Button>
      <Button variant="secondary">
        Trailing icon
        <LeafIcon />
      </Button>
      <Button size="icon" variant="outline" aria-label="Leaf">
        <LeafIcon />
      </Button>
    </div>
  ),
};
