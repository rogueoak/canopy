import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Avatar, AvatarFallback, AvatarImage, Button } from '@rogueoak/canopy/seeds';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@rogueoak/canopy/branches';

/**
 * Branches/HoverCard - the canopy rich-preview Branch (spec 0057), built on
 * `@radix-ui/react-hover-card`. It fills the middle gap between Tooltip (0014, short
 * non-interactive text) and the click-driven Popover: a rich preview surface that opens on hover
 * AND keyboard focus, does NOT trap focus, and keeps its content in the normal tab order - the
 * pattern behind link previews, `@mention` user cards, and repository hover-cards. Radix owns the
 * hover-intent timing, the grace area between trigger and content, focus-open, collision-aware
 * positioning, and the portal.
 *
 * There is NO per-story theme code: toggle the toolbar Light / Dark control and every story -
 * including the portalled content on `bg-surface-raised` - re-themes via the token layer (spec
 * 0004). The content carries the shared pop motion (`animate-pop-in` / `animate-pop-out`) gated by
 * `motion-reduce:animate-none`.
 */
const meta = {
  title: 'Branches/HoverCard',
  component: HoverCard,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof HoverCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ------------------------------------------------------------------ Playground */

/** A link trigger opening a simple preview surface. Hover or Tab to the trigger to open it. */
export const Playground: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger asChild>
        <a href="https://roots.rogueoak.dev" className="text-accent underline underline-offset-4">
          @rogueoak
        </a>
      </HoverCardTrigger>
      <HoverCardContent>
        <p className="text-body-sm">
          The design-system org behind Roots tokens and the canopy component library.
        </p>
      </HoverCardContent>
    </HoverCard>
  ),
};

/* --------------------------------------------------------------------- UserCard */

/** A profile preview: avatar + name + bio + follower stats - the `@mention` user-card pattern. */
export const UserCard: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger asChild>
        <a href="https://example.com" className="text-accent underline underline-offset-4">
          @ada
        </a>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="flex gap-4">
          <Avatar>
            <AvatarImage src="https://i.pravatar.cc/80?img=5" alt="Ada Lovelace" />
            <AvatarFallback>AL</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-1">
            <p className="text-label">Ada Lovelace</p>
            <p className="text-body-sm text-text-muted">
              Mathematician and writer, chiefly known for work on the Analytical Engine.
            </p>
            <div className="mt-1 flex gap-4 text-caption text-text-subtle">
              <span>
                <span className="text-text">128</span> following
              </span>
              <span>
                <span className="text-text">4.2k</span> followers
              </span>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  ),
};

/* ------------------------------------------------------------------ LinkPreview */

/** An inline link trigger inside prose - "peek at this before you navigate". */
export const LinkPreview: Story = {
  render: () => (
    <p className="max-w-md text-body">
      Canopy is built on{' '}
      <HoverCard>
        <HoverCardTrigger asChild>
          <a href="https://example.com" className="text-accent underline underline-offset-4">
            Radix primitives
          </a>
        </HoverCardTrigger>
        <HoverCardContent>
          <p className="text-label">Radix UI</p>
          <p className="mt-1 text-body-sm text-text-muted">
            Unstyled, accessible component primitives that handle focus, keyboard, and ARIA so the
            design system owns only the tokens and styling.
          </p>
        </HoverCardContent>
      </HoverCard>{' '}
      and the 0005 component recipe.
    </p>
  ),
};

/* ----------------------------------------------------------------------- Delays */

/** Custom hover-intent timing: a longer `openDelay` and a snappier `closeDelay`. */
export const Delays: Story = {
  render: () => (
    <HoverCard openDelay={600} closeDelay={100}>
      <HoverCardTrigger asChild>
        <Button variant="outline">Hover and wait</Button>
      </HoverCardTrigger>
      <HoverCardContent>
        <p className="text-body-sm">
          This card waits 600ms before opening and closes 100ms after you leave.
        </p>
      </HoverCardContent>
    </HoverCard>
  ),
};

/* ------------------------------------------------------------------ Controlled */

/**
 * A controlled HoverCard: `open` state lives in this top-level component (never a hook inside a
 * `render` arrow), so an external Button can toggle the preview programmatically alongside the
 * usual hover/focus behaviour.
 */
function ControlledHoverCard() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col items-center gap-4">
      <Button variant="outline" onClick={() => setOpen((v) => !v)}>
        Toggle from outside
      </Button>
      <p className="text-body-sm text-text-muted">The card is {open ? 'open' : 'closed'}.</p>
      <HoverCard open={open} onOpenChange={setOpen}>
        <HoverCardTrigger asChild>
          <a href="https://example.com" className="text-accent underline underline-offset-4">
            @ada
          </a>
        </HoverCardTrigger>
        <HoverCardContent>
          <p className="text-label">Ada Lovelace</p>
          <p className="mt-1 text-body-sm text-text-muted">
            Its open state is owned by the surrounding component.
          </p>
        </HoverCardContent>
      </HoverCard>
    </div>
  );
}

export const Controlled: Story = {
  render: () => <ControlledHoverCard />,
};
