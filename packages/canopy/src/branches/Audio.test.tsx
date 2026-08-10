import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Audio, buildOptions, formatTime } from './Audio';
import type { AudioHandle, AudioLoadError } from './Audio';

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
    isPlaying = false;

    // Modelled on the real thing: howler sets its internal playing flag SYNCHRONOUSLY but emits
    // `play` ASYNCHRONOUSLY (a `setTimeout(0)` on the Web Audio path, the `node.play()` promise on
    // the html5 one). The gap is the whole point - a mock that emitted synchronously would let a
    // component that branches on lagging React state pass, which is exactly the double-play bug.
    play = vi.fn(() => {
      this.isPlaying = true;
      void Promise.resolve().then(() => {
        if (this.isPlaying) this.emit('play');
      });
    });
    pause = vi.fn(() => {
      this.isPlaying = false;
      this.emit('pause');
    });
    playing = vi.fn(() => this.isPlaying);
    unload = vi.fn();
    off = vi.fn(() => {
      this.handlers.clear();
    });
    // howler's `seek()` is an overloaded getter/setter, and mid-load the GETTER returns the Howl
    // itself rather than a number. The mock reproduces that (`seekReturnsSelf`) so the component's
    // narrowing guard is actually exercised - without it an un-narrowed read renders `NaN`.
    seekReturnsSelf = false;
    seek = vi.fn((value?: number) => {
      if (value === undefined) return this.seekReturnsSelf ? this : this.position;
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

// The position loop is driven by requestAnimationFrame. The stub RECORDS each scheduled callback
// instead of discarding it, so a test can step the loop one frame at a time: a stub that only
// counted calls would never execute the tick body, and "the loop reads the player's position"
// would be untested while looking covered.
const frame = {
  request: vi.fn(),
  cancel: vi.fn(),
  scheduled: new Map<number, FrameRequestCallback>(),
};

/** Run the frame the component is currently waiting on, the way the browser would. */
function stepFrame(): boolean {
  const pending = [...frame.scheduled.entries()].at(-1);
  if (!pending) return false;
  const [handle, callback] = pending;
  frame.scheduled.delete(handle);
  callback(0);
  return true;
}

/** Whether the loop is still armed - the positive form of "was not cancelled". */
const loopIsRunning = () => frame.scheduled.size > 0;

/**
 * Radix's slider maps a pointer's clientX onto a value using the track's rect and the Pointer
 * Capture API, neither of which jsdom implements - the rect is all zeroes and `setPointerCapture`
 * does not exist, so a drag silently computes nothing. Stubbing both is what makes a real pointer
 * scrub testable here; it is stubbing the ENVIRONMENT, not the component's own behaviour.
 * 100px of track over a 100-second clip keeps the arithmetic 1px = 1s.
 */
function stubSliderGeometry(track: HTMLElement) {
  track.getBoundingClientRect = () =>
    ({ left: 0, top: 0, right: 100, bottom: 10, width: 100, height: 10, x: 0, y: 0 }) as DOMRect;
  track.setPointerCapture = () => {};
  track.releasePointerCapture = () => {};
  track.hasPointerCapture = () => true;
}

/**
 * Dispatch a pointer event carrying real coordinates. `fireEvent.pointerDown` cannot be used here:
 * jsdom does not implement `PointerEvent`, so Testing Library falls back to an event with no
 * `clientX`, and Radix reads `undefined` and computes `NaN` - a drag that silently does nothing.
 * A `MouseEvent` under the pointer event's name carries the coordinate and reaches React's
 * listener unchanged.
 */
function firePointer(target: HTMLElement, type: string, clientX: number) {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX, button: 0 });
  Object.defineProperty(event, 'pointerId', { value: 1 });
  fireEvent(target, event);
}

