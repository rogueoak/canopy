import type { Meta, StoryObj } from '@storybook/react';
import { ScrollArea, ScrollBar } from '@rogueoak/canopy/branches';

/**
 * Branches/ScrollArea - the canopy themed scroll container (spec 0050), built on
 * `@radix-ui/react-scroll-area`. It wraps arbitrary content in a custom, cross-browser scroll
 * region: a focusable, natively-scrollable viewport plus a thin themed `ScrollBar` (a slim track
 * with a `rounded-full bg-border` thumb) that hides until needed. The native OS scrollbar is
 * suppressed so only the themed bar shows.
 *
 * The caller sets the region's height / max-height via `className`; the viewport handles overflow.
 * `ScrollArea` ships a vertical `ScrollBar` + the `Corner` by default; compose an extra `ScrollBar
 * orientation="horizontal"` for a horizontal or both-axis region.
 *
 * There is NO per-story theme code: toggle the toolbar Light / Dark control and the `bg-border`
 * thumb re-themes through the token layer (spec 0004) - no `dark:` on the component.
 */
const meta = {
  title: 'Branches/ScrollArea',
  component: ScrollArea,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ScrollArea>;

export default meta;
type Story = StoryObj<typeof meta>;

const tags = Array.from({ length: 40 }).map((_, i) => `Item ${i + 1}`);

/* --------------------------------------------------------------------- Playground */

/** A fixed-height region wrapping a long list; the vertical bar reveals on hover / scroll. */
export const Playground: Story = {
  render: () => (
    <ScrollArea className="h-72 w-56 rounded-md border border-border">
      <div className="p-4">
        <h4 className="text-label text-text">Tags</h4>
        {tags.map((tag) => (
          <div key={tag} className="py-1.5 text-body-sm text-text-muted">
            {tag}
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
};

/* -------------------------------------------------------------------- VerticalList */

/**
 * The common case: a long vertical list in a bordered region. The default vertical `ScrollBar` is
 * baked into the root, so this is a one-line container.
 */
export const VerticalList: Story = {
  render: () => (
    <ScrollArea className="h-64 w-64 rounded-md border border-border">
      <div className="flex flex-col">
        {tags.map((tag) => (
          <div
            key={tag}
            className="border-b border-border px-4 py-2 text-body-sm text-text last:border-b-0"
          >
            {tag}
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
};

/* ------------------------------------------------------------------ HorizontalRow */

/**
 * A horizontal row of cards. Compose a `ScrollBar orientation="horizontal"` for the horizontal axis
 * (the default vertical bar stays inert when the content does not overflow vertically).
 */
export const HorizontalRow: Story = {
  render: () => (
    <ScrollArea className="w-80 rounded-md border border-border whitespace-nowrap">
      <div className="flex w-max gap-3 p-4">
        {Array.from({ length: 16 }).map((_, i) => (
          <figure
            key={i}
            className="flex h-28 w-28 shrink-0 items-center justify-center rounded-md bg-muted text-h3 text-text"
          >
            {i + 1}
          </figure>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  ),
};

/* ------------------------------------------------------------------- BothScrollbars */

/**
 * A region that overflows on both axes - a wide, tall grid - showing the vertical and horizontal
 * bars together and the `Corner` where they meet.
 */
export const BothScrollbars: Story = {
  render: () => (
    <ScrollArea className="h-64 w-72 rounded-md border border-border">
      <div className="w-[560px] p-4">
        <div className="grid grid-cols-6 gap-2">
          {Array.from({ length: 90 }).map((_, i) => (
            <div
              key={i}
              className="flex h-16 items-center justify-center rounded-md bg-muted text-body-sm text-text"
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  ),
};

/* -------------------------------------------------------------------- InRaisedCard */

/**
 * The scroll region inside a bordered raised card / surface (`bg-surface-raised`) - proving the
 * transparent track lets the `bg-border` thumb read against a raised surface too, in both themes.
 */
export const InRaisedCard: Story = {
  render: () => (
    <div className="w-72 rounded-lg border border-border bg-surface-raised p-4 shadow-md">
      <h3 className="mb-2 text-h4 text-text">Release notes</h3>
      <ScrollArea className="h-48">
        <div className="flex flex-col gap-3 pr-3 text-body-sm text-text-muted">
          {Array.from({ length: 12 }).map((_, i) => (
            <p key={i}>
              Change {i + 1}: a longer line of supporting copy that demonstrates the wrapped
              scrollable body inside a raised surface panel.
            </p>
          ))}
        </div>
      </ScrollArea>
    </div>
  ),
};
