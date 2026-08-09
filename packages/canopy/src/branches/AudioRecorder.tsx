import * as React from 'react';
import { Button } from '../seeds/Button';
import { Spinner } from '../seeds/Spinner';
import { cn } from '../lib/cn';
import { useMediaQuery } from '../lib/useMediaQuery';

/**
 * AudioRecorder - the sound-capture Branch (spec 0072), the counterpart to `Audio` (0071): one
 * control that records the microphone and hands back a `Blob`.
 *
 * Three things about it are decisions rather than details.
 *
 * 1. **Nothing `MediaRecorder`-shaped reaches the published API.** `MediaRecorder` and
 *    `getUserMedia` are platform APIs, so unlike `Audio` there is no library to add - and that
 *    changes nothing about the encapsulation. A raw-options passthrough or an
 *    `onReady(mediaRecorder)` would publish a browser API whose support matrix is still moving,
 *    and every consumer reaching through it would bind to it. So the surface is Canopy's own
 *    ({@link AudioRecorderHandle}, {@link AudioRecording}, {@link RecordingError}), and a test
 *    asserts the BUILT `dist/branches/index.d.ts` carries no `MediaRecorder`-typed surface.
 *
 * 2. **It knows nothing about where the audio goes.** The component hands back a `Blob`, a
 *    `mimeType`, and a duration. Upload, storage, and URLs are the application's, per the "a
 *    shipped component must not bake in a consumer's transport" learning.
 *
 * 3. **Releasing the microphone is this component's `unload()`.** An un-stopped
 *    `MediaStreamTrack` keeps the browser's recording indicator lit AFTER the component is gone,
 *    with nothing visible left to switch it off - a privacy signal, not a stray noise. Every exit
 *    path (stop, cancel, the duration cap, an error, and unmount while recording) goes through
 *    `releaseCapture()`, and each one has its own test.
 *
 * It is a Branch on both counts that decide tier (learning 31): it owns browser engine instances
 * and their lifecycle, and it owns real interaction state.
 */

/* --------------------------------------------------------------------------------- constants */

/**
 * The container preference order. Opus in WebM where it exists, `audio/mp4` on Safari (which does
 * not do WebM at all), then bare WebM. First supported entry wins.
 */
const DEFAULT_MIME_TYPES = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'];

/** Ten minutes. Long enough for a voice note, short enough to bound an accidental open mic. */
const DEFAULT_MAX_DURATION_SECONDS = 600;

/** Bars in the waveform. Forty-eight elements at ~30fps is comfortably within budget. */
const DEFAULT_BAR_COUNT = 48;

/**
 * The analyser window. 1024 samples is ~21ms at 48kHz - short enough that the bars track speech
 * rather than smearing it, long enough to divide cleanly across the default bar count.
 */
const ANALYSER_FFT_SIZE = 1024;

/**
 * How often the elapsed clock re-reads the monotonic start time. Four times a second: fast enough
 * that the seconds digit never visibly lags, slow enough to be free.
 */
const CLOCK_INTERVAL_MS = 250;

/**
 * How often the live region repeats the elapsed time while recording. Announcing every second
 * turns a screen reader into a metronome.
 */
const ANNOUNCE_INTERVAL_MS = 10_000;

/** The level meter's update cadence under `prefers-reduced-motion`, in place of every frame. */
const REDUCED_MOTION_INTERVAL_MS = 250;

/** How much of a new reading the reduced-motion meter takes, so it eases rather than snaps. */
const REDUCED_MOTION_SMOOTHING = 0.4;

/**
 * The resting height of a bar, as a fraction. A zero-height bar disappears, and a waveform that
 * vanishes in silence is indistinguishable from one that is broken.
 */
const MIN_BAR_LEVEL = 0.08;

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * The record/stop control. Circular like `Audio`'s transport, and the focus-ring offset matches the
 * card it is drawn on rather than the page canvas - Button's own token is
 * `focus-visible:ring-offset-ring-offset`, and tailwind-merge keys on variant + property, so the
 * override MUST carry the `focus-visible:` prefix or both survive and the override loses exactly
 * when it is needed (learning 43).
 */
const CONTROL_BUTTON_CLASS = 'rounded-full focus-visible:ring-offset-surface-raised';

/**
 * The control while the permission prompt is open. Button's disabled treatment swaps in the
 * `bg-disabled` pair, which would bleach the spinner into near-invisibility - the one element whose
 * whole job is to say something is happening. `cursor-wait` rather than not-allowed: this state
 * resolves itself as soon as the reader answers the browser.
 */
const CONTROL_BUTTON_WAITING_CLASS =
  'rounded-full focus-visible:ring-offset-surface-raised disabled:bg-primary disabled:text-primary-foreground disabled:cursor-wait';

/**
 * Cancel. `ghost` so the dominant control stays dominant, with the raised-surface highlight:
 * Button's `hover:bg-muted` is one step up from the page canvas, which on this card is a step DOWN
 * in dark - the button would sink into a recess instead of lifting (learnings 20, 21, 43).
 */
