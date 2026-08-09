import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AudioRecorder, canCaptureMicrophone, formatElapsed, pickMimeType } from './AudioRecorder';
import type { AudioRecorderHandle, AudioRecording, AudioRecordingError } from './AudioRecorder';

/**
 * jsdom implements none of the three platform APIs this component drives - `MediaRecorder`,
 * `navigator.mediaDevices.getUserMedia`, and `AudioContext`. Per the "do not assert a third-party
 * library's browser internals in jsdom" learning, nothing below asserts what a browser would do
 * with them. What is asserted is the mapping Canopy owns: the states rendered, the handle's
 * behaviour, the `AudioRecordingError.reason` produced, the tracks stopped, and the loop cancelled.
 *
 * The stand-ins are STEPPABLE, not merely countable (learning 49): each one can be advanced
 * through a data event, a stop, an error, and a permission rejection on demand, and the analyser
 * plays back a controllable input level. A double that only recorded calls would let the whole
 * body of the waveform loop be deleted with every test still green.
 */

const DEFAULT_TYPES = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'];

class FakeMediaStreamTrack {
  kind = 'audio';
  readyState: 'live' | 'ended' = 'live';
  stop = vi.fn(() => {
    this.readyState = 'ended';
  });
}

/** Two tracks, so "every track is stopped" is a real assertion rather than a singleton's. */
class FakeMediaStream {
  tracks = [new FakeMediaStreamTrack(), new FakeMediaStreamTrack()];
  getTracks() {
    return this.tracks;
  }
  getAudioTracks() {
    return this.tracks;
  }
}

class FakeMediaRecorder {
  static supported: string[] = [...DEFAULT_TYPES];
  static instances: FakeMediaRecorder[] = [];
  static isTypeSupported = vi.fn((type: string) => FakeMediaRecorder.supported.includes(type));

  state: 'inactive' | 'recording' | 'paused' = 'inactive';
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  mimeType: string;
  stream: FakeMediaStream;

  start = vi.fn(() => {
    this.state = 'recording';
  });

  // Deliberately does NOT emit: a real recorder finalises asynchronously, and a test that wants
  // the finished take steps `emitData()` / `emitStop()` itself.
  stop = vi.fn(() => {
    this.state = 'inactive';
  });

  constructor(stream: FakeMediaStream, options: { mimeType: string }) {
    this.stream = stream;
    this.mimeType = options.mimeType;
    FakeMediaRecorder.instances.push(this);
  }

  emitData(bytes = 2048) {
    this.ondataavailable?.({ data: new Blob(['a'.repeat(bytes)], { type: this.mimeType }) });
  }

  emitStop() {
    this.onstop?.();
  }

  emitError(name = 'UnknownError') {
    const error = new Error('the microphone went away');
    error.name = name;
    this.onerror?.({ error });
  }
}

class FakeAnalyserNode {
  fftSize = 2048;
  /** What the fake microphone is hearing, 0 (silence) to 1 (clipping). */
  level = 0;
  connect = vi.fn();
  disconnect = vi.fn();
  getByteTimeDomainData = vi.fn((array: Uint8Array) => {
    const swing = Math.round(this.level * 127);
    for (let index = 0; index < array.length; index += 1) {
      array[index] = index % 2 === 0 ? 128 + swing : 128 - swing;
    }
  });
}

class FakeAudioContext {
  static instances: FakeAudioContext[] = [];
  state: 'running' | 'suspended' | 'closed' = 'running';
  analyser = new FakeAnalyserNode();
  createAnalyser = vi.fn(() => this.analyser);
  createMediaStreamSource = vi.fn(() => ({ connect: vi.fn(), disconnect: vi.fn() }));
  resume = vi.fn(async () => {
    this.state = 'running';
  });
  close = vi.fn(async () => {
    this.state = 'closed';
  });
  constructor() {
    FakeAudioContext.instances.push(this);
  }
}

let currentStream: FakeMediaStream;
let getUserMedia: ReturnType<typeof vi.fn>;
let realMatchMedia: typeof window.matchMedia;

const lastRecorder = () => FakeMediaRecorder.instances.at(-1)!;
const lastContext = () => FakeAudioContext.instances.at(-1)!;
const analyser = () => lastContext().analyser;

/**
 * The waveform loop is driven by requestAnimationFrame. The stub RECORDS each scheduled callback
 * rather than discarding it, so a test can step the loop one frame at a time and the tick body is
 * actually exercised (learning 49).
 */
const frame = {
  request: vi.fn(),
  cancel: vi.fn(),
  scheduled: new Map<number, FrameRequestCallback>(),
};

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

/** Advance fake time, letting the clock interval and the duration cap fire inside `act`. */
function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

function stubReducedMotion(matches: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: matches && query === '(prefers-reduced-motion: reduce)',
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
  // `performance` is faked alongside the timers: the component measures duration from
  // `performance.now()` (a monotonic clock), so without it every recording would be a few real
  // milliseconds long and the duration assertions would prove nothing.
  vi.useFakeTimers({
    toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date', 'performance'],
  });

  FakeMediaRecorder.instances = [];
  FakeMediaRecorder.supported = [...DEFAULT_TYPES];
  FakeMediaRecorder.isTypeSupported.mockClear();
  FakeAudioContext.instances = [];

  currentStream = new FakeMediaStream();
  getUserMedia = vi.fn(async () => currentStream);
  Object.defineProperty(navigator, 'mediaDevices', {
    value: { getUserMedia },
    configurable: true,
    writable: true,
  });

  vi.stubGlobal('MediaRecorder', FakeMediaRecorder);
  vi.stubGlobal('AudioContext', FakeAudioContext);

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

  realMatchMedia = window.matchMedia;
  stubReducedMotion(false);
});

afterEach(() => {
  cleanup();
  window.matchMedia = realMatchMedia;
  vi.unstubAllGlobals();
  vi.useRealTimers();
  Reflect.deleteProperty(navigator, 'mediaDevices');
});

/* ------------------------------------------------------------------------------- test helpers */

const recordButton = () => screen.getByRole('button', { name: 'Record' });
const stopButton = () => screen.getByRole('button', { name: 'Stop recording' });
const liveRegion = () => screen.getByRole('status');

/**
 * Drop back to real timers for a `user-event` flow. user-event awaits its own internal delays, and
 * driving those through the fake clock is a source of hangs that has nothing to do with the
 * component. These tests assert keyboard and focus outcomes, not durations.
 */
function useRealTime() {
  vi.useRealTimers();
  return userEvent.setup();
}

/** Press record and let the (async) permission request settle. */
async function pressRecord() {
  await act(async () => {
    fireEvent.click(recordButton());
  });
  return FakeMediaRecorder.instances.at(-1);
}

/** Press stop and step the engine through its final chunk and its stop event. */
async function pressStop() {
  const recorder = lastRecorder();
  await act(async () => {
    fireEvent.click(stopButton());
  });
  await act(async () => {
    recorder.emitData();
    recorder.emitStop();
  });
  return recorder;
}

