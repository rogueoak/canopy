import type * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Video } from '@rogueoak/canopy/branches';

/**
 * Branches/Video - the media-player Branch (spec 0070), a thin wrapper over `video.js` skinned with
 * the Canopy design tokens. video.js owns the player state machine, the control-bar DOM + a11y,
 * source handling, and fullscreen; Canopy owns the SKIN, shipped as `@rogueoak/canopy/video.css`
 * and wired once in this showcase's global CSS alongside video.js's own base stylesheet (see
 * `.storybook/tailwind.css`). video.js is loaded via a lazy dynamic import, so it lands in its own
 * chunk out of the initial bundle.
 *
 * There is NO per-story theme code: toggle the toolbar Light / Dark control and the player
 * re-themes through the token layer (spec 0004), because the skin references only semantic ROLE
 * vars. The `BrandOverride` story proves the same seam serves a consumer brand - overriding
 * `--color-primary` on a wrapper re-colours the controls with zero component change.
 *
 * The lean props cover the common case (`src`/`sources`, `poster`, `controls`, `autoplay`, `loop`,
 * `muted`, `preload`, `fluid`); anything advanced goes through the `options` passthrough or the
 * `onReady(player)` instance callback.
 */
const meta = {
  title: 'Branches/Video',
  component: Video,
  parameters: { layout: 'centered' },
  argTypes: {
    controls: { control: 'boolean' },
    autoplay: { control: 'boolean' },
    loop: { control: 'boolean' },
    muted: { control: 'boolean' },
    fluid: { control: 'boolean' },
    preload: { control: 'inline-radio', options: ['auto', 'metadata', 'none'] },
    src: { control: 'text' },
    poster: { control: 'text' },
  },
  args: {
    src: 'https://vjs.zencdn.net/v/oceans.mp4',
    poster: 'https://vjs.zencdn.net/v/oceans.png',
    controls: true,
    autoplay: false,
    loop: false,
    muted: false,
    fluid: true,
    preload: 'metadata',
  },
} satisfies Meta<typeof Video>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Fluid by default: the player fills its container and keeps the video's aspect ratio. */
export const Playground: Story = {
  render: (args) => (
    <div className="w-[640px] max-w-full">
      <Video {...args} />
    </div>
  ),
};

/** A poster frame shows before playback (rendered immediately, before video.js finishes loading). */
export const WithPoster: Story = {
  render: (args) => (
    <div className="w-[640px] max-w-full">
      <Video {...args} />
    </div>
  ),
};

/** Autoplay requires `muted` in modern browsers - the two go together. */
export const AutoplayMuted: Story = {
  args: { autoplay: true, muted: true },
  render: (args) => (
    <div className="w-[640px] max-w-full">
      <Video {...args} />
    </div>
  ),
};

/** Fixed size: `fluid={false}` with explicit `width`/`height` instead of filling the container. */
export const FixedSize: Story = {
  args: { fluid: false, width: 480, height: 270 },
  render: (args) => <Video {...args} />,
};

/**
 * Consumer brand override (the added requirement). The skin reads `var(--color-primary)` for the
 * control accent, so re-pointing that role on a wrapper - exactly what `buildBrand()` (spec 0028)
 * or an app's own `:root { --color-*: ... }` does - re-themes the player with no component change.
 * Here the accent is overridden to a rose primary; play/scrub/volume follow it.
 */
export const BrandOverride: Story = {
  render: (args) => (
    <div
      className="w-[640px] max-w-full"
      style={
        {
          '--color-primary': 'oklch(0.62 0.22 15)',
          '--color-primary-foreground': 'oklch(0.98 0 0)',
        } as React.CSSProperties
      }
    >
      <Video {...args} />
    </div>
  ),
};

/**
 * The dark skin, shown by default (not only via the toolbar) - the `.dark` class re-points the role
 * vars for this subtree, so the control bar, scrubber, and menus re-theme with no component change.
 * The toolbar Light / Dark toggle drives the same seam globally.
 */
export const Dark: Story = {
  render: (args) => (
    <div className="dark w-[640px] max-w-full rounded-md bg-surface p-4">
      <Video {...args} />
    </div>
  ),
};