const CANCEL_BUTTON_CLASS =
  'rounded-full focus-visible:ring-offset-surface-raised hover:bg-muted-raised active:bg-muted-raised';

/**
 * The waveform bars, as FULL LITERAL token utilities rather than a canvas.
 *
 * A canvas would be cheaper at high bar counts and would have to read the token values back out of
 * computed styles at runtime, then re-read them on a theme change - which is how a component ends
 * up with a waveform that stays light-mode blue after the page goes dark. Ordinary elements theme
 * like everything else, and the consumer's existing `@source` already emits these classes
 * (learning 8: the scanner only sees literals, so these are never interpolated).
 */
const BAR_IDLE_CLASS = 'flex-1 rounded-full bg-border';
const BAR_ACTIVE_CLASS = 'flex-1 rounded-full bg-primary';
const METER_FILL_IDLE_CLASS = 'h-full rounded-full bg-border';
const METER_FILL_ACTIVE_CLASS = 'h-full rounded-full bg-primary';

/* ------------------------------------------------------------------------------------- types */

/**
 * The recorder's state. Each one has copy and none of them is a spinner that never resolves.
 *
 * - `idle`              - nothing captured, the control is live.
 * - `requesting`        - the browser's permission prompt is open. Reached only by pressing record.
 * - `recording`         - capturing. The waveform and the clock run.
 * - `stopping`          - `stop()` has been asked for and the last data has not arrived yet.
 * - `permission-denied` - the microphone was refused. A denied microphone cannot be re-prompted
 *                         from inside the page, so the control is disabled rather than hidden.
 * - `unsupported`       - no `MediaRecorder`, no `getUserMedia`, or no container the browser
 *                         supports from `mimeTypes`.
 * - `device-error`      - the microphone failed. Recoverable, so the control stays live.
 */
export type AudioRecorderStatus =
  | 'idle'
  | 'requesting'
  | 'recording'
  | 'stopping'
  | 'permission-denied'
  | 'unsupported'
  | 'device-error';

/**
 * A finished take. `durationMs` is measured by the component from a monotonic clock, NOT read back
 * from the blob: WebM out of `MediaRecorder` routinely carries no duration in its metadata (it is a
 * live stream with no known end), so `new Audio(url).duration` returns `Infinity` often enough to
 * be a bug rather than an edge case.
 *
 * `mimeType` is the container that was actually used, which a consumer storing the blob needs and
 * cannot infer.
 */
export interface AudioRecording {
  /** The recorded audio. */
  blob: Blob;
  /** The container the browser recorded into, chosen from `mimeTypes` in order. */
  mimeType: string;
  /** How long the recording ran, in milliseconds, measured by the component. */
  durationMs: number;
}

/**
 * The control surface handed to `onReady` - Canopy's OWN, deliberately not the browser's recorder.
 *
 * Every method here is expressible on any capture engine, so the contract survives a change of
 * implementation. It is intentionally SMALL: pause/resume, device selection, and gain are
 * first-class props when something wants them, not a hole punched through to the platform.
 */
export interface AudioRecorderHandle {
  /** Request the microphone (if needed) and start recording. */
  start(): void;
  /** Stop and complete the take: `onStop` then `onComplete`. */
  stop(): void;
  /** Stop and discard the take: `onCancel`, and no `onComplete`. */
  cancel(): void;
  /** Whether audio is being captured right now. */
  isRecording(): boolean;
  /** Elapsed milliseconds of the take in progress, or of the last completed one. */
  getDurationMs(): number;
}

/**
 * A recording failure, following the `SubscribeError` / `AudioLoadError` precedent: a real `Error`
 * (so it reads normally when logged or thrown) carrying a machine-readable `reason` beside the
 * human `message`.
 *
 * - `permission`  - the reader refused the microphone, or the page is not allowed to ask.
 * - `unsupported` - the browser cannot record, or supports none of the requested containers.
 * - `device`      - there is no usable microphone, or it failed mid-recording.
 * - `engine`      - the recorder itself would not start.
 *
 * `reason` is the engine-independent part, which is the point: a consumer branches on it without
 * knowing what captured the audio.
 */
export interface RecordingError extends Error {
  reason: 'permission' | 'unsupported' | 'device' | 'engine';
}