/**
 * The waveform wrapper: the `flex-1` decoration in the control row. The row holds other
 * `aria-hidden` children - the reserved cancel slot and the recording dot - and neither of those
 * grows, so `flex-1` is what identifies the waveform.
 */
function waveform(container: HTMLElement): HTMLElement | null {
  const row = container.firstElementChild?.firstElementChild;
  return row?.querySelector(':scope > [aria-hidden="true"].flex-1') ?? null;
}

/** The recording dot: `bg-danger` while a take is live, and a transparent reserved slot at rest. */
function recordingDot(container: HTMLElement): HTMLElement {
  const row = container.firstElementChild!.firstElementChild!;
  return row.querySelector(':scope > [aria-hidden="true"].rounded-full.w-2\\.5')!;
}

function barHeights(container: HTMLElement): number[] {
  const bars = waveform(container)?.children ?? [];
  return [...bars].map((bar) => Number.parseInt((bar as HTMLElement).style.height, 10));
}

/* ------------------------------------------------------------------------ the pure mappings */

describe('formatElapsed', () => {
  it('renders sub-hour durations as m:ss', () => {
    expect(formatElapsed(0)).toBe('0:00');
    expect(formatElapsed(4200)).toBe('0:04');
    expect(formatElapsed(65_000)).toBe('1:05');
    expect(formatElapsed(3_599_000)).toBe('59:59');
  });

  it('widens to h:mm:ss only at the hour boundary', () => {
    expect(formatElapsed(3_600_000)).toBe('1:00:00');
    expect(formatElapsed(3_725_000)).toBe('1:02:05');
  });

  it('reads as 0:00 for a duration that is not a usable number', () => {
    expect(formatElapsed(NaN)).toBe('0:00');
    expect(formatElapsed(Infinity)).toBe('0:00');
    expect(formatElapsed(-5)).toBe('0:00');
  });
});

describe('pickMimeType', () => {
  it('takes the first supported container, in preference order', () => {
    // Safari's case: no WebM at all, so the mp4 entry is what makes it record.
    FakeMediaRecorder.supported = ['audio/mp4'];
    expect(pickMimeType(DEFAULT_TYPES)).toBe('audio/mp4');
  });

  it('prefers an earlier candidate when several are supported', () => {
    FakeMediaRecorder.supported = ['audio/webm', 'audio/webm;codecs=opus'];
    expect(pickMimeType(DEFAULT_TYPES)).toBe('audio/webm;codecs=opus');
  });

  it('returns null when the browser supports none of them', () => {
    FakeMediaRecorder.supported = [];
    expect(pickMimeType(DEFAULT_TYPES)).toBeNull();
  });

  it('returns null when the browser has no recorder at all', () => {
    vi.stubGlobal('MediaRecorder', undefined);
    expect(pickMimeType(DEFAULT_TYPES)).toBeNull();
    expect(canCaptureMicrophone()).toBe(true);
  });
});

/* ----------------------------------------------------------------------------- the basics */

describe('rendering', () => {
  it('renders with no props', () => {
    render(<AudioRecorder />);

    expect(recordButton()).toBeEnabled();
    expect(screen.getByText('0:00')).toBeInTheDocument();
  });

  it('does NOT request the microphone on mount', () => {
    // A prompt fired at someone who has not asked to record anything is alarming, denied by
    // reflex, and a denied microphone cannot be re-prompted from inside the page.
    render(<AudioRecorder />);

    expect(getUserMedia).not.toHaveBeenCalled();
    expect(FakeMediaRecorder.instances).toHaveLength(0);
  });

  it('requests the microphone at the moment record is pressed', async () => {
    render(<AudioRecorder />);

    await pressRecord();

    expect(getUserMedia).toHaveBeenCalledTimes(1);
    expect(getUserMedia).toHaveBeenCalledWith({ audio: true });
  });

  it('merges a caller className onto the wrapper', () => {
    const { container } = render(<AudioRecorder className="mt-8" />);
    expect(container.firstElementChild).toHaveClass('mt-8');
  });

  it('forwards ref to the wrapper', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<AudioRecorder ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('spreads native div props', () => {
    render(<AudioRecorder data-testid="recorder" aria-label="Voice note" />);
    expect(screen.getByTestId('recorder')).toHaveAttribute('aria-label', 'Voice note');
  });
});

/* ------------------------------------------------------------------------- the happy path */

describe('recording a take', () => {
  it('hands back a non-empty blob, its mime type, and the measured duration', async () => {
    const onComplete = vi.fn();
    render(<AudioRecorder onComplete={onComplete} />);

    await pressRecord();
    advance(2500);
    await pressStop();

    const recording = onComplete.mock.calls[0]![0] as AudioRecording;
    expect(recording.blob.size).toBeGreaterThan(0);
    expect(recording.mimeType).toBe('audio/webm;codecs=opus');
    // The BLOB is the object a consumer uploads, and a blob built without its type reports `''` -
    // no Content-Type to send and no way to recover one. Asserting `mimeType` alone misses that.
    expect(recording.blob.type).toBe('audio/webm;codecs=opus');
    // Measured by the component from a monotonic clock, NOT read back from the blob: WebM out of
    // MediaRecorder routinely carries no duration and yields Infinity.
    expect(recording.durationMs).toBeGreaterThanOrEqual(2400);
    expect(recording.durationMs).toBeLessThanOrEqual(2600);
  });

  it('keeps every chunk the engine emitted', async () => {
    const onComplete = vi.fn();
    render(<AudioRecorder onComplete={onComplete} />);

    const recorder = await pressRecord();
    await act(async () => {
      recorder!.emitData(1000);
      recorder!.emitData(1000);
    });
    await pressStop();

    // Three chunks: the two above plus the one `pressStop` flushes.
    const recording = onComplete.mock.calls[0]![0] as AudioRecording;
    expect(recording.blob.size).toBe(4048);
  });

  it('reports a mime type the browser supports, chosen from `mimeTypes` in order', async () => {
    FakeMediaRecorder.supported = ['audio/mp4'];
    const onComplete = vi.fn();
    render(<AudioRecorder onComplete={onComplete} />);

    await pressRecord();
    await pressStop();

    expect(lastRecorder().mimeType).toBe('audio/mp4');
    expect((onComplete.mock.calls[0]![0] as AudioRecording).mimeType).toBe('audio/mp4');
  });

  it('honours a caller-supplied preference order', async () => {
    FakeMediaRecorder.supported = ['audio/mp4', 'audio/webm'];
    render(<AudioRecorder mimeTypes={['audio/webm', 'audio/mp4']} />);

    await pressRecord();

    expect(lastRecorder().mimeType).toBe('audio/webm');
  });

  it('fires onStart, then onStop immediately before onComplete', async () => {
    const order: string[] = [];
    render(
      <AudioRecorder
        onStart={() => order.push('start')}
        onStop={() => order.push('stop')}
        onComplete={() => order.push('complete')}
      />,
    );

    await pressRecord();
    await pressStop();

    expect(order).toEqual(['start', 'stop', 'complete']);
  });

  it('shows the elapsed time while recording and holds the final length after stopping', async () => {
    const { container } = render(<AudioRecorder />);

    await pressRecord();
    advance(65_000);
    expect(screen.getByText('1:05')).toBeInTheDocument();

    await pressStop();
    expect(screen.getByText('1:05')).toBeInTheDocument();
    expect(container.querySelector('.tabular-nums')).toBeInTheDocument();
  });

  it('returns to idle, ready for another take', async () => {
    render(<AudioRecorder />);

    await pressRecord();
    await pressStop();

    expect(recordButton()).toBeEnabled();
    await pressRecord();
    expect(stopButton()).toBeInTheDocument();
  });
});

/* --------------------------------------------------------------------------------- cancel */

describe('cancel', () => {
  it('discards the take: onCancel fires and onComplete does not', async () => {
    const onCancel = vi.fn();
    const onComplete = vi.fn();
    render(<AudioRecorder onCancel={onCancel} onComplete={onComplete} />);

    const recorder = await pressRecord();
    advance(3000);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Discard recording' }));
    });
    await act(async () => {
      recorder!.emitData();
      recorder!.emitStop();
    });

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onComplete).not.toHaveBeenCalled();
    // The clock resets too - there is no take left for it to describe.
    expect(screen.getByText('0:00')).toBeInTheDocument();
  });

  it('abandons a permission prompt that is still open', async () => {
    // The window in which a reader is most likely to change their mind. `cancel()` used to be a
    // silent no-op here, and the microphone then opened anyway once they answered.
    let grant: (stream: FakeMediaStream) => void = () => {};
    getUserMedia.mockImplementation(
      () =>
        new Promise<FakeMediaStream>((resolve_) => {
          grant = resolve_;
        }),
    );
    const onCancel = vi.fn();
    const onReady = vi.fn();
    render(<AudioRecorder onCancel={onCancel} onReady={onReady} />);
    const handle = onReady.mock.calls[0]![0] as AudioRecorderHandle;

    await act(async () => {
      fireEvent.click(recordButton());
    });
    await act(async () => {
      handle.cancel();
    });
    expect(handle.getStatus()).toBe('idle');

    await act(async () => {
      grant(currentStream);
    });

    expect(currentStream.tracks.every((track) => track.readyState === 'ended')).toBe(true);
    expect(FakeMediaRecorder.instances).toHaveLength(0);
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(recordButton()).toBeEnabled();
  });

  it('offers the discard control only while recording', async () => {
    render(<AudioRecorder />);

    expect(screen.queryByRole('button', { name: 'Discard recording' })).not.toBeInTheDocument();
    await pressRecord();
    expect(screen.getByRole('button', { name: 'Discard recording' })).toBeInTheDocument();
    await pressStop();
    expect(screen.queryByRole('button', { name: 'Discard recording' })).not.toBeInTheDocument();
  });
});

