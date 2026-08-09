import * as React from 'react';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Audio, buildOptions, formatTime } from './Audio';

// jsdom implements neither Web Audio nor real media playback, so we mock the `howler` module and
// assert the mapping and the behaviour WE own - the options we build, the seek arithmetic, the
// lifecycle, the a11y - never howler's internals ("test your own mapping, not the library").
//
// The mock is a small event-emitting stand-in for `Howl`: the component drives it (play/pause/
// seek/unload) and it drives the component back through the events a real Howl fires, so both
// directions of the seam are exercised.
const mock = vi.hoisted(() => {
  class MockHowl {
    options: Record<string, unknown>;
    handlers = new Map<string, Array<() => void>>();
    position = 0;
    mediaDuration = 0;
    looping = false;

    play = vi.fn(() => {
      this.emit('play');
    });
    pause = vi.fn(() => {
      this.emit('pause');
    });
    unload = vi.fn();
    off = vi.fn(() => {
      this.handlers.clear();
    });
    seek = vi.fn((value?: number) => {
      if (value === undefined) return this.position;
      this.position = value;
      return this;
    });
    duration = vi.fn(() => this.mediaDuration);
    volume = vi.fn();
    loop = vi.fn((value?: boolean) => {
      if (value === undefined) return this.looping;
      this.looping = value;
      return this;
    });

    constructor(options: Record<string, unknown>) {
      this.options = options;
      state.instances.push(this);
    }

    on(event: string, handler: () => void) {
      const existing = this.handlers.get(event) ?? [];
      this.handlers.set(event, [...existing, handler]);
      return this;
    }

    emit(event: string) {
      for (const handler of this.handlers.get(event) ?? []) handler();
    }
  }

  const state = { instances: [] as MockHowl[] };
  return { MockHowl, state };
});

vi.mock('howler', () => ({ Howl: mock.MockHowl }));

const instances = () => mock.state.instances;
const lastHowl = () => mock.state.instances.at(-1);

/** Wait for the dynamic `import('howler')` to resolve and the player to be constructed. */
async function waitForPlayer() {
  await waitFor(() => expect(lastHowl()).toBeDefined());
  return lastHowl()!;
}

/** Fire howler's `load` with a duration, the point at which the controls become operable. */
async function loadMedia(seconds: number) {
  const howl = await waitForPlayer();
  howl.mediaDuration = seconds;
  await act(async () => {
    howl.emit('load');
  });
  return howl;
}

/** Render, then load the media - the common setup for the transport/seek tests. */
async function renderLoaded(
  props: Partial<React.ComponentProps<typeof Audio>> = {},
  seconds = 180,
) {
  const utils = render(<Audio src="clip.mp3" {...props} />);
  const howl = await loadMedia(seconds);
  return { ...utils, howl };
}

// The position loop is driven by requestAnimationFrame. Stub both halves so the loop never
// actually schedules in tests (an unstubbed rAF would recurse forever) and so the cancellation
// the component promises is directly observable.
const frame = { request: vi.fn(), cancel: vi.fn() };

