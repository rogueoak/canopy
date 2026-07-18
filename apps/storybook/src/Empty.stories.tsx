import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@rogueoak/canopy/seeds';
import {
  Card,
  CardContent,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from '@rogueoak/canopy/twigs';

/**
 * Twigs/Empty - the zero-data placeholder Twig (spec 0041): a presentational composition for the
 * empty-state case that `Card` (0022), `Skeleton`, and `Spinner` (0017) do not cover - a list with
 * no rows, a search with no results, an inbox with nothing in it, a freshly created project. The
 * family is `Empty` (container) + `EmptyMedia` / `EmptyTitle` / `EmptyDescription` / `EmptyContent`,
 * centring an optional icon, a heading, muted copy, and a call-to-action row.
 *
 * There is NO per-story theme code: toggle the toolbar Light / Dark control and every story
 * re-themes via the token layer (spec 0004) - the title text, muted description, and subtle media
 * mark all flip through their tokens.
 */
const meta = {
  title: 'Twigs/Empty',
  component: Empty,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Empty>;

export default meta;
type Story = StoryObj<typeof meta>;

/* --------------------------------------------------------------------- Icons */

/** A decorative inbox glyph for the media slot (inline SVG - canopy ships no stock artwork). */
function InboxGlyph() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  );
}

/** A decorative magnifier glyph for the no-results state. */
function SearchGlyph() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

/* ------------------------------------------------------------------- Default */

/** The canonical zero-data block: icon, title, description, and a recovery action. */
export const Default: Story = {
  render: () => (
    <Empty className="w-96">
      <EmptyMedia asChild>
        <InboxGlyph />
      </EmptyMedia>
      <EmptyTitle>Your inbox is empty</EmptyTitle>
      <EmptyDescription>
        New messages will appear here. Nothing needs your attention right now.
      </EmptyDescription>
      <EmptyContent>
        <Button>Compose message</Button>
      </EmptyContent>
    </Empty>
  ),
};

/* --------------------------------------------------------------- With action */

/** Two actions in the centred, wrapping content row - a primary and a secondary path. */
export const WithAction: Story = {
  render: () => (
    <Empty className="w-96">
      <EmptyMedia asChild>
        <InboxGlyph />
      </EmptyMedia>
      <EmptyTitle>No projects yet</EmptyTitle>
      <EmptyDescription>Create your first project or import one to get started.</EmptyDescription>
      <EmptyContent>
        <Button>New project</Button>
        <Button variant="secondary">Import</Button>
      </EmptyContent>
    </Empty>
  ),
};

/* ----------------------------------------------------------------- No icon */

/** Title + description only - the media slot is optional. */
export const NoIcon: Story = {
  render: () => (
    <Empty className="w-96">
      <EmptyTitle>Nothing to show</EmptyTitle>
      <EmptyDescription>This space will fill in as you add content.</EmptyDescription>
    </Empty>
  ),
};

/* ------------------------------------------------------------- Inside a Card */

/** The empty block framed inside a `Card`, for a zero-data region within a larger layout. */
export const InsideACard: Story = {
  render: () => (
    <Card className="w-96">
      <CardContent className="p-0">
        <Empty>
          <EmptyMedia asChild>
            <InboxGlyph />
          </EmptyMedia>
          <EmptyTitle>No activity</EmptyTitle>
          <EmptyDescription>Recent activity for this workspace will show up here.</EmptyDescription>
          <EmptyContent>
            <Button variant="secondary">Refresh</Button>
          </EmptyContent>
        </Empty>
      </CardContent>
    </Card>
  ),
};

/* ------------------------------------------------------------ No search results */

/** The "no results" state after a filter or search, with a clear-filters recovery action. */
export const NoSearchResults: Story = {
  render: () => (
    <Empty className="w-96">
      <EmptyMedia asChild>
        <SearchGlyph />
      </EmptyMedia>
      <EmptyTitle>No results found</EmptyTitle>
      <EmptyDescription>
        No items match &ldquo;quarterly report&rdquo;. Try a different term or clear the filters.
      </EmptyDescription>
      <EmptyContent>
        <Button variant="ghost">Clear filters</Button>
      </EmptyContent>
    </Empty>
  ),
};