/* -------------------------------------------------------------------------- maxDuration */

describe('maxDurationSeconds', () => {
  it('stops the recording and completes normally rather than erroring', async () => {
    const onComplete = vi.fn();
    const onError = vi.fn();
    render(
      <AudioRecorder maxDurationSeconds={2} onComplete={onComplete} onRecordingError={onError} />,
    );

    const recorder = await pressRecord();
    advance(2000);
    await act(async () => {
      recorder!.emitData();
      recorder!.emitStop();
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
    expect((onComplete.mock.calls[0]![0] as AudioRecording).durationMs).toBeGreaterThanOrEqual(
      1900,
    );
  });

  it('leaves a recording inside the cap alone', async () => {
    render(<AudioRecorder maxDurationSeconds={10} />);

    await pressRecord();
    advance(9000);

    expect(stopButton()).toBeInTheDocument();
    expect(lastRecorder().stop).not.toHaveBeenCalled();
  });
});

/* --------------------------------------------------------------------- releasing the mic */

describe('releasing the microphone', () => {
  /** Every track ended, which is what puts the browser's recording indicator out. */
  const everyTrackStopped = () =>
    currentStream.tracks.every((track) => track.readyState === 'ended');

  it('stops every track and closes the AudioContext on stop', async () => {
    render(<AudioRecorder />);
    await pressRecord();

    await pressStop();

    expect(everyTrackStopped()).toBe(true);
    expect(lastContext().close).toHaveBeenCalled();
  });

  it('stops every track and closes the AudioContext on cancel', async () => {
    render(<AudioRecorder />);
    const recorder = await pressRecord();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Discard recording' }));
    });
    await act(async () => {
      recorder!.emitStop();
    });

    expect(everyTrackStopped()).toBe(true);
    expect(lastContext().close).toHaveBeenCalled();
  });

  it('stops every track and closes the AudioContext at maxDurationSeconds', async () => {
    render(<AudioRecorder maxDurationSeconds={1} />);
    const recorder = await pressRecord();

    advance(1000);
    await act(async () => {
      recorder!.emitStop();
    });

    expect(everyTrackStopped()).toBe(true);
    expect(lastContext().close).toHaveBeenCalled();
  });

  it('stops every track and closes the AudioContext on an engine error', async () => {
    render(<AudioRecorder />);
    const recorder = await pressRecord();

    await act(async () => {
      recorder!.emitError();
    });

    expect(everyTrackStopped()).toBe(true);
    expect(lastContext().close).toHaveBeenCalled();
  });

  it('stops every track and closes the AudioContext on unmount WHILE recording', async () => {
    // The worst case: an un-stopped track keeps the recording indicator lit with nothing left on
    // the page to switch it off.
    const { unmount } = render(<AudioRecorder />);
    await pressRecord();

    unmount();

    expect(everyTrackStopped()).toBe(true);
    expect(lastContext().close).toHaveBeenCalled();
  });

  it('stops a stream granted after the component has gone', async () => {
    // The reader answered the permission prompt after the component unmounted. Nothing will render
    // this stream, and nothing else will ever stop it.
    let grant: (stream: FakeMediaStream) => void = () => {};
    getUserMedia.mockImplementation(
      () =>
        new Promise<FakeMediaStream>((resolve_) => {
          grant = resolve_;
        }),
    );
    const { unmount } = render(<AudioRecorder />);
    await pressRecord();

    unmount();
    await act(async () => {
      grant(currentStream);
    });

    expect(everyTrackStopped()).toBe(true);
    expect(FakeMediaRecorder.instances).toHaveLength(0);
  });

  it('opens no AudioContext at all when the waveform is off', async () => {
    render(<AudioRecorder showWaveform={false} />);

    await pressRecord();

    expect(FakeAudioContext.instances).toHaveLength(0);
  });

  it('closes an AudioContext whose analyser could not be built', async () => {
    // The waveform is decoration and its failure is swallowed on purpose - but the resource it
    // allocated is not decoration. A context published to the ref only AFTER the analyser succeeds
    // is unreachable when the analyser throws: never closed, never closable, and it outlives the
    // component. Browsers cap concurrent contexts (Chrome at six).
    class RefusingContext extends FakeAudioContext {
      createMediaStreamSource = vi.fn(() => {
        throw new Error('no source for you');
      }) as unknown as FakeAudioContext['createMediaStreamSource'];
    }
    vi.stubGlobal('AudioContext', RefusingContext);
    render(<AudioRecorder />);

    await pressRecord();
    // The recording continues regardless - that is the point of swallowing it.
    expect(stopButton()).toBeInTheDocument();
    await pressStop();

    expect(lastContext().close).toHaveBeenCalled();
  });
});