beforeEach(() => {
  mock.state.instances.length = 0;
  let id = 0;
  frame.scheduled = new Map();
  frame.request = vi.fn((callback: FrameRequestCallback) => {
    const handle = ++id;
    frame.scheduled.set(handle, callback);
    return handle;
  });
  frame.cancel = vi.fn((handle: number) => {
    frame.scheduled.delete(handle);
  });
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

  it('maps every first-class prop onto its engine option', () => {
    expect(
      buildOptions({
        src: 'clip.mp3',
        format: ['mp3'],
        autoplay: true,
        loop: true,
        volume: 0.25,
        preload: false,
        stream: true,
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

  it('translates `stream` onto the engine\u2019s streaming mechanism', () => {
    // The prop names the INTENT; this mapping is the only place the engine's vocabulary appears.
    expect(buildOptions({ src: 'clip.mp3', stream: true }).html5).toBe(true);
    expect(buildOptions({ src: 'clip.mp3' }).html5).toBe(false);
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
    render(<Audio src="clip.mp3" stream volume={0.5} />);
    const howl = await waitForPlayer();
    expect(howl.options).toMatchObject({ src: ['clip.mp3'], html5: true, volume: 0.5 });
  });

  it('constructs the player with the FULL built options', async () => {
    // Asserted on the constructed instance, not just on `buildOptions` as a pure function: the
    // component could compute the right object and then hand howler something else.
    render(<Audio src="clip.mp3" format={['mp3']} loop preload={false} autoplay />);
    const howl = await waitForPlayer();

    expect(howl.options).toMatchObject({
      src: ['clip.mp3'],
      format: ['mp3'],
      loop: true,
      preload: false,
      autoplay: true,
      volume: 1,
      html5: false,
    });
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

  it('resets the clock when the source changes, rather than carrying the old position over', async () => {
    const { rerender } = render(<Audio src="clip.mp3" />);
    const first = await loadMedia(180);
    first.position = 65;
    await act(async () => {
      first.emit('pause');
    });
    expect(screen.getByText('1:05')).toBeInTheDocument();

    rerender(<Audio src="other.mp3" />);
    await waitFor(() => expect(instances()).toHaveLength(2));

    // A new source starts at the beginning with an unknown length.
    expect(screen.getByText('0:00')).toBeInTheDocument();
    expect(screen.getByText('--:--')).toBeInTheDocument();
  });

  it('does NOT rebuild the player when an unrelated prop changes', async () => {
    const { rerender } = render(<Audio src="clip.mp3" skipForwardSeconds={10} />);
    await waitForPlayer();
    rerender(<Audio src="clip.mp3" skipForwardSeconds={30} className="mt-4" />);
    // A settle window: if a rebuild were coming, it would land here.
    await act(async () => {});
    expect(instances()).toHaveLength(1);
  });

  it('rebuilds when a construction-only option changes, since howler fixes it at construction', async () => {
    // `stream` picks the playback path and can only be chosen when the player is built, so one
    // that kept the old instance would silently ignore the new value.
    const { rerender } = render(<Audio src="clip.mp3" stream={false} />);
    await waitForPlayer();

    rerender(<Audio src="clip.mp3" stream />);

    await waitFor(() => expect(instances()).toHaveLength(2));
    expect(lastHowl()!.options).toMatchObject({ html5: true });
  });

  it('rebuilds when the format hint changes', async () => {
    const { rerender } = render(<Audio src="clip" format={['mp3']} />);
    await waitForPlayer();

    rerender(<Audio src="clip" format={['ogg']} />);

    await waitFor(() => expect(instances()).toHaveLength(2));
    expect(lastHowl()!.options).toMatchObject({ format: ['ogg'] });
  });

  it('does not rebuild for an inline array prop whose contents did not change', async () => {
    // `src` and `format` are arrays, so an inline literal is a NEW array on every render. Keying
    // the effect on identity rather than value would rebuild - and restart - the player forever.
    const { rerender } = render(<Audio src={['clip.webm', 'clip.mp3']} format={['webm', 'mp3']} />);
    await waitForPlayer();

    rerender(<Audio src={['clip.webm', 'clip.mp3']} format={['webm', 'mp3']} />);
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

  it('swaps the glyph, not just the label, between play and pause', async () => {
    // The label is a11y; the glyph is what a sighted reader actually goes by. A button stuck on a
    // play triangle while playing passes every name-based assertion in this file.
    const user = userEvent.setup();
    await renderLoaded();
    const playGlyph = screen.getByRole('button', { name: 'Play' }).querySelector('svg path');
    const playPath = playGlyph?.getAttribute('d');

    await user.click(screen.getByRole('button', { name: 'Play' }));

    const pauseButton = screen.getByRole('button', { name: 'Pause' });
    expect(pauseButton.querySelector('rect')).toBeInTheDocument();
    expect(pauseButton.querySelector('svg path')?.getAttribute('d')).not.toBe(playPath);
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

  it('disables every control until the duration is known', async () => {
    render(<Audio src="clip.mp3" />);
    await waitForPlayer();

    expect(screen.getByRole('button', { name: 'Skip forward 10 seconds' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Skip back 10 seconds' })).toBeDisabled();
    // Play too, while preloading: a press here would be dropped, so it must not look available.
    expect(screen.getByRole('button', { name: 'Loading audio' })).toBeDisabled();

    await loadMedia(180);
    expect(screen.getByRole('button', { name: 'Skip forward 10 seconds' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Play' })).toBeEnabled();
  });

  it('does not start a second playback when play is pressed twice before howler emits', async () => {
    const user = userEvent.setup();
    const { howl } = await renderLoaded();

    // howler emits `play` asynchronously, so between these two clicks the button may still read
    // "Play" while the player is already playing. Branching on React state here would call play()
    // twice, and howler would allocate a SECOND sound - two copies of the clip at once.
    const play = screen.getByRole('button', { name: 'Play' });
    await user.click(play);
    await user.click(screen.getByRole('button', { name: /Play|Pause/ }));

    expect(howl.play).toHaveBeenCalledTimes(1);
    expect(howl.pause).toHaveBeenCalledTimes(1);
  });
});

/* ------------------------------------------------------------- the owned interface (0071) */

describe('the public interface is Canopy’s, not the engine’s', () => {
  it('does not name the playback engine anywhere in the published types', () => {
    // THE swappability guard. `onReady` used to hand out howler's `Howl`, and `options` took its
    // raw config - which put the engine in the published API, so replacing it would have been a
    // breaking change for every consumer rather than an implementation detail for us.
    //
    // Asserted against the BUILT artifact, because that is what a consumer actually installs, and
    // because a type can leak through inference without ever being written down in the source.
    // `test` depends on `build` in turbo.json, so this file is present and current.
    const declarations = readFileSync(resolve(__dirname, '../../dist/branches/index.d.ts'), 'utf8');
    // Strip comments before matching: the doc comments legitimately NAME howler when explaining
    // why it is not exposed, and prose is not a contract. What must not appear is a type
    // REFERENCE - an import from the package, or its types used in a declaration.
    const types = declarations.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

    expect(declarations).toContain('AudioHandle');
    expect(types).not.toMatch(/howler/i);
    expect(types).not.toMatch(/\bHowl\b/);
    expect(types).not.toMatch(/\bHowlOptions\b/);
  });

  it('hands `onReady` a handle whose methods drive playback', async () => {
    const onReady = vi.fn();
    render(<Audio src="clip.mp3" onReady={onReady} />);
    const howl = await loadMedia(180);

    const handle = onReady.mock.calls[0]![0] as AudioHandle;
    // Not the engine instance - a surface we define and could implement on anything.
    expect(handle).not.toBe(howl);

    handle.play();
    expect(howl.play).toHaveBeenCalled();

    handle.pause();
    expect(howl.pause).toHaveBeenCalled();

    handle.setVolume(0.4);
    expect(howl.volume).toHaveBeenCalledWith(0.4);
  });

  it('reports position, duration, and playing state through the handle', async () => {
    const onReady = vi.fn();
    render(<Audio src="clip.mp3" onReady={onReady} />);
    const howl = await loadMedia(180);
    const handle = onReady.mock.calls[0]![0] as AudioHandle;

    howl.position = 42;
    expect(handle.getPosition()).toBe(42);
    expect(handle.getDuration()).toBe(180);
    expect(handle.isPlaying()).toBe(false);

    // Driven through the handle, so the reported state reflects the real player rather than a
    // hand-planted event.
    await act(async () => {
      handle.play();
    });
    expect(handle.isPlaying()).toBe(true);
  });

  it('clamps a handle seek the same way the buttons do', async () => {
    const onReady = vi.fn();
    render(<Audio src="clip.mp3" onReady={onReady} />);
    const howl = await loadMedia(180);
    const handle = onReady.mock.calls[0]![0] as AudioHandle;

    handle.seek(9999);

    // The handle goes through the component's own clamping, not straight at the engine.
    expect(howl.seek).toHaveBeenCalledWith(180);
  });

  it('keeps working after the player underneath it is rebuilt', async () => {
    // A consumer holds the handle; a source change replaces the engine instance. The handle reads
    // the CURRENT player through a ref, so it must not go stale.
    const onReady = vi.fn();
    const { rerender } = render(<Audio src="clip.mp3" onReady={onReady} />);
    await loadMedia(180);
    const handle = onReady.mock.calls[0]![0] as AudioHandle;

    rerender(<Audio src="other.mp3" onReady={onReady} />);
    await waitFor(() => expect(instances()).toHaveLength(2));
    handle.play();

    expect(lastHowl()!.play).toHaveBeenCalled();
  });

  it('reports a media failure as an Error with an engine-independent reason', async () => {
    const onLoadError = vi.fn();
    render(<Audio src="clip.mp3" onLoadError={onLoadError} />);
    const howl = await waitForPlayer();

    await act(async () => {
      howl.emit('loaderror');
    });

    const error = onLoadError.mock.calls[0]![0] as AudioLoadError;
    expect(error).toBeInstanceOf(Error);
    expect(error.reason).toBe('media');
    expect(error.message).toBeTruthy();
  });
});

/* --------------------------------------------------------------------------- startAtSeconds */

describe('startAtSeconds', () => {
  it('begins at the requested position once the media loads', async () => {
    render(<Audio src="clip.mp3" startAtSeconds={65} />);
    const howl = await loadMedia(180);

    expect(howl.seek).toHaveBeenCalledWith(65);
    expect(screen.getByText('1:05')).toBeInTheDocument();
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuetext', '1:05');
  });

  it('does not seek before the duration is known', async () => {
    // Seeking a player that has not loaded is a no-op in howler, so a start position applied at
    // construction would be silently lost.
    render(<Audio src="clip.mp3" startAtSeconds={65} />);
    const howl = await waitForPlayer();

    expect(howl.seek).not.toHaveBeenCalledWith(65);
  });

  it('clamps a start position past the end of the media', async () => {
    render(<Audio src="clip.mp3" startAtSeconds={500} />);
    const howl = await loadMedia(180);

    expect(howl.seek).toHaveBeenCalledWith(180);
  });

  it('ignores a zero or negative start position', async () => {
    render(<Audio src="clip.mp3" startAtSeconds={-30} />);
    const howl = await loadMedia(180);

    expect(howl.seek).not.toHaveBeenCalled();
    expect(screen.getAllByText('0:00')[0]).toBeInTheDocument();
  });

  it('is a STARTING position, not a controlled one - a later change does not yank the listener', async () => {
    const { rerender } = render(<Audio src="clip.mp3" startAtSeconds={30} />);
    const howl = await loadMedia(180);
    howl.seek.mockClear();

    rerender(<Audio src="clip.mp3" startAtSeconds={90} />);
    await act(async () => {});

    expect(howl.seek).not.toHaveBeenCalled();
    expect(instances()).toHaveLength(1);
  });

  it('applies again when the source changes, because a new source is a new start', async () => {
    const { rerender } = render(<Audio src="clip.mp3" startAtSeconds={30} />);
    await loadMedia(180);

    rerender(<Audio src="other.mp3" startAtSeconds={30} />);
    await waitFor(() => expect(instances()).toHaveLength(2));
    const next = await loadMedia(180);

    expect(next.seek).toHaveBeenCalledWith(30);
  });
});

/* ------------------------------------------------------------------------ load / error state */

describe('load state', () => {
  it('shows a busy player while the media is fetching', async () => {
    const { container } = render(<Audio src="clip.mp3" />);
    await waitForPlayer();

    // The visual spinner says nothing to a screen reader; `aria-busy` is what carries it.
    expect(container.firstElementChild).toHaveAttribute('aria-busy', 'true');
    // The play button's NAME says what is happening rather than offering an action it cannot do.
    expect(screen.getByRole('button', { name: 'Loading audio' })).toBeDisabled();
  });

  it('clears the busy state once loaded', async () => {
    const { container } = render(<Audio src="clip.mp3" />);
    await loadMedia(180);

    expect(container.firstElementChild).toHaveAttribute('aria-busy', 'false');
    expect(screen.getByRole('button', { name: 'Play' })).toBeEnabled();
  });

  it('takes the loading label from a prop, so it can be reworded or translated', async () => {
    render(<Audio src="clip.mp3" loadingLabel="Fetching episode" />);
    await waitForPlayer();

    expect(screen.getByRole('button', { name: 'Fetching episode' })).toBeInTheDocument();
  });

  it('is idle rather than busy when nothing has been asked for yet (preload=false)', async () => {
    const { container } = render(<Audio src="clip.mp3" preload={false} />);
    await waitForPlayer();

    // Nothing is fetching, so no spinner and no busy flag - but play is live, because pressing it
    // is what starts the load.
    await waitFor(() => expect(screen.getByRole('button', { name: 'Play' })).toBeEnabled());
    expect(container.firstElementChild).toHaveAttribute('aria-busy', 'false');
  });

  it('goes busy when play starts the load on a no-preload player', async () => {
    const user = userEvent.setup();
    const { container } = render(<Audio src="clip.mp3" preload={false} />);
    const howl = await waitForPlayer();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Play' })).toBeEnabled());

    await user.click(screen.getByRole('button', { name: 'Play' }));

    expect(howl.play).toHaveBeenCalled();
    expect(container.firstElementChild).toHaveAttribute('aria-busy', 'true');
  });

  it('is busy while the howler chunk itself is still in flight', () => {
    // Before the dynamic import resolves there is no instance, so a press would be dropped.
    const { container } = render(<Audio src="clip.mp3" preload={false} />);

    expect(container.firstElementChild).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button', { name: 'Loading audio' })).toBeDisabled();
  });
});

describe('error state', () => {
  /** Render, then fail the load the way a CORS-blocked or missing file does. */
  async function renderFailed(props: Partial<React.ComponentProps<typeof Audio>> = {}) {
    const utils = render(<Audio src="clip.mp3" {...props} />);
    const howl = await waitForPlayer();
    await act(async () => {
      howl.emit('loaderror');
    });
    return { ...utils, howl };
  }

  it('says the media failed instead of leaving controls that look merely slow', async () => {
    const { container } = await renderFailed();

    expect(screen.getByRole('status')).toHaveTextContent('Could not load audio');
    // Crucially NOT busy: a failure that still reads as "loading" is the bug this state exists for.
    expect(container.firstElementChild).toHaveAttribute('aria-busy', 'false');
  });

  it('takes the error message from a prop', async () => {
    await renderFailed({ errorLabel: 'This episode is unavailable' });

    expect(screen.getByRole('status')).toHaveTextContent('This episode is unavailable');
  });

  it('leaves every control inert', async () => {
    await renderFailed();

    expect(screen.getByRole('button', { name: 'Play' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Skip back 10 seconds' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Skip forward 10 seconds' })).toBeDisabled();
    expect(screen.getByRole('slider')).toHaveAttribute('data-disabled');
  });

  it('does not try to play after a failure', async () => {
    const user = userEvent.setup();
    const { howl } = await renderFailed();

    await user.click(screen.getByRole('button', { name: 'Play' }));

    expect(howl.play).not.toHaveBeenCalled();
  });

  it('reports the failure to onLoadError', async () => {
    const onLoadError = vi.fn();
    render(<Audio src="clip.mp3" onLoadError={onLoadError} />);
    const howl = await waitForPlayer();

    await act(async () => {
      howl.emit('loaderror');
    });

    expect(onLoadError).toHaveBeenCalled();
  });

  it('replaces the clock, rather than showing zeroed times beside an error', async () => {
    await renderFailed();

    expect(screen.queryByText('0:00')).not.toBeInTheDocument();
  });

  it('recovers when the source changes to one that loads', async () => {
    const { rerender } = render(<Audio src="broken.mp3" />);
    const broken = await waitForPlayer();
    await act(async () => {
      broken.emit('loaderror');
    });
    expect(screen.getByRole('status')).toBeInTheDocument();

    rerender(<Audio src="good.mp3" />);
    await waitFor(() => expect(instances()).toHaveLength(2));
    await loadMedia(90);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play' })).toBeEnabled();
  });

  it('does not treat a playback refusal as a failed load', async () => {
    // `playerror` is an autoplay policy or a decode hiccup - the media may be fine, so the player
    // must not display the fatal error - but the button must stop claiming it is playing.
    const { howl } = await renderLoaded();
    await act(async () => {
      howl.emit('play');
    });
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();

    await act(async () => {
      howl.emit('playerror');
    });

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
  });
});

/* -------------------------------------------------------------------------- the skip glyphs */

describe('the skip glyphs', () => {
  /** The numbered glyph is the only one that draws text, so its digits identify it. */
  const glyphText = (name: RegExp | string) =>
    screen.getByRole('button', { name }).querySelector('svg text')?.textContent ?? null;

  it('draws the plain transport glyph at the default interval', async () => {
    // Nothing to say at 10/10 that the double triangle does not already imply, so no number.
    await renderLoaded();

    expect(glyphText(/Skip back/)).toBeNull();
    expect(glyphText(/Skip forward/)).toBeNull();
  });

  it('shows the interval as soon as either side stops being the default', async () => {
    // The regression this exists for: back-15 / forward-30 used to be pixel-identical to 10/10,
    // with the interval reaching only assistive tech.
    await renderLoaded({ skipBackSeconds: 15, skipForwardSeconds: 30 });

    expect(glyphText(/Skip back/)).toBe('15');
    expect(glyphText(/Skip forward/)).toBe('30');
  });

  it('shows the interval when only ONE side is customised', async () => {
    // A player at 10 back / 30 forward is asymmetric, so the reader needs both numbers, including
    // the one that happens to be the default.
    await renderLoaded({ skipForwardSeconds: 30 });

    expect(glyphText(/Skip back/)).toBe('10');
    expect(glyphText(/Skip forward/)).toBe('30');
  });

  it('shows the interval for symmetric non-default intervals too', async () => {
    // 30/30 is symmetric but not standard: the glyph is still the only place to learn it.
    await renderLoaded({ skipBackSeconds: 30, skipForwardSeconds: 30 });

    expect(glyphText(/Skip back/)).toBe('30');
  });

  it('always shows the interval when asked, even at the default', async () => {
    await renderLoaded({ skipGlyph: 'numbered' });

    expect(glyphText(/Skip back/)).toBe('10');
  });

  it('never shows it when asked not to, even when customised', async () => {
    await renderLoaded({ skipGlyph: 'plain', skipBackSeconds: 45, skipForwardSeconds: 45 });

    expect(glyphText(/Skip back/)).toBeNull();
    // The interval still reaches assistive tech, which is the half that must not depend on styling.
    expect(screen.getByRole('button', { name: 'Skip back 45 seconds' })).toBeInTheDocument();
  });

  it('keeps a three-digit interval inside the glyph', async () => {
    // A long interval must shrink rather than overflow the circle it sits in.
    await renderLoaded({ skipForwardSeconds: 120 });
    const text = screen.getByRole('button', { name: /Skip forward/ }).querySelector('svg text');

    expect(text?.textContent).toBe('120');
    expect(Number(text?.getAttribute('font-size'))).toBeLessThan(10);
  });

  it('leaves the accessible name identical in every mode', async () => {
    // The glyph is a sighted-reader affordance; it must not be load-bearing for anyone else.
    for (const mode of ['auto', 'numbered', 'plain'] as const) {
      const { unmount } = render(<Audio src="clip.mp3" skipGlyph={mode} skipBackSeconds={15} />);
      await loadMedia(180);
      expect(screen.getByRole('button', { name: 'Skip back 15 seconds' })).toBeInTheDocument();
      unmount();
    }
  });
});

/* ---------------------------------------------------------------------------- the scrub bar */

describe('the scrub bar', () => {
  it('is disabled, with a zero duration, until the media loads', async () => {
    render(<Audio src="clip.mp3" />);
    await waitForPlayer();

    expect(screen.getByRole('slider')).toHaveAttribute('data-disabled');
    expect(screen.getByText('0:00')).toBeInTheDocument();
    // The total is genuinely unknown, and says so - `0:00` there would read as a zero-length clip.
    expect(screen.getByText('--:--')).toBeInTheDocument();
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

  it('does not seek mid-drag - only when the drag is released', async () => {
    // The keyboard path cannot prove this: Radix commits on the same keydown that changes the
    // value, so change and commit are indistinguishable there. Only a pointer drag separates them,
    // which is why this test bothers with the jsdom geometry stubs.
    const { howl, container } = await renderLoaded({}, 100);
    const track = container.querySelector('[data-orientation="horizontal"]') as HTMLElement;
    stubSliderGeometry(track);

    firePointer(track, 'pointerdown', 20);
    firePointer(track, 'pointermove', 60);

    // The thumb and the clock follow the finger...
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuetext', '1:00');
    // ...but the player has NOT been moved yet. Seeking on every pointermove would stutter audio
    // across a drag.
    expect(howl.seek).not.toHaveBeenCalledWith(expect.any(Number));

    firePointer(track, 'pointerup', 60);

    expect(howl.seek).toHaveBeenCalledWith(60);
  });

  it('hands the drag back to the position loop once released', async () => {
    const { howl, container } = await renderLoaded({}, 100);
    const track = container.querySelector('[data-orientation="horizontal"]') as HTMLElement;
    stubSliderGeometry(track);
    await act(async () => {
      howl.emit('play');
    });

    firePointer(track, 'pointerdown', 80);
    firePointer(track, 'pointerup', 80);

    // With the scrub released, the loop's reading wins again rather than the stale drag value.
    howl.position = 12;
    await act(async () => {
      stepFrame();
    });
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuetext', '0:12');
  });

  it('seeks when a keyboard scrub commits', async () => {
    const user = userEvent.setup();
    const { howl } = await renderLoaded({}, 180);

    await user.tab();
    await user.keyboard('{ArrowRight}');

    await waitFor(() => expect(howl.seek).toHaveBeenCalledWith(1));
  });

  it('survives a non-numeric seek() reading mid-load', async () => {
    // howler's getter returns the Howl itself while loading. Un-narrowed, that reaches the position
    // state and renders `NaN` in the clock and on `aria-valuenow`.
    const { howl } = await renderLoaded({}, 180);
    howl.seekReturnsSelf = true;
    await act(async () => {
      howl.emit('play');
    });
    await act(async () => {
      stepFrame();
    });

    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuetext', '0:00');
    expect(screen.getByRole('slider').getAttribute('aria-valuenow')).not.toBe('NaN');
  });

  it('renders the clock with tabular figures so the digits do not jitter', async () => {
    const { container } = await renderLoaded({}, 180);
    // The clock updates every frame; proportional figures make it shuffle sideways as it ticks.
    expect(container.querySelector('.tabular-nums')).toBeInTheDocument();
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

    await act(async () => {
      howl.emit('end');
    });

    // Asserted POSITIVELY - that the loop is still armed. "cancel was not called" would also pass
    // if the loop had never started at all.
    expect(loopIsRunning()).toBe(true);
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
  });

  it('reads the player position on each frame and re-arms', async () => {
    const { howl } = await renderLoaded({}, 180);
    await act(async () => {
      howl.emit('play');
    });

    howl.position = 42;
    await act(async () => {
      stepFrame();
    });

    // The tick body actually ran: the position came off the player, not from a test fixture.
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuetext', '0:42');
    expect(screen.getByText('0:42')).toBeInTheDocument();
    // ...and armed the next frame, so the clock keeps ticking.
    expect(loopIsRunning()).toBe(true);
  });

  it('stops reading the player once paused', async () => {
    const { howl } = await renderLoaded({}, 180);
    await act(async () => {
      howl.emit('play');
    });
    await act(async () => {
      howl.emit('pause');
    });

    howl.position = 99;
    await act(async () => {
      stepFrame();
    });

    // No frame was pending, so nothing read 99 - the clock is where the pause left it.
    expect(loopIsRunning()).toBe(false);
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuetext', '0:00');
  });

  it('survives a frame that fires after the player is gone', async () => {
    const { howl, unmount } = await renderLoaded();
    await act(async () => {
      howl.emit('play');
    });
    const pending = [...frame.scheduled.values()].at(-1);

    unmount();

    // A frame already queued when the component unmounted must not throw on a nulled player.
    expect(() => pending?.(0)).not.toThrow();
  });
});

/* ----------------------------------------------------------------------------------- events */

describe('events', () => {
  it('hands the playback handle to `onReady` once loaded', async () => {
    const onReady = vi.fn();
    render(<Audio src="clip.mp3" onReady={onReady} />);
    await loadMedia(180);

    expect(onReady).toHaveBeenCalledTimes(1);
    expect(onReady.mock.calls[0]![0]).toEqual(
      expect.objectContaining({ play: expect.any(Function), seek: expect.any(Function) }),
    );
  });

  it('does not fire `onReady` before the media has loaded', async () => {
    // "Ready" means the media is usable, not merely that the instance was constructed - a consumer
    // calling `seek()` in this callback needs a duration to exist.
    const onReady = vi.fn();
    render(<Audio src="clip.mp3" onReady={onReady} />);
    await waitForPlayer();

    expect(onReady).not.toHaveBeenCalled();

    await loadMedia(180);
    expect(onReady).toHaveBeenCalledTimes(1);
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
