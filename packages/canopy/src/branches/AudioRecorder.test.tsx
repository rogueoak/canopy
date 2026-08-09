import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AudioRecorder, canCaptureMicrophone, formatElapsed, pickMimeType } from './AudioRecorder';
import type { AudioRecorderHandle, AudioRecording, RecordingError } from './AudioRecorder';

/**
 * jsdom implements none of the three platform APIs this component drives - `MediaRecorder`,
 * `navigator.mediaDevices.getUserMedia`, and `AudioContext`. Per the "do not assert a third-party
 * library's browser internals in jsdom" learning, nothing below asserts what a browser would do
 * with them. What is asserted is the mapping Canopy owns: the states rendered, the handle's
 * behaviour, the `RecordingError.reason` produced, the tracks stopped, and the loop cancelled.
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

/** The waveform wrapper: the only `aria-hidden` element that is a direct child of the control row. */
function waveform(container: HTMLElement): HTMLElement | null {
  const row = container.firstElementChild?.firstElementChild;
  return row?.querySelector(':scope > [aria-hidden="true"]') ?? null;
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
    render(<AudioRecorder maxDurationSeconds={2} onComplete={onComplete} onError={onError} />);

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
    render(<AudioRecorder onError={onError} />);

    await pressRecord();

    expect(screen.getByText(/blocking the microphone/i)).toBeInTheDocument();
    const error = onError.mock.calls[0]![0] as RecordingError;
    expect(error).toBeInstanceOf(Error);
    expect(error.reason).toBe('permission');
  });

  it('leaves the control disabled rather than hidden', async () => {
    // A denied microphone cannot be re-prompted from inside the page, so an enabled button would
    // lie - and a hidden one would leave the reader staring at a component that vanished.
    denyPermission();
    render(<AudioRecorder />);

    await pressRecord();

    expect(recordButton()).toBeInTheDocument();
    expect(recordButton()).toBeDisabled();
  });

  it('does not re-prompt once refused', async () => {
    denyPermission();
    render(<AudioRecorder onReady={() => {}} />);
    await pressRecord();
    getUserMedia.mockClear();

    await act(async () => {
      fireEvent.click(recordButton());
    });

    expect(getUserMedia).not.toHaveBeenCalled();
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
    render(<AudioRecorder onError={onError} />);

    await pressRecord();

    expect((onError.mock.calls[0]![0] as RecordingError).reason).toBe('device');
    // Recoverable - plug a microphone in and press again.
    expect(recordButton()).toBeEnabled();
  });
});

describe('unsupported browser', () => {
  it('renders the unsupported state when no container is supported, and throws nothing', () => {
    FakeMediaRecorder.supported = [];

    expect(() => render(<AudioRecorder />)).not.toThrow();
    expect(screen.getByText(/not supported/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Record' })).toBeDisabled();
  });

  it('renders the unsupported state when the browser has no recorder', () => {
    vi.stubGlobal('MediaRecorder', undefined);

    render(<AudioRecorder />);

    expect(screen.getByRole('button', { name: 'Record' })).toBeDisabled();
  });

  it('renders the unsupported state when the browser cannot open a microphone', () => {
    Reflect.deleteProperty(navigator, 'mediaDevices');

    render(<AudioRecorder />);

    expect(screen.getByRole('button', { name: 'Record' })).toBeDisabled();
  });

  it('never asks for the microphone in the unsupported state', async () => {
    FakeMediaRecorder.supported = [];
    render(<AudioRecorder />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Record' }));
    });

    expect(getUserMedia).not.toHaveBeenCalled();
  });
});

describe('a device error mid-recording', () => {
  it('reports reason: device and stops cleanly', async () => {
    const onError = vi.fn();
    const onComplete = vi.fn();
    render(<AudioRecorder onError={onError} onComplete={onComplete} />);
    const recorder = await pressRecord();

    await act(async () => {
      recorder!.emitError();
    });

    const error = onError.mock.calls[0]![0] as RecordingError;
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
  });
});

/* ------------------------------------------------------------------------------ the waveform */

describe('the waveform', () => {
  it('draws one bar per `barCount`, as token-styled elements rather than a canvas', () => {
    const { container } = render(<AudioRecorder barCount={12} />);

    expect(container.querySelector('canvas')).toBeNull();
    expect(barHeights(container)).toHaveLength(12);
    expect(waveform(container)!.firstElementChild).toHaveClass('bg-border');
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
    act(() => {
      stepFrame();
    });
    const silent = barHeights(container);

    expect(Math.max(...loud)).toBeGreaterThan(50);
    expect(Math.max(...silent)).toBe(8);
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

  it('takes its copy from props throughout', async () => {
    render(<AudioRecorder startLabel="Start note" stopLabel="Finish note" cancelLabel="Bin it" />);

    expect(screen.getByRole('button', { name: 'Start note' })).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Start note' }));
    });
    expect(screen.getByRole('button', { name: 'Finish note' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bin it' })).toBeInTheDocument();
  });

  it('announces the transitions in a polite live region', async () => {
    render(<AudioRecorder />);

    await pressRecord();
    expect(liveRegion()).toHaveTextContent('Recording');

    await pressStop();
    expect(liveRegion()).toHaveTextContent('Recording stopped');
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
});

/* --------------------------------------------------------- the owned interface (spec 0072) */

describe("the public interface is Canopy's, not the platform's", () => {
  it('does not name the recording engine anywhere in the published types', () => {
    // THE swappability guard, and the reason `onReady` hands over a handle rather than a
    // `MediaRecorder`. Asserted against the BUILT artifact - that is what a consumer installs, and
    // a platform type leaks through inference without ever being written down in the source.
    // `test` depends on `build` in turbo.json, so this file is present and current.
    const declarations = readFileSync(resolve(__dirname, '../../dist/branches/index.d.ts'), 'utf8');
    // Comments are stripped first: the doc comments legitimately NAME the platform API when
    // explaining why it is not exposed, and prose is not a contract.
    const types = declarations.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

    // The presence half, per learning 57: a validity check passes vacuously on a surface that
    // dropped the thing it was guarding.
    expect(types).toContain('AudioRecorderHandle');
    expect(types).toContain('AudioRecording');
    expect(types).toContain('RecordingError');
    expect(types).toMatch(/blob:\s*Blob/);

    for (const platformType of [
      'MediaRecorder',
      'MediaRecorderOptions',
      'MediaStream',
      'MediaStreamTrack',
      'BlobEvent',
      'AudioContext',
      'AnalyserNode',
    ]) {
      expect(types).not.toContain(platformType);
    }
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

  it('does not rebuild anything when an inline callback identity changes', async () => {
    const { rerender } = render(<AudioRecorder onStart={() => {}} />);
    await pressRecord();

    rerender(<AudioRecorder onStart={() => {}} />);
    await act(async () => {});

    expect(FakeMediaRecorder.instances).toHaveLength(1);
    expect(stopButton()).toBeInTheDocument();
  });
});