/* ------------------------------------------------------------------------------- failures */

describe('permission refused', () => {
  function denyPermission(name = 'NotAllowedError') {
    getUserMedia.mockImplementation(async () => {
      const error = new Error('Permission denied');
      error.name = name;
      throw error;
    });
  }

  it('renders the permission-denied state and reports reason: permission', async () => {
    denyPermission();
    const onError = vi.fn();
    render(<AudioRecorder onRecordingError={onError} />);

    await pressRecord();

    expect(screen.getByText(/blocking the microphone/i)).toBeInTheDocument();
    const error = onError.mock.calls[0]![0] as AudioRecordingError;
    expect(error).toBeInstanceOf(Error);
    expect(error.reason).toBe('permission');
  });

  it('leaves the control disabled rather than hidden, and still focusable', async () => {
    // A denied microphone cannot be re-prompted from inside the page, so a live button would lie -
    // and a hidden one would leave the reader staring at a component that vanished. It says so with
    // `aria-disabled` rather than the attribute, because the attribute would take focus off the
    // control the reader just pressed (see the focus test below).
    denyPermission();
    render(<AudioRecorder />);

    await pressRecord();

    expect(recordButton()).toBeInTheDocument();
    expect(recordButton()).toHaveAttribute('aria-disabled', 'true');
    expect(recordButton()).not.toBeDisabled();
  });

  it('does not re-prompt once refused, even when driven from the handle', async () => {
    // Driven through the HANDLE on purpose: React does not dispatch `onClick` to a disabled button,
    // so a click-based version of this test passes on a component with no guard at all. `start()`
    // reaches the guard directly.
    denyPermission();
    const onReady = vi.fn();
    render(<AudioRecorder onReady={onReady} />);
    const handle = onReady.mock.calls[0]![0] as AudioRecorderHandle;

    await act(async () => {
      handle.start();
    });
    expect(handle.getStatus()).toBe('permission-denied');
    getUserMedia.mockClear();

    await act(async () => {
      handle.start();
    });

    expect(getUserMedia).not.toHaveBeenCalled();
    expect(handle.isRecording()).toBe(false);
  });

  it('takes its copy from a prop, so it can be reworded or translated', async () => {
    denyPermission();
    render(<AudioRecorder permissionDeniedLabel="Le micro est bloque." />);

    await pressRecord();

    expect(screen.getByText('Le micro est bloque.')).toBeInTheDocument();
  });

  it('treats a missing device as the DEVICE, not as a refusal', async () => {
    denyPermission('NotFoundError');
    const onError = vi.fn();
    render(<AudioRecorder onRecordingError={onError} />);

    await pressRecord();

    expect((onError.mock.calls[0]![0] as AudioRecordingError).reason).toBe('device');
    // Recoverable - plug a microphone in and press again.
    expect(recordButton()).toBeEnabled();
  });
});

