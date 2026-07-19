import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as React from 'react';
import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Video, buildOptions } from './Video';

// video.js needs real media APIs jsdom lacks, so we mock the module and assert the MAPPING we own
// (the options we build, the reactive src()/poster() calls, dispose on unmount, onReady) rather
// than video.js's browser internals - the "test your own mapping, not the library" learning. The
// ready callback is invoked ASYNCHRONOUSLY (as real video.js does), so the `player` const in the
// component is already assigned when it fires.
const mock = vi.hoisted(() => {
  type MockPlayer = {
    dispose: ReturnType<typeof vi.fn>;
    isDisposed: ReturnType<typeof vi.fn>;
    src: ReturnType<typeof vi.fn>;
    poster: ReturnType<typeof vi.fn>;
  };
  const state = {
    calls: [] as { el: HTMLElement; options: Record<string, unknown>; player: MockPlayer }[],
  };
  const videojs = vi.fn((el: HTMLElement, options: Record<string, unknown>, ready?: () => void) => {
    const player: MockPlayer = {
      dispose: vi.fn(),
      isDisposed: vi.fn(() => false),
      src: vi.fn(),
      poster: vi.fn(),
    };
    state.calls.push({ el, options, player });
    if (ready) void Promise.resolve().then(() => ready.call(player));
    return player;
  });
  return { videojs, state };
});

vi.mock('video.js', () => ({ default: mock.videojs }));

const lastPlayer = () => mock.state.calls.at(-1)?.player;
const lastOptions = () => mock.state.calls.at(-1)?.options;

beforeEach(() => {
  mock.videojs.mockClear();
  mock.state.calls.length = 0;
});

afterEach(() => {
  cleanup();
});

describe('buildOptions (the props -> video.js options mapping we own)', () => {
  it('applies the documented defaults', () => {
    expect(buildOptions({})).toMatchObject({
      controls: true,
      autoplay: false,
      loop: false,
      muted: false,
      preload: 'metadata',
      playsinline: true,
      fluid: true,
    });
  });

  it('normalises a single `src` to a sources entry', () => {
    expect(buildOptions({ src: 'clip.mp4' }).sources).toEqual([{ src: 'clip.mp4' }]);
  });

  it('prefers `sources` over `src`', () => {
    const sources = [{ src: 'clip.webm', type: 'video/webm' }];
    expect(buildOptions({ src: 'clip.mp4', sources }).sources).toEqual(sources);
  });

  it('maps the camelCase `playsInline` prop to video.js `playsinline`', () => {
    expect(buildOptions({ playsInline: false }).playsinline).toBe(false);
  });

  it('carries poster / aspectRatio / width / height when set', () => {
    expect(
      buildOptions({ poster: 'p.jpg', aspectRatio: '16:9', width: 640, height: 360 }),
    ).toMatchObject({ poster: 'p.jpg', aspectRatio: '16:9', width: 640, height: 360 });
  });

  it('honours the first-class `fluid={false}` fixed-size path', () => {
    // The fixed-size acceptance item is driven by the PROP, not only via `options` - a regression
    // dropping `fluid` from the explicit set would still pass if only the options path were tested.
    expect(buildOptions({ fluid: false, width: 480, height: 270 })).toMatchObject({
      fluid: false,
      width: 480,
      height: 270,
    });
  });

  it('lets `options` override a default the caller did not set', () => {
    // no `fluid` prop -> the passthrough wins over the default.
    expect(buildOptions({ options: { fluid: false } }).fluid).toBe(false);
  });

  it('lets an explicit prop win over the same key in `options` (distinct-value fixture)', () => {
    // muted prop=true vs options.muted=false: prop must win. preload only in options: it survives.
    const built = buildOptions({ muted: true, options: { muted: false, preload: 'auto' } });
    expect(built.muted).toBe(true);
    expect(built.preload).toBe('auto');
    // fluid prop=true vs options.fluid=false: prop wins.
    expect(buildOptions({ fluid: true, options: { fluid: false } }).fluid).toBe(true);
  });
});