beforeEach(() => {
  mock.state.instances.length = 0;
  let id = 0;
  frame.request = vi.fn(() => ++id);
  frame.cancel = vi.fn();
  vi.stubGlobal('requestAnimationFrame', frame.request);
  vi.stubGlobal('cancelAnimationFrame', frame.cancel);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

/* ------------------------------------------------------- the props -> howler options mapping */

describe('buildOptions (the props -> howler options mapping we own)', () => {
  it('applies the documented defaults', () => {
    expect(buildOptions({ src: 'clip.mp3' })).toMatchObject({
      autoplay: false,
      loop: false,
      volume: 1,
      preload: true,
      html5: false,
    });
  });

  it('normalises a single `src` string to howler’s array form', () => {
    expect(buildOptions({ src: 'clip.mp3' }).src).toEqual(['clip.mp3']);
  });

  it('passes an `src` array through as the fallback list, in order', () => {
    expect(buildOptions({ src: ['clip.webm', 'clip.mp3'] }).src).toEqual(['clip.webm', 'clip.mp3']);
  });

  it('maps every first-class prop onto its howler option', () => {
    expect(
      buildOptions({
        src: 'clip.mp3',
        format: ['mp3'],
        autoplay: true,
        loop: true,
        volume: 0.25,
        preload: false,
        html5: true,
      }),
    ).toMatchObject({
      format: ['mp3'],
      autoplay: true,
      loop: true,
      volume: 0.25,
      preload: false,
      html5: true,
    });
  });

  it('merges the `options` passthrough for keys the props do not own', () => {
    const built = buildOptions({ src: 'clip.mp3', options: { rate: 1.5, mute: true } });
    expect(built).toMatchObject({ rate: 1.5, mute: true, volume: 1 });
  });

  it('lets an explicit prop win over the same key in `options`', () => {
    // DISTINCT values on both sides, so a swapped precedence fails loudly rather than passing
    // because the two happened to agree.
    const built = buildOptions({ src: 'clip.mp3', volume: 0.2, options: { volume: 0.9 } });
    expect(built.volume).toBe(0.2);
  });

  it('leaves a key to `options` when the prop owning it is unset', () => {
    expect(buildOptions({ src: 'clip.mp3', options: { volume: 0.9 } }).volume).toBe(0.9);
  });

  it('never lets `options` override the source', () => {
    const built = buildOptions({ src: 'clip.mp3', options: { src: ['other.mp3'] } });
    expect(built.src).toEqual(['clip.mp3']);
  });
});

/* -------------------------------------------------------------------------- time formatting */

describe('formatTime', () => {
  it('renders sub-hour positions as m:ss', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(5)).toBe('0:05');
    expect(formatTime(65)).toBe('1:05');
    expect(formatTime(142)).toBe('2:22');
    expect(formatTime(3599)).toBe('59:59');
  });

  it('widens to h:mm:ss only at the hour boundary', () => {
    expect(formatTime(3600)).toBe('1:00:00');
    expect(formatTime(3725)).toBe('1:02:05');
  });

  it('reads as 0:00 for a duration that is not known yet', () => {
    expect(formatTime(NaN)).toBe('0:00');
    expect(formatTime(Infinity)).toBe('0:00');
    expect(formatTime(-5)).toBe('0:00');
  });
});

/* ------------------------------------------------------------------------ player lifecycle */

describe('player lifecycle', () => {
  it('constructs a Howl with the options built from props', async () => {
    render(<Audio src="clip.mp3" html5 volume={0.5} />);
    const howl = await waitForPlayer();
    expect(howl.options).toMatchObject({ src: ['clip.mp3'], html5: true, volume: 0.5 });
  });

  it('unloads the Howl on unmount, so no audio survives the component', async () => {
    const { unmount } = render(<Audio src="clip.mp3" />);
    const howl = await waitForPlayer();
    unmount();
    expect(howl.unload).toHaveBeenCalled();
  });

  it('detaches its event handlers before unloading', async () => {
    const { unmount } = render(<Audio src="clip.mp3" />);
    const howl = await waitForPlayer();
    unmount();
    expect(howl.off).toHaveBeenCalled();
  });

  it('rebuilds the player when the source changes', async () => {
    const { rerender } = render(<Audio src="clip.mp3" />);
    const first = await waitForPlayer();
    rerender(<Audio src="other.mp3" />);
    await waitFor(() => expect(instances()).toHaveLength(2));
    expect(first.unload).toHaveBeenCalled();
    expect(lastHowl()!.options).toMatchObject({ src: ['other.mp3'] });
  });

  it('does NOT rebuild the player when an unrelated prop changes', async () => {
    const { rerender } = render(<Audio src="clip.mp3" skipForwardSeconds={10} />);
    await waitForPlayer();
    rerender(<Audio src="clip.mp3" skipForwardSeconds={30} className="mt-4" />);
    // A settle window: if a rebuild were coming, it would land here.
    await act(async () => {});
    expect(instances()).toHaveLength(1);
  });

  it('does not construct a player when unmounted before the dynamic import resolves', async () => {
    const { unmount } = render(<Audio src="clip.mp3" />);
    unmount();
    await act(async () => {});
    expect(instances()).toHaveLength(0);
  });

  it('applies a live `volume` change through the instance rather than by rebuilding', async () => {
    const { rerender } = render(<Audio src="clip.mp3" volume={1} />);
    const howl = await waitForPlayer();
    rerender(<Audio src="clip.mp3" volume={0.3} />);
    await waitFor(() => expect(howl.volume).toHaveBeenCalledWith(0.3));
    expect(instances()).toHaveLength(1);
  });

  it('applies a live `loop` change through the instance rather than by rebuilding', async () => {
    const { rerender } = render(<Audio src="clip.mp3" loop={false} />);
    const howl = await waitForPlayer();
    rerender(<Audio src="clip.mp3" loop />);
    await waitFor(() => expect(howl.loop).toHaveBeenCalledWith(true));
    expect(instances()).toHaveLength(1);
  });
});

/* --------------------------------------------------------------------------------- transport */