describe('unsupported browser', () => {
  const blockedControl = () => screen.getByRole('button', { name: 'Record' });

  it('renders the unsupported state when no container is supported, and throws nothing', () => {
    FakeMediaRecorder.supported = [];

    expect(() => render(<AudioRecorder />)).not.toThrow();
    expect(screen.getByText(/not supported/i)).toBeInTheDocument();
    expect(blockedControl()).toHaveAttribute('aria-disabled', 'true');
  });

  it('renders the unsupported state when the browser has no recorder', () => {
    vi.stubGlobal('MediaRecorder', undefined);

    render(<AudioRecorder />);

    expect(blockedControl()).toHaveAttribute('aria-disabled', 'true');
  });

  it('renders the unsupported state when the browser cannot open a microphone', () => {
    Reflect.deleteProperty(navigator, 'mediaDevices');

    render(<AudioRecorder />);

    expect(blockedControl()).toHaveAttribute('aria-disabled', 'true');
  });

  it('never asks for the microphone in the unsupported state', async () => {
    FakeMediaRecorder.supported = [];
    render(<AudioRecorder />);

    await act(async () => {
      fireEvent.click(blockedControl());
    });

    expect(getUserMedia).not.toHaveBeenCalled();
    expect(FakeMediaRecorder.instances).toHaveLength(0);
  });

  it('reports reason: unsupported when something tries to record anyway', async () => {
    // The documented reason has to be REACHABLE. The mount effect sets the status before anything
    // can be pressed, so an early return for `unsupported` in the record handler made this line
    // dead code and a consumer branching on it never received the value.
    FakeMediaRecorder.supported = [];
    const onError = vi.fn();
    const onReady = vi.fn();
    render(<AudioRecorder onRecordingError={onError} onReady={onReady} />);
    const handle = onReady.mock.calls[0]![0] as AudioRecorderHandle;

    await act(async () => {
      handle.start();
    });

    expect((onError.mock.calls[0]![0] as AudioRecordingError).reason).toBe('unsupported');
    expect(handle.getStatus()).toBe('unsupported');
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it('does not flip a LIVE recording to unsupported when `mimeTypes` changes', async () => {
    // Nothing is released on that path, so the stream, the recorder and both loops would keep
    // running behind a control `requestStop` no longer acts on - the microphone open, the browser's
    // indicator lit, until unmount.
    const { rerender } = render(<AudioRecorder />);
    await pressRecord();

    FakeMediaRecorder.supported = [];
    rerender(<AudioRecorder mimeTypes={['audio/x-nope']} />);
    await act(async () => {});

    expect(stopButton()).toBeInTheDocument();
    expect(currentStream.tracks.every((track) => track.readyState === 'live')).toBe(true);
  });
});

describe('a device error mid-recording', () => {
  it('reports reason: device and stops cleanly', async () => {
    const onError = vi.fn();
    const onComplete = vi.fn();
    render(<AudioRecorder onRecordingError={onError} onComplete={onComplete} />);
    const recorder = await pressRecord();

    await act(async () => {
      recorder!.emitError();
    });

    const error = onError.mock.calls[0]![0] as AudioRecordingError;
    expect(error.reason).toBe('device');
    expect(onComplete).not.toHaveBeenCalled();
    expect(screen.getByText(/microphone is unavailable/i)).toBeInTheDocument();
  });

  it('leaves the control live, because a device error is recoverable', async () => {
    render(<AudioRecorder />);
    const recorder = await pressRecord();

    await act(async () => {
      recorder!.emitError();
    });

    expect(recordButton()).toBeEnabled();
    expect(recordButton()).toHaveAttribute('aria-disabled', 'false');
  });
});

describe('a recorder that will not start', () => {
  it('reports reason: engine when the recorder will not construct, and releases the stream', async () => {
    // The release on this path is the load-bearing half: without it the constructor's failure ships
    // a LIVE microphone, with the browser's indicator lit and nothing on the page to switch it off.
    class RefusingRecorder {
      static isTypeSupported = () => true;
      constructor() {
        throw new Error('cannot construct');
      }
    }
    vi.stubGlobal('MediaRecorder', RefusingRecorder);
    const onError = vi.fn();
    render(<AudioRecorder onRecordingError={onError} />);

    await act(async () => {
      fireEvent.click(recordButton());
    });

    expect((onError.mock.calls[0]![0] as AudioRecordingError).reason).toBe('engine');
    expect(currentStream.tracks.every((track) => track.readyState === 'ended')).toBe(true);
    expect(screen.getByText(/microphone is unavailable/i)).toBeInTheDocument();
  });

  it('reports reason: engine when `start()` throws, and releases everything', async () => {
    class UnstartableRecorder extends FakeMediaRecorder {
      start = vi.fn(() => {
        throw new Error('will not start');
      });
    }
    vi.stubGlobal('MediaRecorder', UnstartableRecorder);
    const onError = vi.fn();
    render(<AudioRecorder onRecordingError={onError} />);

    await act(async () => {
      fireEvent.click(recordButton());
    });

    expect((onError.mock.calls[0]![0] as AudioRecordingError).reason).toBe('engine');
    expect(currentStream.tracks.every((track) => track.readyState === 'ended')).toBe(true);
    expect(lastContext().close).toHaveBeenCalled();
    expect(loopIsRunning()).toBe(false);
  });
});

/* ------------------------------------------------------------------------------ the waveform */

describe('the waveform', () => {
  it('draws one bar per `barCount`, as token-styled elements rather than a canvas', () => {
    const { container } = render(<AudioRecorder barCount={12} />);

    expect(container.querySelector('canvas')).toBeNull();
    expect(barHeights(container)).toHaveLength(12);
    // `bg-border` is 1.46:1 on this card in light and 1.31:1 in dark, so a resting bar had already
    // vanished - the thing MIN_BAR_LEVEL exists to prevent. `text-subtle` clears the 3:1 non-text
    // floor in both themes. `min-w-px` keeps a bar from collapsing in a narrow container.
    expect(waveform(container)!.firstElementChild).toHaveClass('bg-text-subtle');
    expect(waveform(container)!.firstElementChild).toHaveClass('min-w-px');
  });

  it('responds to the input level in flight, not merely at rest', async () => {
    // Verified IN FLIGHT (learning 44): the loop is stepped a frame at a time with a controlled
    // input level, so the tick body is what produces the heights.
    const { container } = render(<AudioRecorder barCount={8} />);
    await pressRecord();

    analyser().level = 0.9;
    act(() => {
      stepFrame();
    });
    const loud = barHeights(container);

    analyser().level = 0;
    advance(50);
    act(() => {
      stepFrame();
    });
    const silent = barHeights(container);

    expect(Math.max(...loud)).toBeGreaterThan(50);
    expect(Math.max(...silent)).toBe(8);
  });

  it('re-renders at the ~30fps budget rather than once per animation frame', async () => {
    // Forty-eight inline heights and a full component re-render, at the display's refresh rate, is
    // four reconciliations per painted change on a 120Hz panel. The loop still runs every frame -
    // it stays tied to the compositor - but only the due ones reach React.
    const { container } = render(<AudioRecorder barCount={8} />);
    await pressRecord();

    analyser().level = 0.9;
    act(() => {
      stepFrame();
    });
    const painted = barHeights(container);

    analyser().level = 0;
    act(() => {
      stepFrame();
    });

    expect(barHeights(container)).toEqual(painted);
    expect(loopIsRunning()).toBe(true);
  });

  it('paints the bars with the active role while recording', async () => {
    const { container } = render(<AudioRecorder barCount={4} />);
    await pressRecord();

    expect(waveform(container)!.firstElementChild).toHaveClass('bg-primary');
  });

  it('re-arms itself each frame, so the bars keep moving', async () => {
    render(<AudioRecorder barCount={4} />);
    await pressRecord();

    act(() => {
      stepFrame();
    });

    expect(loopIsRunning()).toBe(true);
  });

  it('never routes the microphone back to the speakers', async () => {
    render(<AudioRecorder />);
    await pressRecord();

    // An analyser connected to `destination` is a feedback loop, not a waveform.
    expect(lastContext().createAnalyser).toHaveBeenCalled();
    expect(analyser().connect).not.toHaveBeenCalled();
  });

  it('can be turned off entirely', () => {
    const { container } = render(<AudioRecorder showWaveform={false} />);
    expect(waveform(container)).toBeNull();
  });
});

describe('the recording state is visible, not only glyph-deep', () => {
  it('marks a live microphone with the danger role, and clears it when the take ends', async () => {
    // Idle and recording were otherwise the same `primary` circle with a different 16px glyph.
    // This is the one state in the component where being wrong has a privacy cost.
    const { container } = render(<AudioRecorder />);

    expect(recordingDot(container)).toHaveClass('bg-transparent');

    await pressRecord();
    expect(recordingDot(container)).toHaveClass('bg-danger');

    await pressStop();
    expect(recordingDot(container)).toHaveClass('bg-transparent');
  });

  it('survives showWaveform={false}, where the glyph would be the whole signal', async () => {
    const { container } = render(<AudioRecorder showWaveform={false} />);

    await pressRecord();

    expect(waveform(container)).toBeNull();
    expect(recordingDot(container)).toHaveClass('bg-danger');
  });

  it('brightens the clock while a take runs and calms it again afterwards', async () => {
    // The clock is the only quantitative readout on the card. Colour, not size, so it cannot reflow.
    render(<AudioRecorder />);
    const clock = () => screen.getByText(/^\d+:\d\d$/);

    expect(clock()).toHaveClass('text-text-muted');
    await pressRecord();
    expect(clock()).toHaveClass('text-text');
    await pressStop();
    expect(clock()).toHaveClass('text-text-muted');
  });

  it('keeps the row from reflowing when the discard control appears', async () => {
    // Cancel is mounted on demand, so its slot is reserved: without it the waveform lost 52px at
    // exactly the moment the reader is watching the bars to see whether the microphone works.
    const { container } = render(<AudioRecorder />);
    const row = () => container.firstElementChild!.firstElementChild!;
    const idleChildren = row().children.length;

    await pressRecord();

    expect(row().children.length).toBe(idleChildren);
    // And it sits past the waveform, not 12px from the control it undoes.
    const order = [...row().children];
    expect(
      order.indexOf(screen.getByRole('button', { name: 'Discard recording' })),
    ).toBeGreaterThan(order.indexOf(waveform(container)!));
  });
});

describe('the animation loop', () => {
  it('does not run until recording starts', () => {
    render(<AudioRecorder />);
    expect(frame.request).not.toHaveBeenCalled();
  });

  it('runs while recording', async () => {
    render(<AudioRecorder />);
    await pressRecord();

    // Asserted POSITIVELY: "cancel was not called" also passes for a loop that never started.
    expect(loopIsRunning()).toBe(true);
  });

  it('is cancelled on stop', async () => {
    render(<AudioRecorder />);
    await pressRecord();

    await pressStop();

    expect(frame.cancel).toHaveBeenCalled();
    expect(loopIsRunning()).toBe(false);
  });

  it('is cancelled on cancel', async () => {
    render(<AudioRecorder />);
    const recorder = await pressRecord();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Discard recording' }));
      recorder!.emitStop();
    });

    expect(loopIsRunning()).toBe(false);
  });

  it('is cancelled on an error', async () => {
    render(<AudioRecorder />);
    const recorder = await pressRecord();

    await act(async () => {
      recorder!.emitError();
    });

    expect(loopIsRunning()).toBe(false);
  });

  it('is cancelled on unmount', async () => {
    const { unmount } = render(<AudioRecorder />);
    await pressRecord();

    unmount();

    expect(frame.cancel).toHaveBeenCalled();
    expect(loopIsRunning()).toBe(false);
  });

  it('survives a frame that fires after the analyser is gone', async () => {
    const { unmount } = render(<AudioRecorder />);
    await pressRecord();
    const pending = [...frame.scheduled.values()].at(-1);

    unmount();

    expect(() => pending?.(0)).not.toThrow();
  });
});

