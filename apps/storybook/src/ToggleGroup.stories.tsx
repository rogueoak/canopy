import type { Meta, StoryObj } from '@storybook/react';
import { ToggleGroup, ToggleGroupItem } from '@rogueoak/canopy/twigs';

/**
 * Twigs/ToggleGroup - the segmented multi-toggle Twig (spec 0049). It composes the `Toggle` (0039)
 * atom's recipe across a set of members wired together as one control: a text alignment picker
 * (`type="single"`, radiogroup-like) or a formatting bar (`type="multiple"`, several on at once).
 * Radix owns the selection state, the roving-tabindex keyboard model (one tab stop; `Arrow` keys
 * move between items), and the grouping ARIA; the root shares `variant` / `size` to every item
 * through context and paints the joined segmented row (shared border seam, only outer corners
 * rounded).
 *
 * There is NO per-story theme code: toggle the toolbar Light / Dark control and every story
 * re-themes through the token layer (spec 0004). Icon-only items carry an `aria-label`.
 */
const meta = {
  title: 'Twigs/ToggleGroup',
  component: ToggleGroup,
  parameters: { layout: 'centered' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['default', 'outline'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof ToggleGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/* Small inline icons (semantic via `currentColor`) for the alignment / formatting examples. */
function AlignLeftIcon() {
  return (
    <svg
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
      <path d="M3 6h18M3 12h12M3 18h15" />
    </svg>
  );
}

function AlignCenterIcon() {
  return (
    <svg
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
      <path d="M3 6h18M6 12h12M4 18h16" />
    </svg>
  );
}

function AlignRightIcon() {
  return (
    <svg
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
      <path d="M3 6h18M9 12h12M6 18h15" />
    </svg>
  );
}

/* --------------------------------------------------------------------- Playground */

export const Playground: Story = {
  args: { type: 'single', defaultValue: 'center', 'aria-label': 'Text alignment' },
  render: (args) => (
    <ToggleGroup {...args}>
      <ToggleGroupItem value="left" aria-label="Align left">
        <AlignLeftIcon />
      </ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Align center">
        <AlignCenterIcon />
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Align right">
        <AlignRightIcon />
      </ToggleGroupItem>
    </ToggleGroup>
  ),
};

/* -------------------------------------------------------------------------- Single */

/** Single choice (radiogroup-like): selecting one item deselects the prior. */
export const Single: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <ToggleGroup type="single" defaultValue="left" aria-label="Text alignment">
      <ToggleGroupItem value="left">Left</ToggleGroupItem>
      <ToggleGroupItem value="center">Center</ToggleGroupItem>
      <ToggleGroupItem value="right">Right</ToggleGroupItem>
    </ToggleGroup>
  ),
};

/* ------------------------------------------------------------------------ Multiple */

/** Multiple choice (formatting bar): any number of items on at once. */
export const Multiple: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <ToggleGroup type="multiple" defaultValue={['bold', 'italic']} aria-label="Formatting">
      <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
      <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
      <ToggleGroupItem value="underline">Underline</ToggleGroupItem>
    </ToggleGroup>
  ),
};

/* ------------------------------------------------------------------------ Variants */

/** default (accent fill) vs outline (neutral fill + stronger border). */
export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col items-center gap-4">
      <ToggleGroup type="single" variant="default" defaultValue="center" aria-label="Default">
        <ToggleGroupItem value="left">Left</ToggleGroupItem>
        <ToggleGroupItem value="center">Center</ToggleGroupItem>
        <ToggleGroupItem value="right">Right</ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup type="single" variant="outline" defaultValue="center" aria-label="Outline">
        <ToggleGroupItem value="left">Left</ToggleGroupItem>
        <ToggleGroupItem value="center">Center</ToggleGroupItem>
        <ToggleGroupItem value="right">Right</ToggleGroupItem>
      </ToggleGroup>
    </div>
  ),
};

/* --------------------------------------------------------------------------- Sizes */

/** sm / md / lg - the shared size reaches every item through context. */
export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col items-center gap-4">
      <ToggleGroup type="single" size="sm" variant="outline" defaultValue="a" aria-label="Small">
        <ToggleGroupItem value="a">Cut</ToggleGroupItem>
        <ToggleGroupItem value="b">Copy</ToggleGroupItem>
        <ToggleGroupItem value="c">Paste</ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup type="single" size="md" variant="outline" defaultValue="a" aria-label="Medium">
        <ToggleGroupItem value="a">Cut</ToggleGroupItem>
        <ToggleGroupItem value="b">Copy</ToggleGroupItem>
        <ToggleGroupItem value="c">Paste</ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup type="single" size="lg" variant="outline" defaultValue="a" aria-label="Large">
        <ToggleGroupItem value="a">Cut</ToggleGroupItem>
        <ToggleGroupItem value="b">Copy</ToggleGroupItem>
        <ToggleGroupItem value="c">Paste</ToggleGroupItem>
      </ToggleGroup>
    </div>
  ),
};

/* ------------------------------------------------------------------------ Disabled */

/** A whole disabled group, and a single disabled item whose siblings stay interactive. */
export const Disabled: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col items-center gap-4">
      <ToggleGroup type="single" disabled defaultValue="center" aria-label="Disabled group">
        <ToggleGroupItem value="left">Left</ToggleGroupItem>
        <ToggleGroupItem value="center">Center</ToggleGroupItem>
        <ToggleGroupItem value="right">Right</ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup type="multiple" defaultValue={['bold']} aria-label="Disabled item">
        <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
        <ToggleGroupItem value="italic" disabled>
          Italic
        </ToggleGroupItem>
        <ToggleGroupItem value="underline">Underline</ToggleGroupItem>
      </ToggleGroup>
    </div>
  ),
};