describe('transport controls', () => {
  it('plays on click and flips the button to Pause', async () => {
    const user = userEvent.setup();
    const { howl } = await renderLoaded();

    await user.click(screen.getByRole('button', { name: 'Play' }));

    expect(howl.play).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Play' })).not.toBeInTheDocument();
  });

  it('pauses on the second click and flips back to Play', async () => {
    const user = userEvent.setup();
    const { howl } = await renderLoaded();

    await user.click(screen.getByRole('button', { name: 'Play' }));
    await user.click(screen.getByRole('button', { name: 'Pause' }));

    expect(howl.pause).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
  });

  it('seeks forward by `skipForwardSeconds`', async () => {
    const user = userEvent.setup();
    const { howl } = await renderLoaded({ skipForwardSeconds: 30 });

    await user.click(screen.getByRole('button', { name: 'Skip forward 30 seconds' }));

    expect(howl.seek).toHaveBeenCalledWith(30);
  });

  it('seeks back by `skipBackSeconds`', async () => {
    const user = userEvent.setup();
    const { howl } = await renderLoaded({ skipBackSeconds: 15 });
    howl.position = 100;
    await act(async () => {
      howl.emit('pause');
    });

    await user.click(screen.getByRole('button', { name: 'Skip back 15 seconds' }));

    expect(howl.seek).toHaveBeenCalledWith(85);
  });

  it('uses the two skip intervals independently (they cannot be transposed)', async () => {
    const user = userEvent.setup();
    // Deliberately DIFFERENT values: if the component read one prop for both directions, or swapped
    // them, one of these two assertions fails.
    const { howl } = await renderLoaded({ skipBackSeconds: 15, skipForwardSeconds: 45 });

    await user.click(screen.getByRole('button', { name: 'Skip forward 45 seconds' }));
    expect(howl.seek).toHaveBeenCalledWith(45);

    await user.click(screen.getByRole('button', { name: 'Skip back 15 seconds' }));
    expect(howl.seek).toHaveBeenCalledWith(30);
  });

  it('clamps a skip back to the start rather than going negative', async () => {
    const user = userEvent.setup();
    const { howl } = await renderLoaded({ skipBackSeconds: 10 });
    howl.position = 3;
    await act(async () => {
      howl.emit('pause');
    });

    await user.click(screen.getByRole('button', { name: 'Skip back 10 seconds' }));

    expect(howl.seek).toHaveBeenCalledWith(0);
  });

  it('clamps a skip forward to the duration rather than going past the end', async () => {
    const user = userEvent.setup();
    const { howl } = await renderLoaded({ skipForwardSeconds: 30 }, 180);
    howl.position = 170;
    await act(async () => {
      howl.emit('pause');
    });

    await user.click(screen.getByRole('button', { name: 'Skip forward 30 seconds' }));

    expect(howl.seek).toHaveBeenCalledWith(180);
  });

  it('disables the skip controls until the duration is known', async () => {
    render(<Audio src="clip.mp3" />);
    await waitForPlayer();

    expect(screen.getByRole('button', { name: 'Skip forward 10 seconds' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Skip back 10 seconds' })).toBeDisabled();
    // Play stays live: with `preload={false}` pressing play is what triggers the load.
    expect(screen.getByRole('button', { name: 'Play' })).toBeEnabled();

    await loadMedia(180);
    expect(screen.getByRole('button', { name: 'Skip forward 10 seconds' })).toBeEnabled();
  });
});

/* ---------------------------------------------------------------------------- the scrub bar */

describe('the scrub bar', () => {
  it('is disabled, with a zero duration, until the media loads', async () => {
    render(<Audio src="clip.mp3" />);
    await waitForPlayer();

    expect(screen.getByRole('slider')).toHaveAttribute('data-disabled');
    // Both readouts sit at zero before the media loads: elapsed and an unknown duration.
    expect(screen.getAllByText('0:00')).toHaveLength(2);
  });

  it('exposes the duration as the range once loaded', async () => {
    await renderLoaded({}, 180);

    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuemax', '180');
    expect(slider).toHaveAttribute('aria-valuemin', '0');
  });

  it('announces its position as formatted time, not a raw second count', async () => {
    const { howl } = await renderLoaded({}, 180);
    howl.position = 142;
    await act(async () => {
      howl.emit('pause');
    });

    // The raw `aria-valuenow` would announce "one hundred forty two"; `aria-valuetext` is read in
    // preference to it, and reads as the clock time a listener actually recognises.
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuetext', '2:22');
  });

  it('seeks when a keyboard scrub commits', async () => {
    const user = userEvent.setup();
    const { howl } = await renderLoaded({}, 180);

    await user.tab();
    await user.keyboard('{ArrowRight}');

    await waitFor(() => expect(howl.seek).toHaveBeenCalledWith(1));
  });

  it('renders the elapsed and total time', async () => {
    const { howl } = await renderLoaded({}, 185);
    howl.position = 65;
    await act(async () => {
      howl.emit('pause');
    });

    expect(screen.getByText('1:05')).toBeInTheDocument();
    expect(screen.getByText('3:05')).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------------ the position loop */

describe('the position loop', () => {
  it('starts only when playback starts', async () => {
    const { howl } = await renderLoaded();
    expect(frame.request).not.toHaveBeenCalled();

    await act(async () => {
      howl.emit('play');
    });

    expect(frame.request).toHaveBeenCalled();
  });

  it('is cancelled on pause, so an idle player burns no frames', async () => {
    const { howl } = await renderLoaded();
    await act(async () => {
      howl.emit('play');
    });
    frame.cancel.mockClear();

    await act(async () => {
      howl.emit('pause');
    });

    expect(frame.cancel).toHaveBeenCalled();
  });

  it('is cancelled when the media ends', async () => {
    const { howl } = await renderLoaded();
    await act(async () => {
      howl.emit('play');
    });
    frame.cancel.mockClear();

    await act(async () => {
      howl.emit('end');
    });

    expect(frame.cancel).toHaveBeenCalled();
  });

  it('is cancelled on unmount', async () => {
    const { howl, unmount } = await renderLoaded();
    await act(async () => {
      howl.emit('play');
    });
    frame.cancel.mockClear();

    unmount();

    expect(frame.cancel).toHaveBeenCalled();
  });

  it('keeps running past `end` when the player is looping', async () => {
    const { howl } = await renderLoaded({ loop: true });
    howl.looping = true;
    await act(async () => {
      howl.emit('play');
    });
    frame.cancel.mockClear();

    await act(async () => {
      howl.emit('end');
    });

    expect(frame.cancel).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
  });
});

/* ----------------------------------------------------------------------------------- events */

describe('events', () => {
  it('hands the Howl instance to `onReady` once loaded', async () => {
    const onReady = vi.fn();
    render(<Audio src="clip.mp3" onReady={onReady} />);
    const howl = await loadMedia(180);

    expect(onReady).toHaveBeenCalledWith(howl);
  });

  it('fires onPlay, onPause, and onEnd', async () => {
    const onPlay = vi.fn();
    const onPause = vi.fn();
    const onEnd = vi.fn();
    const { howl } = await renderLoaded({ onPlay, onPause, onEnd });

    await act(async () => {
      howl.emit('play');
    });
    expect(onPlay).toHaveBeenCalled();

    await act(async () => {
      howl.emit('pause');
    });
    expect(onPause).toHaveBeenCalled();

    await act(async () => {
      howl.emit('end');
    });
    expect(onEnd).toHaveBeenCalled();
  });

  it('does not rebuild the player when an inline callback identity changes', async () => {
    const { rerender } = render(<Audio src="clip.mp3" onPlay={() => {}} />);
    await waitForPlayer();
    rerender(<Audio src="clip.mp3" onPlay={() => {}} />);
    await act(async () => {});

    expect(instances()).toHaveLength(1);
  });
});

/* ------------------------------------------------------------------------------ keyboard a11y */

describe('keyboard operation', () => {
  it('drives play, skip, and seek by keyboard alone', async () => {
    const user = userEvent.setup();
    const { howl } = await renderLoaded({ skipForwardSeconds: 30 }, 180);

    // Tab order follows the reading order: scrub bar, then back / play / forward.
    await user.tab();
    expect(screen.getByRole('slider')).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: 'Skip back 10 seconds' })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: 'Play' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(howl.play).toHaveBeenCalled();

    await user.tab();
    expect(screen.getByRole('button', { name: 'Skip forward 30 seconds' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(howl.seek).toHaveBeenCalledWith(30);
  });
});

/* -------------------------------------------------------------------------- the public surface */

describe('the public surface', () => {
  it('merges a caller className onto the wrapper', () => {
    const { container } = render(<Audio src="clip.mp3" className="mt-8" />);
    expect(container.firstElementChild).toHaveClass('mt-8');
  });

  it('forwards ref to the wrapper', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Audio src="clip.mp3" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('spreads native div props', () => {
    render(<Audio src="clip.mp3" data-testid="player" aria-label="Episode 12" />);
    expect(screen.getByTestId('player')).toHaveAttribute('aria-label', 'Episode 12');
  });
});