describe('under prefers-reduced-motion', () => {
  it('reduces the bars to a single level meter rather than removing them', async () => {
    // Removing it would remove the one signal that a muted microphone is muted.
    stubReducedMotion(true);
    const { container } = render(<AudioRecorder barCount={48} />);
    await pressRecord();

    const meter = waveform(container)!;
    expect(meter.children).toHaveLength(1);
    expect((meter.firstElementChild as HTMLElement).style.width).toBeTruthy();
    // The same row height and the same trackless form as the bars, so the two presentations of one
    // idea read as relatives. The old `bg-border` fill inside a `bg-muted-raised` track resolved to
    // the same value in dark - an empty track with no indicator in it at all.
    expect(meter).toHaveClass('h-10');
    expect(meter).not.toHaveClass('bg-muted-raised');
    expect(meter.firstElementChild).toHaveClass('bg-primary');
  });

  it('draws a visible resting meter before anything is recorded', () => {
    stubReducedMotion(true);
    const { container } = render(<AudioRecorder />);

    expect(waveform(container)!.firstElementChild).toHaveClass('bg-text-subtle');
  });

  it('still responds to input, on a slower cadence', async () => {
    stubReducedMotion(true);
    const { container } = render(<AudioRecorder />);
    await pressRecord();
    const width = () =>
      Number.parseInt((waveform(container)!.firstElementChild as HTMLElement).style.width, 10);

    analyser().level = 0.9;
    act(() => {
      stepFrame();
    });
    const first = width();

    // A second frame in the same instant is deliberately NOT due - the meter eases rather than
    // tracking every frame.
    act(() => {
      stepFrame();
    });
    expect(width()).toBe(first);

    advance(300);
    act(() => {
      stepFrame();
    });

    expect(first).toBeGreaterThan(8);
    expect(width()).toBeGreaterThan(first);
  });
});

/* --------------------------------------------------------------------------- accessibility */