export interface AudioRecorderProps
  // The native `onError` is a media/resource error handler with a different signature, and our
  // prop of the same name means something else. Per learning 15 the component's own meaning wins,
  // so the native one is omitted rather than silently conflicting.
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onError'> {
  /**
   * The recording finished. The component hands back a `Blob` and knows nothing about what happens
   * next - no upload, no URL, no transport. That is the application's, not the design system's.
   */
  onComplete?: (recording: AudioRecording) => void;
  /** Recording started - the microphone was granted and capture is running. */
  onStart?: () => void;
  /** Recording stopped and is being kept. Fires immediately before `onComplete`. */
  onStop?: () => void;
  /** Recording was discarded. `onComplete` does not fire. */
  onCancel?: () => void;
  /** Something failed. The {@link RecordingError} carries an engine-independent `reason`. */
  onError?: (error: RecordingError) => void;
  /**
   * Called once on mount with Canopy's own {@link AudioRecorderHandle}, so a consumer can drive the
   * recorder from its own chrome. It does NOT request the microphone - nothing does until record
   * is pressed or `handle.start()` is called.
   */
  onReady?: (recorder: AudioRecorderHandle) => void;
  /**
   * Stop automatically after this many seconds and complete normally (not an error). Default `600`.
   */
  maxDurationSeconds?: number;
  /**
   * Container preference order, first supported entry wins. Default
   * `['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm']` - Safari does not do WebM, so the mp4
   * entry is what makes it record at all. With none of them supported the recorder renders its
   * unsupported state rather than throwing.
   */
  mimeTypes?: string[];
  /** Show the live waveform. Default `true`. */
  showWaveform?: boolean;
  /** How many bars the waveform draws. Default `48`. */
  barCount?: number;
  /** Accessible name of the control while idle. Default `'Record'`. */
  startLabel?: string;
  /** Accessible name of the control while recording. Default `'Stop recording'`. */
  stopLabel?: string;
  /** Accessible name of the discard control. Default `'Discard recording'`. */
  cancelLabel?: string;
  /** Announced when recording starts, and with the elapsed time thereafter. Default `'Recording'`. */
  recordingLabel?: string;
  /**
   * Accessible name of the control, and the announcement, while the browser's permission prompt is
   * open. Default `'Waiting for microphone access'`.
   */
  requestingLabel?: string;
  /** Announced when a take is kept. Default `'Recording stopped'`. */
  stoppedLabel?: string;
  /** Announced when a take is discarded. Default `'Recording discarded'`. */
  cancelledLabel?: string;
  /**
   * Shown and announced when the microphone is refused. The default deliberately does not name a
   * browser or draw a menu path - that copy is wrong within a release, and it is yours to write.
   */
  permissionDeniedLabel?: string;
  /** Shown when the browser cannot record at all. */
  unsupportedLabel?: string;
  /** Shown when the microphone itself fails. */
  deviceErrorLabel?: string;
}

/* ----------------------------------------------------------------------------------- helpers */

/**
 * Format elapsed milliseconds as `m:ss`, widening to `h:mm:ss` only past the hour - so a two-minute
 * note is not padded out to `0:02:15`.
 */