describe('Video (lifecycle + integration)', () => {
  it('renders a data-vjs-player wrapper and lazily creates the player once', async () => {
    const { container } = render(<Video src="clip.mp4" />);
    const wrapper = container.querySelector('[data-vjs-player]');
    expect(wrapper).not.toBeNull();
    // The <video> node is created imperatively for video.js to enhance.
    expect(wrapper?.querySelector('video')).not.toBeNull();

    await waitFor(() => expect(mock.videojs).toHaveBeenCalledTimes(1));
    expect(mock.state.calls[0].el.tagName).toBe('VIDEO');
    expect(lastOptions()?.sources).toEqual([{ src: 'clip.mp4' }]);
  });

  it('fires onReady with the player instance', async () => {
    const onReady = vi.fn();
    render(<Video src="clip.mp4" onReady={onReady} />);
    await waitFor(() => expect(onReady).toHaveBeenCalledTimes(1));
    expect(onReady).toHaveBeenCalledWith(lastPlayer());
  });

  it('swaps the source reactively WITHOUT re-creating the player', async () => {
    const { rerender } = render(<Video src="first.mp4" />);
    await waitFor(() => expect(mock.videojs).toHaveBeenCalledTimes(1));
    const player = lastPlayer();

    rerender(<Video src="second.mp4" />);
    await waitFor(() => expect(player.src).toHaveBeenCalledWith([{ src: 'second.mp4' }]));
    // Still one construction - the player was updated, not rebuilt.
    expect(mock.videojs).toHaveBeenCalledTimes(1);
  });

  it('updates the poster reactively without re-creating the player', async () => {
    const { rerender } = render(<Video src="clip.mp4" poster="a.jpg" />);
    await waitFor(() => expect(mock.videojs).toHaveBeenCalledTimes(1));
    const player = lastPlayer();
    rerender(<Video src="clip.mp4" poster="b.jpg" />);
    await waitFor(() => expect(player.poster).toHaveBeenCalledWith('b.jpg'));
    expect(mock.videojs).toHaveBeenCalledTimes(1);
  });

  it('does not create a player, and removes the <video>, if unmounted before video.js loads', async () => {
    // The dynamic import resolves on a later microtask; unmounting synchronously first must set the
    // `cancelled` guard so no player is ever constructed and the raw <video> we appended is removed.
    const { container, unmount } = render(<Video src="clip.mp4" />);
    expect(container.querySelector('video')).not.toBeNull();
    unmount();
    // Flush the pending import().then the guard runs in (a macrotask covers all its microtask hops).
    await new Promise((resolve) => setTimeout(resolve, 0));
    // The `cancelled` guard means video.js is never constructed into the torn-down container - the
    // load-bearing assertion (without it, a leaked, never-disposed player would be created).
    expect(mock.videojs).not.toHaveBeenCalled();
    expect(container.querySelector('video')).toBeNull();
  });

  it('disposes the player on unmount', async () => {
    const { unmount } = render(<Video src="clip.mp4" />);
    await waitFor(() => expect(mock.videojs).toHaveBeenCalledTimes(1));
    const player = lastPlayer();
    unmount();
    expect(player.dispose).toHaveBeenCalledTimes(1);
  });

  it('merges the caller className onto the wrapper (caller wins)', () => {
    const { container } = render(<Video src="clip.mp4" className="rounded-xl" />);
    expect(container.querySelector('[data-vjs-player]')).toHaveClass('rounded-xl');
  });

  it('forwards ref to the wrapper element', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Video src="clip.mp4" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current?.getAttribute('data-vjs-player')).not.toBeNull();
  });
});

describe('video.css skin (theming + brand-override guarantee)', () => {
  // vitest runs in the package dir; `video.css` sits at the package root. (jsdom makes
  // `import.meta.url` a non-file URL, so resolve from cwd instead.)
  const raw = readFileSync(resolve(process.cwd(), 'video.css'), 'utf8');
  // Guard the actual DECLARATIONS, not the file's own explanatory comment (which names the
  // forbidden forms - `--color-moss-600`, `.dark`, `rgba()` - as examples of what NOT to do).
  const css = raw.replace(/\/\*[\s\S]*?\*\//g, '');

  // Every semantic ROLE token (from roots color/semantic.json). A `var(--color-*)` in the skin
  // that is NOT one of these would be a primitive ramp or a typo - either way it would opt the
  // player out of a consumer's brand override, which re-points exactly these role names.
  const ROLE_TOKENS = new Set([
    'bg',
    'surface',
    'surface-raised',
    'overlay',
    'text',
    'text-muted',
    'text-subtle',
    'text-inverted',
    'border',
    'border-strong',
    'ring',
    'ring-offset',
    'primary',
    'primary-foreground',
    'primary-hover',
    'primary-active',
    'secondary',
    'secondary-foreground',
    'secondary-hover',
    'secondary-active',
    'accent',
    'accent-strong',
    'accent-foreground',
    'accent-hover',
    'muted',
    'muted-foreground',
    'muted-raised',
    'success',
    'success-foreground',
    'warning',
    'warning-foreground',
    'danger',
    'danger-foreground',
    'danger-hover',
    'danger-active',
    'disabled',
    'disabled-foreground',
    'info',
    'info-foreground',
  ]);

  it('styles against Canopy tokens', () => {
    expect(css).toContain('var(--color-');
  });

  it('contains no hardcoded hex colour (would fork the palette)', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  it('contains no rgb()/rgba() literal (would fork the palette)', () => {
    expect(css).not.toMatch(/\brgba?\(/);
  });

  it('carries no `.dark` selector (themes via the token layer, not hand-authored)', () => {
    expect(css).not.toMatch(/\.dark\b/);
  });

  it('references NO primitive ramp var - only overridable role tokens', () => {
    // primitive form is `--color-<ramp>-<step>` e.g. --color-moss-600.
    expect(css).not.toMatch(/--color-[a-z]+-\d/);
  });

  it('every colour var it uses is a brand-overridable role token', () => {
    const refs = [...css.matchAll(/var\(--color-([a-z-]+)\)/g)].map((m) => m[1]);
    expect(refs.length).toBeGreaterThan(0);
    const unknown = refs.filter((name) => !ROLE_TOKENS.has(name));
    // If this fails, the listed names are not semantic roles, so a consumer brand override would
    // NOT reach them - the whole point of the skin referencing only roles.
    expect(unknown).toEqual([]);
  });

  it('actually USES the brand accent role (--color-primary) on the controls', () => {
    // "Every var is a role" is necessary but not sufficient: a skin that accented everything with
    // --color-surface/--color-text would pass that AND still leave a consumer's brand `--color-primary`
    // override invisible. Assert the accent role is genuinely referenced, so the brand override the
    // acceptance item promises actually reaches the player's controls.
    const refs = [...css.matchAll(/var\(--color-([a-z-]+)\)/g)].map((m) => m[1]);
    expect(refs).toContain('primary');
  });
});
