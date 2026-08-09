import type * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Audio } from '@rogueoak/canopy/branches';

/**
 * Branches/Audio - the sound-player Branch (spec 0071), a basic player built on `howler.js`:
 * play/pause, skip back, skip forward, and a scrubbable progress bar.
 *
 * The contrast with `Branches/Video` is the point. video.js IS a UI, so Video's job was a skin -
 * a stylesheet (`@rogueoak/canopy/video.css`) restyling video.js's own control-bar classes, wired
 * once in this showcase's global CSS. howler renders NOTHING: it is a pure playback engine with no
 * DOM and no CSS. So Canopy owns the whole UI here, built from the `Button` and `Slider` Seeds and
 * ordinary token utilities - which means there is no stylesheet to ship and no extra wiring. A
 * consumer who has Canopy set up gets this component for free.
 *
 * There is no per-story theme code: toggle the toolbar Light / Dark control and the player
 * re-themes through the token layer (spec 0004). The `BrandOverride` story proves the same seam
 * serves a consumer brand.
 *
 * howler is loaded through a lazy dynamic import (it touches `window` at module scope, so it must
 * stay client-only), and the position loop runs only while audio is actually playing - howler has
 * no `timeupdate` event, so position is polled, and an idle player should burn no frames.
 */
const meta = {
  title: 'Branches/Audio',
  component: Audio,
  parameters: { layout: 'centered' },
  argTypes: {
    src: { control: 'text' },
    autoplay: { control: 'boolean' },
    loop: { control: 'boolean' },
    html5: { control: 'boolean' },
    volume: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
    skipBackSeconds: { control: { type: 'number', min: 1 } },
    skipForwardSeconds: { control: { type: 'number', min: 1 } },
  },
  args: {
    // A CORS-enabled clip: howler's default Web Audio path fetches the media by XHR, so the host
    // must send `Access-Control-Allow-Origin`. See `LongFileStreaming` for the way around that.
    src: 'https://cdn.freesound.org/previews/612/612095_5674468-lq.mp3',
    autoplay: false,
    loop: false,
    volume: 1,
    skipBackSeconds: 10,
    skipForwardSeconds: 10,
  },
} satisfies Meta<typeof Audio>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The default player: a scrub bar over the elapsed / total times, transport controls beneath. */
export const Playground: Story = {
  render: (args) => (
    <div className="w-[420px] max-w-full">
      <Audio {...args} />
    </div>
  ),
};

/**
 * The two skip intervals are independent props, so the usual podcast convention - back 15,
 * forward 30 - needs no new component. Each button's label is built from the value it acts on, so
 * the accessible name can never drift from the behaviour.
 */
export const PodcastSkips: Story = {
  args: { skipBackSeconds: 15, skipForwardSeconds: 30 },
  render: (args) => (
    <div className="w-[420px] max-w-full">
      <Audio {...args} />
    </div>
  ),
};

/**
 * Long files want `html5`. Web Audio buffers the whole clip before playing, so anything
 * podcast-length should stream through HTML5 Audio instead - here, a six-minute track that starts
 * playing immediately rather than after a multi-megabyte download.
 *
 * `html5` also sidesteps CORS: the Web Audio path fetches media by XHR and so needs the host to
 * send `Access-Control-Allow-Origin`, while an HTML5 Audio element does not. A cross-origin source
 * that refuses to load on the default path will usually play with `html5` set.
 */
export const LongFileStreaming: Story = {
  args: { html5: true, src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  render: (args) => (
    <div className="w-[420px] max-w-full">
      <Audio {...args} />
    </div>
  ),
};

/** The player fills its container, so it sits equally well in a narrow column or a wide one. */
export const FullWidth: Story = {
  render: (args) => (
    <div className="w-[720px] max-w-full">
      <Audio {...args} />
    </div>
  ),
};

/**
 * Resume where a listener left off. `startAtSeconds` is applied once the media loads and clamped to
 * its length - a starting position, not a controlled one, so a later change will not yank a
 * listener who has since scrubbed somewhere else.
 */
export const StartAtPosition: Story = {
  args: { startAtSeconds: 8 },
  render: (args) => (
    <div className="w-[420px] max-w-full">
      <Audio {...args} />
    </div>
  ),
};

/**
 * The failure state, shown with a URL that cannot load. This matters more than it looks: howler's
 * default Web Audio path fetches by XHR, so any cross-origin file without CORS headers lands here -
 * and without a distinct error state it would be indistinguishable from a slow network, inert
 * controls either way.
 */
export const FailedToLoad: Story = {
  args: { src: 'https://example.com/does-not-exist.mp3' },
  render: (args) => (
    <div className="w-[420px] max-w-full">
      <Audio {...args} />
    </div>
  ),
};

/**
 * Nothing is fetched until the reader asks for it. With `preload={false}` the player sits idle with
 * a live play button; pressing it starts the load and raises the spinner.
 */
export const LoadOnDemand: Story = {
  args: { preload: false },
  render: (args) => (
    <div className="w-[420px] max-w-full">
      <Audio {...args} />
    </div>
  ),
};

/**
 * Consumer brand override. Every element is a Canopy element styled with semantic role tokens, so
 * re-pointing `--color-primary` on a wrapper - exactly what `buildBrand()` (spec 0028) or an app's
 * own `:root { --color-*: ... }` does - re-themes the play button and the filled scrub range with
 * no component change.
 */
export const BrandOverride: Story = {
  render: (args) => (
    <div
      className="w-[420px] max-w-full"
      style={
        {
          '--color-primary': 'oklch(0.62 0.22 15)',
          '--color-primary-foreground': 'oklch(0.98 0 0)',
          '--color-primary-hover': 'oklch(0.56 0.22 15)',
        } as React.CSSProperties
      }
    >
      <Audio {...args} />
    </div>
  ),
};

/**
 * The dark player, shown by default rather than only via the toolbar - the `.dark` class re-points
 * the role vars for this subtree, so the surface, border, controls, and track re-theme with no
 * component change.
 */
export const Dark: Story = {
  render: (args) => (
    <div className="dark w-[420px] max-w-full rounded-lg bg-bg p-6">
      <Audio {...args} />
    </div>
  ),
};