describe('accessibility', () => {
  it('hides the waveform from assistive tech, with nothing focusable and no sr-only inside it', async () => {
    const { container } = render(<AudioRecorder barCount={6} />);
    await pressRecord();

    const decoration = waveform(container)!;
    expect(decoration).toHaveAttribute('aria-hidden', 'true');
    // An `aria-hidden` ancestor prunes the WHOLE subtree, so a label in there would reach nobody.
    expect(decoration.querySelector('.sr-only')).toBeNull();
    expect(decoration.querySelector('button, a, input, [tabindex]')).toBeNull();
  });

  it("changes the control's accessible name between idle and recording", async () => {
    render(<AudioRecorder />);
    expect(recordButton()).toBeInTheDocument();

    await pressRecord();

    expect(stopButton()).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Record' })).not.toBeInTheDocument();
  });

  it('keeps focus on the control across the state change', async () => {
    const user = useRealTime();
    render(<AudioRecorder />);

    await user.click(recordButton());
    await act(async () => {});

    // One button whose name changes, not two swapping places under the pointer - so a keyboard
    // user is never dropped to the document.
    expect(stopButton()).toHaveFocus();
  });

  it('never puts the `disabled` ATTRIBUTE on the control it just took a press from', async () => {
    // jsdom keeps focus on an element that becomes disabled; Chrome, Firefox and Safari run the
    // unfocusing steps and drop it to `<body>`. So the blur itself is not observable here - what is
    // observable is its CAUSE, and this is the assertion that holds the shipped behaviour to the
    // spec's "focus stays on the control across the state change".
    //
    // The states are entered by pressing this control: `requesting` on the way in, `stopping` on
    // the way out, and `permission-denied` / `unsupported` when it fails. The re-entry guards on
    // `statusRef` already ignore the press, so `aria-disabled` says the same thing to assistive
    // tech without taking the element out of the focus order.
    let grant: (stream: FakeMediaStream) => void = () => {};
    getUserMedia.mockImplementation(
      () =>
        new Promise<FakeMediaStream>((resolve_) => {
          grant = resolve_;
        }),
    );
    render(<AudioRecorder />);

    await act(async () => {
      fireEvent.click(recordButton());
    });
    const waiting = screen.getByRole('button', { name: 'Waiting for microphone access' });
    expect(waiting).not.toBeDisabled();
    expect(waiting).toHaveAttribute('aria-disabled', 'true');

    await act(async () => {
      grant(currentStream);
    });
    const recorder = lastRecorder();
    await act(async () => {
      fireEvent.click(stopButton());
    });

    expect(stopButton()).not.toBeDisabled();
    expect(stopButton()).toHaveAttribute('aria-disabled', 'true');

    await act(async () => {
      recorder.emitData();
      recorder.emitStop();
    });
    expect(recordButton()).not.toBeDisabled();
  });

  it('renders the requesting state while the browser prompt is open', async () => {
    let grant: (stream: FakeMediaStream) => void = () => {};
    getUserMedia.mockImplementation(
      () =>
        new Promise<FakeMediaStream>((resolve_) => {
          grant = resolve_;
        }),
    );
    render(<AudioRecorder />);

    await act(async () => {
      fireEvent.click(recordButton());
    });

    const waiting = screen.getByRole('button', { name: 'Waiting for microphone access' });
    expect(waiting).toHaveAttribute('aria-busy', 'true');
    expect(waiting.querySelector('.animate-spin')).not.toBeNull();
    // The Spinner's own `role="status"` must not announce a second, competing message.
    expect(waiting.querySelector('[role="status"]')).toHaveAttribute('aria-hidden', 'true');
    expect(liveRegion()).toHaveTextContent('Waiting for microphone access');

    await act(async () => {
      grant(currentStream);
    });
    expect(stopButton()).toBeInTheDocument();
  });

  it('renders the stopping state while the engine finalises the take', async () => {
    // Between `recorder.stop()` and the engine's `onstop` a second press would land on a take that
    // is still finalising, and cancel would offer to discard one that is already kept.
    render(<AudioRecorder />);
    const recorder = await pressRecord();

    await act(async () => {
      fireEvent.click(stopButton());
    });

    expect(stopButton()).toHaveAttribute('aria-disabled', 'true');
    expect(screen.queryByRole('button', { name: 'Discard recording' })).not.toBeInTheDocument();

    await act(async () => {
      recorder!.emitData();
      recorder!.emitStop();
    });
    expect(recordButton()).toBeInTheDocument();
  });

  it('takes its copy from props throughout', async () => {
    render(<AudioRecorder startLabel="Start note" stopLabel="Finish note" cancelLabel="Bin it" />);

    expect(screen.getByRole('button', { name: 'Start note' })).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Start note' }));
    });
    expect(screen.getByRole('button', { name: 'Finish note' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bin it' })).toBeInTheDocument();
  });

  it('announces the transitions in a polite live region, without putting them on the page', async () => {
    render(<AudioRecorder />);

    await pressRecord();
    expect(liveRegion()).toHaveTextContent('Recording');
    // The class switch is the half that makes ONE region work for both jobs. Without it every
    // announcement - "Recording 0:10", "Recording discarded" - becomes visible text under the
    // control, flickering on each change.
    expect(liveRegion()).toHaveClass('sr-only');

    await pressStop();
    expect(liveRegion()).toHaveTextContent('Recording stopped');
    expect(liveRegion()).toHaveClass('sr-only');
  });

  it('shows the failure message as visible copy in the SAME region, exactly once', async () => {
    getUserMedia.mockImplementation(async () => {
      const error = new Error('Permission denied');
      error.name = 'NotAllowedError';
      throw error;
    });
    render(<AudioRecorder />);

    await pressRecord();

    expect(liveRegion()).not.toHaveClass('sr-only');
    // The duplication tell the merged-live-region learning names: two regions would match twice.
    expect(screen.getAllByText(/blocking the microphone/i)).toHaveLength(1);
    // The copy is `text-text`, not `text-danger`: `danger` as a foreground measures 3.42:1 on this
    // card in dark, under the AA floor for 12px. The danger role marks it with a glyph instead,
    // where the 3:1 non-text floor applies - so the failure is not signalled by colour alone.
    expect(liveRegion()).toHaveClass('text-text');
    expect(liveRegion().querySelector('.text-danger')).not.toBeNull();
  });

  it('throttles the elapsed announcement rather than reading every second', async () => {
    // Announcing every second turns a screen reader into a metronome.
    render(<AudioRecorder />);
    await pressRecord();

    advance(3000);
    expect(liveRegion()).toHaveTextContent(/^Recording$/);

    advance(7500);
    expect(liveRegion()).toHaveTextContent('Recording 0:10');
  });

  it('says nothing before anything has happened', () => {
    render(<AudioRecorder />);
    expect(liveRegion()).toHaveTextContent('');
  });
});

describe('keyboard operation', () => {
  it('operates the control with Enter and Space', async () => {
    const user = useRealTime();
    render(<AudioRecorder />);

    await user.tab();
    expect(recordButton()).toHaveFocus();

    await user.keyboard('{Enter}');
    await act(async () => {});
    expect(getUserMedia).toHaveBeenCalledTimes(1);

    const recorder = lastRecorder();
    await user.keyboard('[Space]');
    await act(async () => {
      recorder.emitData();
      recorder.emitStop();
    });

    expect(recorder.stop).toHaveBeenCalled();
    expect(recordButton()).toBeInTheDocument();
  });

  it('cancels with Escape while recording', async () => {
    const onCancel = vi.fn();
    const onComplete = vi.fn();
    render(<AudioRecorder onCancel={onCancel} onComplete={onComplete} />);
    const recorder = await pressRecord();

    fireEvent.keyDown(stopButton(), { key: 'Escape' });
    await act(async () => {
      recorder!.emitStop();
    });

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('ignores Escape when nothing is being recorded', async () => {
    const onCancel = vi.fn();
    const { container } = render(<AudioRecorder onCancel={onCancel} />);

    fireEvent.keyDown(container.firstElementChild!, { key: 'Escape' });

    expect(onCancel).not.toHaveBeenCalled();
  });

  it("still calls a caller's own onKeyDown", async () => {
    const onKeyDown = vi.fn();
    render(<AudioRecorder onKeyDown={onKeyDown} />);

    fireEvent.keyDown(recordButton(), { key: 'Escape' });

    expect(onKeyDown).toHaveBeenCalled();
  });

  it('lets a caller suppress Escape with preventDefault', async () => {
    // A consumer that owns Escape for its own dialog must not lose the take underneath it. The
    // previous test proves the handler RUNS; this one proves its `preventDefault()` is honoured.
    const onCancel = vi.fn();
    render(<AudioRecorder onCancel={onCancel} onKeyDown={(event) => event.preventDefault()} />);
    await pressRecord();

    fireEvent.keyDown(stopButton(), { key: 'Escape' });

    expect(onCancel).not.toHaveBeenCalled();
    expect(lastRecorder().stop).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Discard recording' })).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------------------- StrictMode */

describe('under React StrictMode', () => {
  /**
   * StrictMode runs setup, cleanup, setup on mount - a remount of the same instance - and it is on
   * by default in Next.js, which is where consumers live. Every other test in this file uses a
   * plain render, so the whole class of mount-scoped state that does not survive a remount was
   * invisible to the suite. These drive a full take through it.
   */
  it('records a complete take', async () => {
    const onComplete = vi.fn();
    render(
      <React.StrictMode>
        <AudioRecorder onComplete={onComplete} />
      </React.StrictMode>,
    );

    await pressRecord();
    // The tell for the latched-unmount bug: the stream is granted and then immediately discarded,
    // so no recorder is ever constructed and the control sits on a spinner that never resolves.
    expect(FakeMediaRecorder.instances).toHaveLength(1);
    expect(stopButton()).toBeInTheDocument();
    expect(currentStream.tracks.every((track) => track.readyState === 'live')).toBe(true);

    advance(1500);
    await pressStop();

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect((onComplete.mock.calls[0]![0] as AudioRecording).blob.size).toBeGreaterThan(0);
    expect(recordButton()).toBeInTheDocument();
  });

  it('still releases the microphone on unmount', async () => {
    const { unmount } = render(
      <React.StrictMode>
        <AudioRecorder />
      </React.StrictMode>,
    );
    await pressRecord();

    unmount();

    expect(currentStream.tracks.every((track) => track.readyState === 'ended')).toBe(true);
    expect(lastContext().close).toHaveBeenCalled();
  });
});

/* --------------------------------------------------------- the owned interface (spec 0072) */

/** Every name this component publishes. A new one has to be added here to be snapshotted. */
const PUBLISHED_NAMES = [
  'AudioRecorderStatus',
  'AudioRecording',
  'AudioRecorderHandle',
  'AudioRecordingError',
  'AudioRecorderProps',
  'AudioRecorder',
] as const;

/**
 * Cut this component's declarations out of the built `.d.ts`, comments stripped, in a fixed order.
 *
 * Comments go first because the doc comments legitimately NAME the platform API when explaining why
 * it is not exposed, and prose is not a contract. Whitespace is normalised so the snapshot pins the
 * TYPES and not tsup's formatting. A missing name throws rather than snapshotting an empty string -
 * a guard that passes vacuously on a surface which dropped the thing it was guarding is worse than
 * no guard (learning 57).
 */
function publicDeclarations(source: string): string {
  const types = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  return PUBLISHED_NAMES.map((name) => {
    const start = new RegExp(
      `^(?:declare )?(?:const|function|class|interface|type) ${name}\\b`,
      'm',
    ).exec(types);
    if (!start) throw new Error(`the built declarations no longer publish ${name}`);
    let depth = 0;
    let index = start.index;
    for (; index < types.length; index += 1) {
      const char = types[index];
      if (char === '{') depth += 1;
      else if (char === '}') {
        depth -= 1;
        if (depth === 0) {
          index += 1;
          break;
        }
      } else if (char === ';' && depth === 0) {
        index += 1;
        break;
      }
    }
    return types
      .slice(start.index, index)
      .replace(/[ \t]+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  }).join('\n');
}

describe("the public interface is Canopy's, not the platform's", () => {
  it('publishes exactly this declaration surface, and nothing else', () => {
    // THE swappability guard, and the reason `onReady` hands over a handle rather than a
    // `MediaRecorder`. Read from the BUILT artifact - that is what a consumer installs, and a
    // platform type leaks through INFERENCE without ever being written down in the source.
    // `test` depends on `build` in turbo.json, so this file is present and current.
    //
    // It is a SNAPSHOT rather than a list of banned names. A denylist only rejects what someone
    // remembered to ban: `MediaTrackConstraints`, `MediaDeviceInfo` and the whole `Constrain*`
    // family are the natural way to write the device-selection and gain props this spec defers, and
    // none of them would have been caught. Inverted, every new type reference in the published
    // surface is a reviewed diff instead.
    const declarations = readFileSync(resolve(__dirname, '../../dist/branches/index.d.ts'), 'utf8');

    expect(publicDeclarations(declarations)).toMatchInlineSnapshot(`
      "type AudioRecorderStatus = 'idle' | 'requesting' | 'recording' | 'stopping' | 'permission-denied' | 'unsupported' | 'device-error';
      interface AudioRecording {
       blob: Blob;
       mimeType: string;
       durationMs: number;
      }
      interface AudioRecorderHandle {
       start(): void;
       stop(): void;
       cancel(): void;
       isRecording(): boolean;
       getStatus(): AudioRecorderStatus;
       getDurationMs(): number;
      }
      interface AudioRecordingError extends Error {
       reason: 'permission' | 'unsupported' | 'device' | 'engine';
      }
      interface AudioRecorderProps extends React.HTMLAttributes<HTMLDivElement> {
       onComplete?: (recording: AudioRecording) => void;
       onStart?: () => void;
       onStop?: () => void;
       onCancel?: () => void;
       onRecordingError?: (error: AudioRecordingError) => void;
       onReady?: (recorder: AudioRecorderHandle) => void;
       maxDurationSeconds?: number;
       mimeTypes?: readonly string[];
       showWaveform?: boolean;
       barCount?: number;
       startLabel?: string;
       stopLabel?: string;
       cancelLabel?: string;
       recordingLabel?: string;
       requestingLabel?: string;
       stoppedLabel?: string;
       cancelledLabel?: string;
       permissionDeniedLabel?: string;
       unsupportedLabel?: string;
       deviceErrorLabel?: string;
      }
      declare const AudioRecorder: React.ForwardRefExoticComponent<AudioRecorderProps & React.RefAttributes<HTMLDivElement>>;"
    `);
  });

  it('hands `onReady` a handle on mount, without asking for the microphone', () => {
    const onReady = vi.fn();
    render(<AudioRecorder onReady={onReady} />);

    expect(onReady).toHaveBeenCalledTimes(1);
    expect(getUserMedia).not.toHaveBeenCalled();
    expect(onReady.mock.calls[0]![0]).toEqual(
      expect.objectContaining({ start: expect.any(Function), stop: expect.any(Function) }),
    );
  });

  it('drives the recorder from the handle, and agrees with the rendered state', async () => {
    const onReady = vi.fn();
    const onComplete = vi.fn();
    render(<AudioRecorder onReady={onReady} onComplete={onComplete} />);
    const handle = onReady.mock.calls[0]![0] as AudioRecorderHandle;

    expect(handle.isRecording()).toBe(false);
    expect(handle.getDurationMs()).toBe(0);

    await act(async () => {
      handle.start();
    });
    expect(handle.isRecording()).toBe(true);
    expect(stopButton()).toBeInTheDocument();

    advance(1500);
    expect(handle.getDurationMs()).toBeGreaterThanOrEqual(1500);

    const recorder = lastRecorder();
    await act(async () => {
      handle.stop();
    });
    await act(async () => {
      recorder.emitData();
      recorder.emitStop();
    });

    expect(handle.isRecording()).toBe(false);
    expect(handle.getDurationMs()).toBeGreaterThanOrEqual(1500);
    expect(recordButton()).toBeInTheDocument();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("discards the take through the handle's cancel", async () => {
    const onReady = vi.fn();
    const onCancel = vi.fn();
    const onComplete = vi.fn();
    render(<AudioRecorder onReady={onReady} onCancel={onCancel} onComplete={onComplete} />);
    const handle = onReady.mock.calls[0]![0] as AudioRecorderHandle;

    await act(async () => {
      handle.start();
    });
    const recorder = lastRecorder();
    await act(async () => {
      handle.cancel();
    });
    await act(async () => {
      recorder.emitStop();
    });

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onComplete).not.toHaveBeenCalled();
    expect(handle.getDurationMs()).toBe(0);
  });

  it('does not start a second recording when record is pressed twice in a row', async () => {
    // The handler reads the ref, not React state: state lags a render, and two presses inside that
    // window would open two microphone requests (learning 47).
    render(<AudioRecorder />);

    await act(async () => {
      fireEvent.click(recordButton());
      fireEvent.click(recordButton());
    });

    expect(getUserMedia).toHaveBeenCalledTimes(1);
    expect(FakeMediaRecorder.instances).toHaveLength(1);
  });

  it('reports its status through the handle, so the type is reachable at all', async () => {
    const onReady = vi.fn();
    render(<AudioRecorder onReady={onReady} />);
    const handle = onReady.mock.calls[0]![0] as AudioRecorderHandle;

    expect(handle.getStatus()).toBe('idle');
    const recorder = await pressRecord();
    expect(handle.getStatus()).toBe('recording');

    await act(async () => {
      fireEvent.click(stopButton());
    });
    expect(handle.getStatus()).toBe('stopping');

    await act(async () => {
      recorder!.emitData();
      recorder!.emitStop();
    });
    expect(handle.getStatus()).toBe('idle');
  });

  it('does not rebuild anything when an inline callback identity changes', async () => {
    const { rerender } = render(<AudioRecorder onStart={() => {}} />);
    await pressRecord();

    rerender(<AudioRecorder onStart={() => {}} />);
    await act(async () => {});

    expect(FakeMediaRecorder.instances).toHaveLength(1);
    expect(stopButton()).toBeInTheDocument();
  });
});