export function formatElapsed(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '0:00';
  const total = Math.floor(ms / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (value: number) => String(value).padStart(2, '0');
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  return `${minutes}:${pad(seconds)}`;
}

/**
 * The analyser writes into a byte view backed by a plain `ArrayBuffer`; TypeScript's DOM lib
 * narrows `getByteTimeDomainData` to exactly that, so the alias keeps the ref and the helper in
 * agreement rather than casting at the call site.
 */
type SampleBuffer = Uint8Array<ArrayBuffer>;

type MediaRecorderCtor = typeof MediaRecorder;
type AudioContextCtor = typeof AudioContext;

/**
 * Read the platform constructors off `window` rather than referencing the bare globals: they are
 * absent under SSR and in jsdom, where a bare reference is a `ReferenceError` rather than
 * `undefined`.
 */
function getMediaRecorderCtor(): MediaRecorderCtor | null {
  if (typeof window === 'undefined') return null;
  const ctor = (window as Window & { MediaRecorder?: MediaRecorderCtor }).MediaRecorder;
  return typeof ctor === 'function' ? ctor : null;
}

function getAudioContextCtor(): AudioContextCtor | null {
  if (typeof window === 'undefined') return null;
  const scope = window as Window & {
    AudioContext?: AudioContextCtor;
    webkitAudioContext?: AudioContextCtor;
  };
  const ctor = scope.AudioContext ?? scope.webkitAudioContext;
  return typeof ctor === 'function' ? ctor : null;
}

/** Whether the browser can be asked for a microphone at all. Asking is a separate step. */
export function canCaptureMicrophone(): boolean {
  if (typeof navigator === 'undefined') return false;
  return typeof navigator.mediaDevices?.getUserMedia === 'function';
}

/**
 * Walk the preference order and take the first container the browser supports. A browser with a
 * `MediaRecorder` but no `isTypeSupported` (an old implementation) gets the first candidate rather
 * than nothing, since there is no way to ask it.
 */
export function pickMimeType(candidates: readonly string[]): string | null {
  const ctor = getMediaRecorderCtor();
  if (!ctor) return null;
  if (typeof ctor.isTypeSupported !== 'function') return candidates[0] ?? null;
  for (const candidate of candidates) {
    if (ctor.isTypeSupported(candidate)) return candidate;
  }
  return null;
}

/** Build a {@link RecordingError}: a real `Error` plus the machine-readable, engine-free `reason`. */
function makeRecordingError(
  reason: RecordingError['reason'],
  message: string,
  cause?: unknown,
): RecordingError {
  const error = new Error(message) as RecordingError;
  error.reason = reason;
  if (cause !== undefined) error.cause = cause;
  return error;
}

/**
 * Classify a `getUserMedia` rejection. Only a refusal (or a page that is not allowed to ask) is a
 * permission problem; everything else - no device, a device held by another app, an impossible
 * constraint - is the device.
 */
function reasonFromCaptureError(cause: unknown): 'permission' | 'device' {
  const name = (cause as { name?: string } | null | undefined)?.name;
  if (name === 'NotAllowedError' || name === 'SecurityError' || name === 'PermissionDeniedError') {
    return 'permission';
  }
  return 'device';
}

/**
 * Reduce one window of time-domain samples to a level per bar: the peak deviation from the 128
 * midpoint, normalised to 0..1. Peak rather than mean, because a mean over a waveform that swings
 * either side of the midpoint tends to zero and the bars barely move.
 *
 * With `bars === 1` this is the reduced-motion level meter: one peak over the whole window.
 */
function readLevels(analyser: AnalyserNode, buffer: SampleBuffer, bars: number): number[] {
  analyser.getByteTimeDomainData(buffer);
  const perBar = Math.max(1, Math.floor(buffer.length / bars));
  const levels: number[] = [];
  for (let bar = 0; bar < bars; bar += 1) {
    const start = bar * perBar;
    const end = Math.min(start + perBar, buffer.length);
    let peak = 0;
    for (let index = start; index < end; index += 1) {
      const deviation = Math.abs((buffer[index] ?? 128) - 128) / 128;
      if (deviation > peak) peak = deviation;
    }
    levels.push(Math.min(1, peak));
  }
  return levels;
}

/* -------------------------------------------------------------------------------------- icons */

/**
 * Drawn inline rather than pulled from `@rogueoak/icons` - Canopy components draw their own glyphs,
 * so the library keeps no icon dependency. Each is `aria-hidden`; the accessible name lives on the
 * enclosing button, never inside the hidden subtree (learning 30).
 */
const GLYPH_CLASS = 'h-4 w-4';

function RecordGlyph() {
  return (
    <svg className={GLYPH_CLASS} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="12" r="7" />
    </svg>
  );
}

function StopGlyph() {
  return (
    <svg className={GLYPH_CLASS} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

function DiscardGlyph() {
  return (
    <svg
      className={GLYPH_CLASS}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

/* ----------------------------------------------------------------------------------- component */

const AudioRecorder = React.forwardRef<HTMLDivElement, AudioRecorderProps>(
  function AudioRecorder(props, ref) {
    const {
      onComplete,
      onStart,
      onStop,
      onCancel,
      onError,
      onReady,
      maxDurationSeconds = DEFAULT_MAX_DURATION_SECONDS,
      mimeTypes = DEFAULT_MIME_TYPES,
      showWaveform = true,
      barCount = DEFAULT_BAR_COUNT,
      startLabel = 'Record',
      stopLabel = 'Stop recording',
      cancelLabel = 'Discard recording',
      recordingLabel = 'Recording',
      requestingLabel = 'Waiting for microphone access',
      stoppedLabel = 'Recording stopped',
      cancelledLabel = 'Recording discarded',
      permissionDeniedLabel = 'Your browser is blocking the microphone. Allow it for this site to record.',
      unsupportedLabel = 'Recording is not supported in this browser.',
      deviceErrorLabel = 'The microphone is unavailable. Check that one is connected and not already in use.',
      className,
      onKeyDown,
      ...rest
    } = props;

    const reducedMotion = useMediaQuery(REDUCED_MOTION_QUERY);

    const [status, setStatus] = React.useState<AudioRecorderStatus>('idle');
    const [elapsedMs, setElapsedMs] = React.useState(0);
    const [levels, setLevels] = React.useState<number[]>([]);
    const [announcement, setAnnouncement] = React.useState('');

    // Every callback below reads its inputs from here rather than closing over them, so each one
    // has empty deps and a stable identity - an inline arrow handler must not tear down a
    // recording in flight. Assigned during render, the way `Audio` keeps its options current.
    const config = {
      maxDurationSeconds,
      mimeTypes,
      showWaveform,
      barCount,
      reducedMotion,
      onComplete,
      onStart,
      onStop,
      onCancel,
      onError,
      onReady,
      recordingLabel,
      requestingLabel,
      stoppedLabel,
      cancelledLabel,
      permissionDeniedLabel,
      unsupportedLabel,
      deviceErrorLabel,
    };
    const configRef = React.useRef(config);
    configRef.current = config;

    // `status` is mirrored into a ref because the handlers ACT on it. React state lags a render
    // behind, and two presses inside that window would both pass a state-based guard and open two
    // microphone requests - the same shape as `Audio`'s double-play bug (learning 47).
    const statusRef = React.useRef<AudioRecorderStatus>('idle');
    const streamRef = React.useRef<MediaStream | null>(null);
    const recorderRef = React.useRef<MediaRecorder | null>(null);
    const contextRef = React.useRef<AudioContext | null>(null);
    const analyserRef = React.useRef<AnalyserNode | null>(null);
    const bufferRef = React.useRef<SampleBuffer | null>(null);
    const chunksRef = React.useRef<Blob[]>([]);
    const mimeTypeRef = React.useRef('');
    const startedAtRef = React.useRef(0);
    const durationRef = React.useRef(0);
    const outcomeRef = React.useRef<'stop' | 'cancel'>('stop');
    const frameRef = React.useRef<number | null>(null);
    const clockRef = React.useRef<number | null>(null);
    const maxTimerRef = React.useRef<number | null>(null);
    const levelAtRef = React.useRef(0);
    const announcedAtRef = React.useRef(0);
    const unmountedRef = React.useRef(false);

    const applyStatus = React.useCallback((next: AudioRecorderStatus) => {
      statusRef.current = next;
      setStatus(next);
    }, []);

    /* ------------------------------------------------------------------------- the timers */

    const stopWaveform = React.useCallback(() => {
      if (frameRef.current === null) return;
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }, []);

    const stopClock = React.useCallback(() => {
      if (clockRef.current === null) return;
      window.clearInterval(clockRef.current);
      clockRef.current = null;
    }, []);

    const clearMaxTimer = React.useCallback(() => {
      if (maxTimerRef.current === null) return;
      window.clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }, []);

    // The loop exists ONLY while recording. An always-on `requestAnimationFrame` burns a frame
    // callback forever on a page that embeds three recorders, and there is nothing to draw when
    // nothing is being captured.
    const startWaveform = React.useCallback(() => {
      stopWaveform();
      const tick = () => {
        const analyser = analyserRef.current;
        const buffer = bufferRef.current;
        // The analyser is gone (released mid-frame), so the loop ends here rather than re-arming.
        if (!analyser || !buffer) return;

        const slow = configRef.current.reducedMotion;
        const now = performance.now();
        const due = !slow || now - levelAtRef.current >= REDUCED_MOTION_INTERVAL_MS;
        if (due) {
          levelAtRef.current = now;
          const bars = slow ? 1 : Math.max(1, Math.floor(configRef.current.barCount));
          const next = readLevels(analyser, buffer, bars);
          // Under reduced motion the meter eases toward each new reading instead of jumping, which
          // is the whole accommodation: it still says the microphone is hearing you, calmly.
          setLevels((previous) => {
            if (!slow) return next;
            const target = next[0] ?? 0;
            const current = previous[0] ?? 0;
            return [current + (target - current) * REDUCED_MOTION_SMOOTHING];
          });
        }
        frameRef.current = requestAnimationFrame(tick);
      };
      frameRef.current = requestAnimationFrame(tick);
    }, [stopWaveform]);

    const startClock = React.useCallback(() => {
      stopClock();
      clockRef.current = window.setInterval(() => {
        setElapsedMs(Math.max(0, performance.now() - startedAtRef.current));
      }, CLOCK_INTERVAL_MS);
    }, [stopClock]);

    /* ---------------------------------------------------------------------------- teardown */

    /**
     * The one exit path. Stop, cancel, the duration cap, an error, and unmount all end here,
     * because an un-stopped track leaves the browser's recording indicator lit after the component
     * is gone and there is nothing left on the page to switch it off.
     */
    const releaseCapture = React.useCallback(() => {
      stopWaveform();
      stopClock();
      clearMaxTimer();

      const recorder = recorderRef.current;
      recorderRef.current = null;
      if (recorder) {
        // Detach BEFORE stopping: a stop can emit, and these handlers set state for a recording
        // that no longer exists.
        recorder.ondataavailable = null;
        recorder.onstop = null;
        recorder.onerror = null;
        if (recorder.state !== 'inactive') {
          try {
            recorder.stop();
          } catch {
            // Already finished; nothing to unwind.
          }
        }
      }

      const stream = streamRef.current;
      streamRef.current = null;
      if (stream) {
        for (const track of stream.getTracks()) track.stop();
      }

      const context = contextRef.current;
      contextRef.current = null;
      analyserRef.current = null;
      bufferRef.current = null;
      if (context && context.state !== 'closed') {
        void Promise.resolve(context.close()).catch(() => {
          // A context that refuses to close is not something the reader can act on.
        });
      }
    }, [clearMaxTimer, stopClock, stopWaveform]);

    /* ----------------------------------------------------------------- the recording flow */

    // `beginRecording` arms the recorder's handlers, which have to call back into functions
    // defined after it. Late-bound through refs, the way `Audio` late-binds its clamped seek.
    const finishRecordingRef = React.useRef<() => void>(() => {});
    const failRecordingRef = React.useRef<(cause: unknown) => void>(() => {});
    const requestStopRef = React.useRef<(outcome: 'stop' | 'cancel') => void>(() => {});
    const beginRecordingRef = React.useRef<() => void>(() => {});

    /**
     * Open an `AnalyserNode` over the live stream for the waveform. Deliberately NOT connected to
     * `context.destination`: routing the microphone back to the speakers is a feedback loop.
     *
     * A failure here is swallowed on purpose. The waveform is decoration; the recording is the
     * point, and a browser that will not give out an `AudioContext` should still capture audio.
     */
    const attachAnalyser = React.useCallback((stream: MediaStream) => {
      const Ctor = getAudioContextCtor();
      if (!Ctor) return;
      try {
        const context = new Ctor();
        const source = context.createMediaStreamSource(stream);
        const analyser = context.createAnalyser();
        analyser.fftSize = ANALYSER_FFT_SIZE;
        source.connect(analyser);
        contextRef.current = context;
        analyserRef.current = analyser;
        bufferRef.current = new Uint8Array(analyser.fftSize);
        // Safari hands back a suspended context outside a gesture; a suspended analyser reads
        // silence forever, which looks exactly like a dead microphone.
        if (context.state === 'suspended') {
          void Promise.resolve(context.resume()).catch(() => {});
        }
      } catch {
        // No waveform. The recording continues.
      }
    }, []);

    const beginRecording = React.useCallback(async () => {
      const cfg = configRef.current;
      const current = statusRef.current;
      if (current === 'requesting' || current === 'recording' || current === 'stopping') return;
      // A denied microphone cannot be re-prompted from inside the page, so pressing again would
      // do nothing at all and look broken.
      if (current === 'permission-denied' || current === 'unsupported') return;

      const Ctor = getMediaRecorderCtor();
      const mimeType = pickMimeType(cfg.mimeTypes);
      if (!Ctor || !canCaptureMicrophone() || mimeType === null) {
        applyStatus('unsupported');
        setAnnouncement(cfg.unsupportedLabel);
        cfg.onError?.(makeRecordingError('unsupported', 'This browser cannot record audio.'));
        return;
      }

      // The permission prompt happens HERE, in the record handler. On mount it would fire at
      // someone who has not asked to record anything, which is alarming and denied by reflex.
      applyStatus('requesting');
      setAnnouncement(cfg.requestingLabel);

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (cause) {
        const reason = reasonFromCaptureError(cause);
        if (reason === 'permission') {
          applyStatus('permission-denied');
          setAnnouncement(cfg.permissionDeniedLabel);
        } else {
          applyStatus('device-error');
          setAnnouncement(cfg.deviceErrorLabel);
        }
        cfg.onError?.(makeRecordingError(reason, 'The microphone could not be opened.', cause));
        return;
      }

      // The reader may have answered the prompt after the component went away. Nothing will render
      // the stream, and nothing else will ever stop it.
      if (unmountedRef.current || statusRef.current !== 'requesting') {
        for (const track of stream.getTracks()) track.stop();
        return;
      }

      let recorder: MediaRecorder;
      try {
        recorder = new Ctor(stream, { mimeType });
      } catch (cause) {
        for (const track of stream.getTracks()) track.stop();
        applyStatus('device-error');
        setAnnouncement(cfg.deviceErrorLabel);
        cfg.onError?.(makeRecordingError('engine', 'The recorder could not be created.', cause));
        return;
      }

      streamRef.current = stream;
      recorderRef.current = recorder;
      mimeTypeRef.current = mimeType;
      chunksRef.current = [];
      outcomeRef.current = 'stop';
      durationRef.current = 0;
      announcedAtRef.current = 0;
      // Never sampled, so the reduced-motion meter draws on the FIRST frame rather than sitting at
      // rest for a quarter of a second while the reader wonders whether it is working.
      levelAtRef.current = Number.NEGATIVE_INFINITY;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => finishRecordingRef.current();
      recorder.onerror = (event) => failRecordingRef.current(event);

      if (cfg.showWaveform) attachAnalyser(stream);

      startedAtRef.current = performance.now();
      setElapsedMs(0);
      setLevels([]);

      try {
        recorder.start();
      } catch (cause) {
        releaseCapture();
        applyStatus('device-error');
        setAnnouncement(cfg.deviceErrorLabel);
        cfg.onError?.(makeRecordingError('engine', 'The recorder could not be started.', cause));
        return;
      }

      applyStatus('recording');
      setAnnouncement(cfg.recordingLabel);
      startClock();
      if (cfg.showWaveform) startWaveform();
      // The cap completes the take normally rather than erroring - running out of time is not a
      // failure, and a two-minute note that vanishes at the limit would be.
      maxTimerRef.current = window.setTimeout(
        () => requestStopRef.current('stop'),
        Math.max(1, cfg.maxDurationSeconds) * 1000,
      );
      cfg.onStart?.();
    }, [applyStatus, attachAnalyser, releaseCapture, startClock, startWaveform]);

    /**
     * Ask the recorder to finish. The take is completed in `finishRecording`, once the engine has
     * handed over its last chunk - stopping here would truncate it.
     */
    const requestStop = React.useCallback(
      (outcome: 'stop' | 'cancel') => {
        if (statusRef.current !== 'recording') return;
        outcomeRef.current = outcome;
        // Measured at the moment stop was ASKED for, so the engine's own finalisation latency does
        // not inflate the reported duration.
        durationRef.current = Math.max(0, performance.now() - startedAtRef.current);
        applyStatus('stopping');
        stopWaveform();
        stopClock();
        clearMaxTimer();

        const recorder = recorderRef.current;
        if (!recorder) {
          finishRecordingRef.current();
          return;
        }
        try {
          recorder.stop();
        } catch (cause) {
          failRecordingRef.current(cause);
        }
      },
      [applyStatus, clearMaxTimer, stopClock, stopWaveform],
    );

    const finishRecording = React.useCallback(() => {
      const cfg = configRef.current;
      const outcome = outcomeRef.current;
      const chunks = chunksRef.current;
      const mimeType = mimeTypeRef.current;
      const durationMs = durationRef.current;
      chunksRef.current = [];

      releaseCapture();
      applyStatus('idle');
      setLevels([]);

      if (outcome === 'cancel') {
        durationRef.current = 0;
        setElapsedMs(0);
        setAnnouncement(cfg.cancelledLabel);
        cfg.onCancel?.();
        return;
      }

      setElapsedMs(durationMs);
      setAnnouncement(`${cfg.stoppedLabel} ${formatElapsed(durationMs)}`);
      cfg.onStop?.();
      cfg.onComplete?.({ blob: new Blob(chunks, { type: mimeType }), mimeType, durationMs });
    }, [applyStatus, releaseCapture]);

    const failRecording = React.useCallback(
      (cause: unknown) => {
        const cfg = configRef.current;
        chunksRef.current = [];
        durationRef.current = 0;
        releaseCapture();
        applyStatus('device-error');
        setLevels([]);
        setElapsedMs(0);
        setAnnouncement(cfg.deviceErrorLabel);
        cfg.onError?.(makeRecordingError('device', 'The recording stopped unexpectedly.', cause));
      },
      [applyStatus, releaseCapture],
    );

    beginRecordingRef.current = () => void beginRecording();
    requestStopRef.current = requestStop;
    finishRecordingRef.current = finishRecording;
    failRecordingRef.current = failRecording;

    /* -------------------------------------------------------------------------- lifecycle */

    // Support is read after mount, never during render: the platform constructors do not exist on
    // the server, so a render-time check would disagree with the client and break hydration.
    // Keyed on the mime VALUES - an inline `mimeTypes={[...]}` is a new array every render.
    const mimeKey = mimeTypes.join('|');
    React.useEffect(() => {
      const supported =
        canCaptureMicrophone() && pickMimeType(configRef.current.mimeTypes) !== null;
      if (!supported) {
        applyStatus('unsupported');
        return;
      }
      if (statusRef.current === 'unsupported') applyStatus('idle');
    }, [mimeKey, applyStatus]);

    // Canopy's own control surface, NOT an engine instance. Stable for the component's lifetime so
    // a consumer can hold onto it; every method reads current state through a ref.
    const handle = React.useMemo<AudioRecorderHandle>(
      () => ({
        start: () => beginRecordingRef.current(),
        stop: () => requestStopRef.current('stop'),
        cancel: () => requestStopRef.current('cancel'),
        isRecording: () => statusRef.current === 'recording',
        getDurationMs: () => {
          if (statusRef.current === 'recording') {
            return Math.max(0, performance.now() - startedAtRef.current);
          }
          return durationRef.current;
        },
      }),
      [],
    );

    React.useEffect(() => {
      configRef.current.onReady?.(handle);
    }, [handle]);

    React.useEffect(
      () => () => {
        unmountedRef.current = true;
        releaseCapture();
      },
      [releaseCapture],
    );

    // The elapsed announcement is throttled here rather than inside the clock, so the timer stays
    // a timer and the ten-second rule is one readable condition.
    React.useEffect(() => {
      if (status !== 'recording') return;
      if (elapsedMs - announcedAtRef.current < ANNOUNCE_INTERVAL_MS) return;
      announcedAtRef.current = elapsedMs;
      setAnnouncement(`${recordingLabel} ${formatElapsed(elapsedMs)}`);
    }, [elapsedMs, recordingLabel, status]);

    /* ----------------------------------------------------------------------------- handlers */

    const handleControlClick = () => {
      // Ask the ref, not the state: see the note on `statusRef`.
      if (statusRef.current === 'recording') {
        requestStop('stop');
        return;
      }
      void beginRecording();
    };

    const handleCancelClick = () => requestStop('cancel');

    // Scoped to this component's subtree rather than the document: a global Escape listener would
    // fire for a page that is using Escape for something else entirely.
    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented || event.key !== 'Escape') return;
      if (statusRef.current !== 'recording') return;
      event.preventDefault();
      requestStop('cancel');
    };

    /* ------------------------------------------------------------------------------- render */

    const recording = status === 'recording';
    const stopping = status === 'stopping';
    const requesting = status === 'requesting';
    const active = recording || stopping;

    let controlLabel = startLabel;
    if (requesting) controlLabel = requestingLabel;
    if (active) controlLabel = stopLabel;

    let controlGlyph = <RecordGlyph />;
    if (active) controlGlyph = <StopGlyph />;
    // `aria-hidden` because the button already carries the waiting label: Spinner's own
    // `role="status"` would otherwise announce a second, competing message (learning 30).
    if (requesting) controlGlyph = <Spinner size="sm" aria-hidden="true" />;

    let controlClass = CONTROL_BUTTON_CLASS;
    if (requesting) controlClass = CONTROL_BUTTON_WAITING_CLASS;

    const controlDisabled =
      requesting || stopping || status === 'permission-denied' || status === 'unsupported';

    let message = '';
    if (status === 'permission-denied') message = permissionDeniedLabel;
    if (status === 'unsupported') message = unsupportedLabel;
    if (status === 'device-error') message = deviceErrorLabel;

    // ONE live region, always mounted, which is both the visible failure message and the polite
    // announcer. Two regions - a visible message plus an `sr-only` echo of it - would put the same
    // words in the accessibility tree twice, and a region that only mounts when it has something
    // to say is announced unreliably. While there is nothing to show it is `sr-only`, which is
    // `position: absolute` and so takes no space in the flex column.
    const statusText = message || announcement;
    let statusClass = 'sr-only';
    if (message) statusClass = 'text-caption text-danger';

    let cancelButton: React.ReactNode = null;
    if (recording) {
      cancelButton = (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={CANCEL_BUTTON_CLASS}
          aria-label={cancelLabel}
          onClick={handleCancelClick}
        >
          <DiscardGlyph />
        </Button>
      );
    }

    // The waveform is DECORATION: `aria-hidden` on the wrapper, nothing focusable inside it, and no
    // `sr-only` text nested within it - an `aria-hidden` ancestor prunes the whole subtree, so a
    // label in there would reach nobody (learning 30). The information lives in the clock and the
    // live region, both outside it.
    let waveform: React.ReactNode = null;
    if (showWaveform && reducedMotion) {
      // Reduced motion REDUCES the waveform rather than removing it. Deleting it would delete the
      // one signal that a muted microphone is muted, which is the reason it exists.
      let fillClass = METER_FILL_IDLE_CLASS;
      if (active) fillClass = METER_FILL_ACTIVE_CLASS;
      const meterLevel = Math.max(MIN_BAR_LEVEL, levels[0] ?? 0);
      waveform = (
        <div aria-hidden="true" className="h-2 flex-1 overflow-hidden rounded-full bg-muted-raised">
          <div className={fillClass} style={{ width: `${Math.round(meterLevel * 100)}%` }} />
        </div>
      );
    } else if (showWaveform) {
      let barClass = BAR_IDLE_CLASS;
      if (active) barClass = BAR_ACTIVE_CLASS;
      const bars = Math.max(1, Math.floor(barCount));
      waveform = (
        <div aria-hidden="true" className="flex h-10 flex-1 items-center gap-0.5">
          {Array.from({ length: bars }, (_unused, index) => {
            const level = Math.max(MIN_BAR_LEVEL, levels[index] ?? 0);
            return (
              <span
                key={index}
                className={barClass}
                style={{ height: `${Math.round(level * 100)}%` }}
              />
            );
          })}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          'flex w-full flex-col gap-2 rounded-lg border border-border bg-surface-raised p-4 text-text shadow-sm',
          className,
        )}
        onKeyDown={handleKeyDown}
        {...rest}
      >
        {/* Cancel sits beside the control it undoes, which keeps the clock pinned to the trailing
            edge instead of sliding sideways as cancel appears and disappears. */}
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="primary"
            size="icon"
            className={controlClass}
            aria-label={controlLabel}
            disabled={controlDisabled}
            onClick={handleControlClick}
          >
            {controlGlyph}
          </Button>
          {cancelButton}
          {waveform}
          <span className="text-caption text-text-muted tabular-nums">
            {formatElapsed(elapsedMs)}
          </span>
        </div>
        <p role="status" className={statusClass}>
          {statusText}
        </p>
      </div>
    );
  },
);

AudioRecorder.displayName = 'AudioRecorder';

export { AudioRecorder };
