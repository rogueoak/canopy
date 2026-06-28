import type { Meta, StoryObj } from '@storybook/react';
import { Avatar, AvatarFallback, AvatarImage } from '@rogueoak/canopy/seeds';

/**
 * Seeds/Avatar - the canopy identity Seed (spec 0015).
 *
 * Built on `@radix-ui/react-avatar`: an image with a graceful initials fallback shown while the
 * image loads, or whenever it is missing or fails to load. Styled entirely with semantic-token
 * utilities (`bg-muted` / `text-muted-foreground`) - there is NO per-story theme code: toggle
 * the toolbar Light / Dark control and every story re-themes via the token layer (spec 0004).
 */
const meta = {
  title: 'Seeds/Avatar',
  component: Avatar,
  parameters: { layout: 'centered' },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

/* A stable demo portrait (Unsplash) used by the image stories. */
const PHOTO =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=128&h=128&fit=crop&crop=faces';

/* ---------------------------------------------------------------- Playground */

export const Playground: Story = {
  args: { size: 'md' },
  render: (args) => (
    <Avatar {...args}>
      <AvatarImage src={PHOTO} alt="Ada Lovelace" />
      <AvatarFallback>AL</AvatarFallback>
    </Avatar>
  ),
};

/* --------------------------------------------------------------- With image */

export const WithImage: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Avatar>
      <AvatarImage src={PHOTO} alt="Ada Lovelace" />
      <AvatarFallback>AL</AvatarFallback>
    </Avatar>
  ),
};

/* ----------------------------------------------------------- Fallback initials */

/**
 * No `src` (and an invalid one) - Radix never resolves an image, so the initials fallback is
 * what renders. This is the same path that shows when a real image 404s or is still loading.
 */
export const FallbackInitials: Story = {
  name: 'Fallback (initials)',
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar>
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarImage src="https://invalid.example/nope.png" alt="Grace Hopper" />
        <AvatarFallback>GH</AvatarFallback>
      </Avatar>
    </div>
  ),
};

/* --------------------------------------------------------------------- Sizes */

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar size="sm">
        <AvatarImage src={PHOTO} alt="Ada Lovelace (small)" />
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>
      <Avatar size="md">
        <AvatarImage src={PHOTO} alt="Ada Lovelace (medium)" />
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>
      <Avatar size="lg">
        <AvatarImage src={PHOTO} alt="Ada Lovelace (large)" />
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>
    </div>
  ),
};

/* ----------------------------------------------------------------- Group/row */

/**
 * A row of avatars - member lists, comment threads, stacked headers. Mixes loaded images with
 * initials-only fallbacks.
 */
export const Group: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar>
        <AvatarImage src={PHOTO} alt="Ada Lovelace" />
        <AvatarFallback>AL</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>GH</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>KJ</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>MM</AvatarFallback>
      </Avatar>
    </div>
  ),
};
