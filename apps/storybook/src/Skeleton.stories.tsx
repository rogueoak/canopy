import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton } from '@rogueoak/canopy/seeds';

/**
 * Seeds/Skeleton — the canopy loading-placeholder Seed (spec 0018).
 *
 * A `muted`-filled block that pulses while content loads. Shape and size are NOT props — they
 * come from the `className` (`h-4 w-32` for a text line, `h-10 w-10 rounded-full` for an
 * avatar), so one atom composes into any placeholder. There is NO per-story theme code: toggle
 * the toolbar Light / Dark control and every story re-themes via the token layer (spec 0004).
 *
 * The pulse is gated behind `motion-reduce:animate-none` — enable "Reduce motion" in your OS
 * (or the toolbar, where available) and the block stills to a static muted fill. Skeletons are
 * decorative (`aria-hidden`); the surrounding region announces busy-ness.
 */
const meta = {
  title: 'Seeds/Skeleton',
  component: Skeleton,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ----------------------------------------------------------------- Single block */

/** A bare block — size and corner radius driven entirely by `className`. */
export const Block: Story = {
  render: () => <Skeleton className="h-24 w-64" />,
};

/* ------------------------------------------------------------------- Text lines */

/** Stacked lines approximate a paragraph; the last is shortened like a real ragged edge. */
export const TextLines: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex w-64 flex-col gap-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
    </div>
  ),
};

/* ---------------------------------------------------------------------- Avatar */

/** A circle via `rounded-full` — the avatar placeholder. */
export const Avatar: Story = {
  parameters: { controls: { disable: true } },
  render: () => <Skeleton className="h-12 w-12 rounded-full" />,
};

/* ------------------------------------------------------------------------ Card */

/**
 * A card composition: a circular avatar skeleton beside two text lines — the everyday
 * "media object is loading" placeholder.
 */
export const Card: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex w-72 items-center gap-4 rounded-md border border-border bg-surface p-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  ),
};
