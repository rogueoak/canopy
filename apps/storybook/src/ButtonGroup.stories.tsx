import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@rogueoak/canopy/seeds';
import { ButtonGroup } from '@rogueoak/canopy/twigs';

/**
 * Twigs/ButtonGroup - the segmented-cluster Twig (spec 0043). It composes 2+ canopy `Button` (0005)
 * children into one flush, joined-radius control (toolbars, split actions, view-mode switchers): the
 * neighbours sit flush against a single shared `border-border` seam and only the group's outer
 * corners are rounded. It is purely presentational - it holds no state and adds no roving-tabindex,
 * so every `Button` variant / size / disabled works unchanged and each segment stays independently
 * tabbable. The container carries `role="group"` and requires an accessible name (`aria-label` or
 * `aria-labelledby`).
 *
 * There is NO per-story theme code: toggle the toolbar Light / Dark control and every story
 * re-themes through the token layer (spec 0004).
 */
const meta = {
  title: 'Twigs/ButtonGroup',
  component: ButtonGroup,
  parameters: { layout: 'centered' },
  args: { 'aria-label': 'Toolbar actions' },
} satisfies Meta<typeof ButtonGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ---------------------------------------------------------------------- Playground */

/** The default cluster: a horizontal row of outline segments joined into one control. */
export const Playground: Story = {
  render: (args) => (
    <ButtonGroup {...args}>
      <Button variant="outline">Left</Button>
      <Button variant="outline">Center</Button>
      <Button variant="outline">Right</Button>
    </ButtonGroup>
  ),
};

/* --------------------------------------------------------------------- Horizontal */

/** A view-mode switcher laid out in a row (the default orientation). */
export const Horizontal: Story = {
  render: () => (
    <ButtonGroup aria-label="View mode">
      <Button variant="outline">List</Button>
      <Button variant="outline">Board</Button>
      <Button variant="outline">Calendar</Button>
    </ButtonGroup>
  ),
};

/* ----------------------------------------------------------------------- Vertical */

/** The same cluster stacked into a column; the joined radii rotate to top/bottom. */
export const Vertical: Story = {
  render: () => (
    <ButtonGroup aria-label="View mode" orientation="vertical">
      <Button variant="outline">List</Button>
      <Button variant="outline">Board</Button>
      <Button variant="outline">Calendar</Button>
    </ButtonGroup>
  ),
};

/* -------------------------------------------------------------------------- Sizes */

/** Every `Button` size drops in unchanged; the group only contributes the joined layout. */
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-4">
      <ButtonGroup aria-label="Small">
        <Button variant="outline" size="sm">
          Cut
        </Button>
        <Button variant="outline" size="sm">
          Copy
        </Button>
        <Button variant="outline" size="sm">
          Paste
        </Button>
      </ButtonGroup>
      <ButtonGroup aria-label="Medium">
        <Button variant="outline">Cut</Button>
        <Button variant="outline">Copy</Button>
        <Button variant="outline">Paste</Button>
      </ButtonGroup>
      <ButtonGroup aria-label="Large">
        <Button variant="outline" size="lg">
          Cut
        </Button>
        <Button variant="outline" size="lg">
          Copy
        </Button>
        <Button variant="outline" size="lg">
          Paste
        </Button>
      </ButtonGroup>
    </div>
  ),
};

/* ------------------------------------------------------------------- MixedVariants */

/** A split-action set: a primary segment attached to secondary siblings. */
export const MixedVariants: Story = {
  render: () => (
    <ButtonGroup aria-label="Save actions">
      <Button variant="primary">Save</Button>
      <Button variant="secondary">Save as draft</Button>
      <Button variant="secondary">Discard</Button>
    </ButtonGroup>
  ),
};

/* ------------------------------------------------------------------- WithSeparator */

/** Opt in to a presentational `aria-hidden` divider between segments for extra contrast. */
export const WithSeparator: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-4">
      <ButtonGroup aria-label="Zoom" separator>
        <Button variant="outline" aria-label="Zoom out">
          -
        </Button>
        <Button variant="outline">100%</Button>
        <Button variant="outline" aria-label="Zoom in">
          +
        </Button>
      </ButtonGroup>
      <ButtonGroup aria-label="Pager" orientation="vertical" separator>
        <Button variant="outline">Previous</Button>
        <Button variant="outline">Next</Button>
      </ButtonGroup>
    </div>
  ),
};

/* ------------------------------------------------------------------ DisabledSegment */

/** A disabled segment stays inert while its siblings remain interactive. */
export const DisabledSegment: Story = {
  render: () => (
    <ButtonGroup aria-label="Format">
      <Button variant="outline">Bold</Button>
      <Button variant="outline" disabled>
        Italic
      </Button>
      <Button variant="outline">Underline</Button>
    </ButtonGroup>
  ),
};
