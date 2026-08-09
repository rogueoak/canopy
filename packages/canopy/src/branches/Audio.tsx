import * as React from 'react';
import type { Howl, HowlOptions } from 'howler';
import { Button } from '../seeds/Button';
import { Slider } from '../seeds/Slider';
import { Spinner } from '../seeds/Spinner';
import { cn } from '../lib/cn';

/**
 * Audio - the sound-player Branch (spec 0071), a basic player built on `howler.js`: play/pause,
 * skip back, skip forward, and a scrubbable progress bar.
 *
 * The important thing to understand here is how this DIFFERS from the Video branch (spec 0070).
 * video.js *is a UI* - it builds a control bar in the DOM - so Video's job was a SKIN: a
 * stylesheet (`@rogueoak/canopy/video.css`) restyling video.js's own `.vjs-*` classes, shipped as
 * a file because Tailwind's scanner can never see classes a third-party library emits at runtime.
 *
 * howler renders NOTHING. It is a pure playback engine (load, play, pause, seek, volume, events)
 * with no DOM and no CSS of its own, so the split inverts: howler owns playback, and Canopy owns
 * the ENTIRE UI. Every element below is an ordinary Canopy element - the `Button` and `Slider`
 * Seeds plus full-literal semantic-token utilities the consumer's existing `@source` already
 * emits. So there is NO stylesheet to ship and NO new consumer wiring: a consumer who has Canopy
 * set up gets this component for free, and it themes light/dark and re-themes under a brand
 * override through the same token seam as everything else.
 *
 * The flip side is that the accessibility is ours to own rather than inherited, which is why it
 * is deliberate below: labels derived from the intervals they act on, and `aria-valuetext` on the
 * scrub thumb as formatted time (a seek bar's raw `aria-valuenow` announces "one hundred forty
 * two" for 2:22).
 *
 * It lives in the Branches tier on both counts that decide tier (learning 31): it owns a
 * third-party library instance and its lifecycle, and it owns real interaction state.
 */

/* --------------------------------------------------------------------------------- constants */

/**
 * Scrub granularity, in seconds. Fine enough that a pointer drag feels continuous, coarse enough
 * that a keyboard arrow-key press moves a useful amount (Radix steps by `step` on arrow keys and
 * by 10% of the range on PageUp/PageDown).
 */
const SEEK_STEP_SECONDS = 1;

/** The Slider's `max` before the media has loaded, so the (disabled) track still has a range. */
const UNKNOWN_DURATION_MAX = 1;

/**
 * Shown for a duration that is not known yet. `0:00` would be a lie of a specific kind - it reads
 * as a zero-length clip rather than an unanswered question, and it is exactly what a reader sees
 * while a slow file loads or while a CORS-blocked one never will.
 */
const UNKNOWN_TIME = '--:--';

/**
 * The transport controls are circles. `size="icon"` is already square, so the shape is one
 * `rounded-full` - a FULL LITERAL, like every class Canopy ships, so Tailwind's scanner emits it
 * (learning 8). All three share it: a round play button flanked by two rounded-square skips would
 * read as two different control families rather than one transport group.
 *
 * The skips are `outline` rather than `ghost` so each reads as a button at rest instead of a bare
 * glyph that only reveals its hit area on hover. `primary` on play keeps the hierarchy - the
 * dominant action is filled, the secondary ones are outlined.
 *
 * The focus-ring offset is the first half of the RAISED-SURFACE correction. Button's defaults are
 * tuned for the page canvas, so its ring punches a `ring-offset-ring-offset` (page-coloured) halo -
 * near-black on this card in dark. The offset has to match the surface the ring is actually drawn
 * on (the `SideNav` precedent). It MUST carry the `focus-visible:` prefix: Button's own token is
 * `focus-visible:ring-offset-ring-offset`, and tailwind-merge treats a bare `ring-offset-*` as a
 * different key, so an unprefixed override would sit alongside it and lose exactly when it matters.
 */
const TRANSPORT_BUTTON_CLASS = 'rounded-full focus-visible:ring-offset-surface-raised';

/**
 * The second half of the correction, and it applies only to the OUTLINE skips - never to the
 * filled play button, which correctly keeps its own `primary-hover`.
 *
 * Button's `hover:bg-muted` is one step up from the page canvas (`bg-bg`). This player is a card
 * (`bg-surface-raised`), which per learnings 20 and 21 is its own design context: on it, the
 * page's "one step up" is a step DOWN, so hovering a skip button visibly sinks into a recess in
 * dark instead of lifting. `muted-raised` is the surface-relative highlight that actually lifts.
 *
 * Spelled out as a FULL LITERAL rather than interpolating the constant above, per learning 8.
 */
const SKIP_BUTTON_CLASS =
  'rounded-full focus-visible:ring-offset-surface-raised hover:bg-muted-raised active:bg-muted-raised';

/**
 * The play button while loading. It is `disabled` (a press would be dropped), but Button's disabled
 * treatment swaps in the `bg-disabled` pair - which would bleach the spinner into near-invisibility
 * on the card, hiding the one element whose whole job is to say "something is happening".
 *
 * So the loading state keeps the primary fill and only the spinner communicates the wait, which is
 * how a loading button conventionally reads. `cursor-wait` replaces the not-allowed cursor: this is
 * a temporary state that will resolve itself, not a refusal.
 */
const PLAY_BUTTON_LOADING_CLASS =
  'rounded-full focus-visible:ring-offset-surface-raised disabled:bg-primary disabled:text-primary-foreground disabled:cursor-wait';

/**
 * The player's load state. Media arrives asynchronously and can fail, and the two must not look
 * alike: with only a disabled/enabled distinction, "still fetching" and "this will never load" are
 * the same picture - inert controls - and a reader cannot tell a slow network from a broken URL.
 * That is not hypothetical here: howler's default Web Audio path fetches by XHR, so any
 * cross-origin file without CORS headers fails exactly this way.
 *
 * - `idle`    - `preload={false}`, nothing fetched yet. Play is live; pressing it starts the load.
 * - `loading` - fetching or decoding. The play button holds a spinner.
 * - `ready`   - duration known, every control live.
 * - `error`   - the media failed to load. Controls stay inert and the player SAYS so.
 */
export type AudioStatus = 'idle' | 'loading' | 'ready' | 'error';

/* --------------------------------------------------------------------------------------- types */

/**
 * The playback handle handed to `onReady` - Canopy's OWN control surface, deliberately not the
 * underlying engine's instance.
 *
 * This is the seam that keeps the engine swappable. Exposing howler's `Howl` (and its `HowlOptions`)
 * on the public props would make the engine part of the published API: every consumer reaching
 * through the escape hatch would bind to howler, and replacing it - with the native
 * `HTMLMediaElement`, or anything else - would become a breaking change for them, not an
 * implementation detail for us. Every method below is expressible on any playback engine, so the
 * contract survives that swap.
 *
 * It is intentionally SMALL. Anything a player might additionally do (rate, fades, sprites,
 * analytics) is a first-class prop when it is wanted, not a hole punched through to the engine.
 */
export interface AudioHandle {
  /** Start (or resume) playback. */
  play(): void;
  /** Pause, keeping the position. */
  pause(): void;
  /** Stop and return to the start. */
  stop(): void;
  /** Jump to a position in seconds, clamped to the media's length. */
  seek(seconds: number): void;
  /** Current position in seconds. */
  getPosition(): number;
  /** Total length in seconds, or `0` while it is still unknown. */
  getDuration(): number;
  /** Set the volume, 0 to 1. */
  setVolume(volume: number): void;
  /** Whether audio is playing right now. */
  isPlaying(): boolean;
}

/**
 * A load failure, following the `SubscribeError` precedent: a real `Error` (so it reads normally
 * when logged or thrown) carrying a machine-readable `reason` alongside the human `message`.
 *
 * - `media`  - the audio itself would not load: a bad URL, an unsupported codec, or a cross-origin
 *              file with no CORS headers.
 * - `engine` - the playback engine could not be loaded at all (an offline or blocked chunk).
 *
 * `reason` is the engine-independent part, which is the point: a consumer branches on it without
 * knowing what is playing the audio.
 */
export interface AudioLoadError extends Error {
  reason: 'media' | 'engine';
}

export interface AudioProps
  // `onPlay` and `onPause` are native media-event handlers on React's HTMLAttributes, and our
  // props of the same name mean something different (fired from howler, no event argument). Per
  // learning 15 the component's own meaning wins, so the native ones are omitted rather than
  // silently conflicting.
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onPlay' | 'onPause'> {
  /**
   * The media URL, or several of the same audio in different formats - the first one the browser
   * can play wins (e.g. `['clip.webm', 'clip.mp3']`).
   */
  src: string | string[];
  /** Explicit extensions, for URLs that do not end in one (a signed CDN link, a stream). */
  format?: string[];
  /** Start playing as soon as the media loads. Default `false`. */
  autoplay?: boolean;
  /** Restart on reaching the end. Default `false`. */
  loop?: boolean;
  /** Playback volume, 0 to 1. Default `1`. */
  volume?: number;
  /** Load the media before it is played. Default `true`. */
  preload?: boolean;
  /**
   * Stream the audio rather than downloading it in full before playing. Default `false`.
   *
   * Set this for long files - by default the whole clip is buffered before playback starts, which
   * is fine for a short clip and wrong for anything podcast-length. Described as an INTENT rather
   * than by the mechanism that implements it, so it stays meaningful whatever is playing the audio.
   */
  stream?: boolean;
  /**
   * Position to begin at, in seconds - for resuming an episode, or deep-linking a timestamp.
   * Applied once, when the media loads (nothing can seek before a duration is known), and clamped
   * to the media's length.
   *
   * Deliberately a STARTING position, not a controlled one: changing it later does not yank a
   * listener who has since scrubbed elsewhere. It applies again when the `src` changes, because a
   * new source is a new start. To drive position continuously, take the handle from `onReady` and
   * call `seek()` yourself.
   */
  startAtSeconds?: number;
  /** How far the back button seeks, in seconds. Default `10`. */
  skipBackSeconds?: number;
  /** How far the forward button seeks, in seconds. Default `10`. */
  skipForwardSeconds?: number;
  /**
   * Accessible name for the play button while the media is loading, and the text a screen reader
   * announces for the busy state. Default `'Loading audio'`. A defaulted prop rather than a baked
   * string so a consumer can match their own wording or ship another language (learning 34).
   */
  loadingLabel?: string;
  /** Message shown when the media fails to load. Default `'Could not load audio'`. */
  errorLabel?: string;
  /**
   * Called once the media has loaded, with Canopy's own {@link AudioHandle} - the escape hatch for
   * driving playback from outside the component.
   *
   * There is deliberately NO raw-options passthrough and no access to the underlying engine: both
   * would publish the implementation and make replacing it a breaking change. Anything the handle
   * cannot express is a missing first-class prop; ask for it.
   */
  onReady?: (audio: AudioHandle) => void;
  /**
   * Called when the media fails to load. Named `onLoadError` rather than `onError` to leave the
   * native `onError` handler on the wrapper alone.
   *
   * This is the media convention: the error the component is ABOUT, namespaced by what failed.
   * `AudioRecorder` follows it with `onRecordingError`, so a consumer wiring both does not have to
   * remember which one took the generic name.
   */
  onLoadError?: (error: AudioLoadError) => void;
  /** Called when playback starts. */
  onPlay?: () => void;
  /** Called when playback pauses. */
  onPause?: () => void;
  /** Called when the media reaches the end (fires per iteration when `loop` is set). */
  onEnd?: () => void;
}

/* ------------------------------------------------------------------------------------ helpers */

/** Normalise the `src` prop to howler's array form. */
function resolveSrc(src: string | string[]): string[] {
  return Array.isArray(src) ? src : [src];
}

/**
 * Format a position/duration in seconds as `m:ss`, widening to `h:mm:ss` only once the media runs
 * an hour or longer - so a three-minute clip is not padded out to `0:03:15`. A duration that is
 * not yet known (howler returns `0`, and `seek()` can return the Howl itself mid-load) reads as
 * `0:00` rather than `NaN`.
 */
function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const pad = (value: number) => String(value).padStart(2, '0');
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(secs)}`;
  return `${minutes}:${pad(secs)}`;
}

/**
 * howler's `seek()` is an overloaded getter/setter: called with no argument it returns the
 * position, but mid-load (and on some error paths) it returns the `Howl` itself. Narrow it to a
 * usable number so a non-numeric return can never reach the position state.
 */
function readPosition(howl: Howl): number {
  const value = howl.seek();
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

/**
 * Build an {@link AudioLoadError}. A real `Error` so it reads normally when logged, carrying the
 * engine-independent `reason` a consumer branches on and the raw `cause` for diagnosis - the
 * `message` + machine-reason pairing SubscribeForm established (learning 34).
 */
function makeLoadError(reason: AudioLoadError['reason'], message: string, cause?: unknown) {
  const error = new Error(message) as AudioLoadError;
  error.reason = reason;
  if (cause !== undefined) error.cause = cause;
  return error;
}

/**
 * Translate Canopy's props into the engine's options. This function is the ONLY place the two
 * vocabularies meet, which is what makes the engine replaceable: swapping howler out means
 * rewriting this mapping and the effect that consumes it, and touching nothing a consumer can see.
 *
 * Note `stream` -> `html5`: the prop names the intent, this names howler's mechanism for it.
 *
 * With no raw-options passthrough there is no merge order to reason about any more - every value
 * is either the caller's or the documented default.
 */
function buildOptions(props: Pick<AudioProps, OptionPropKey>): HowlOptions {
  const { src, format, autoplay, loop, volume, preload, stream } = props;

  const built: HowlOptions = {
    src: resolveSrc(src),
    autoplay: autoplay ?? false,
    loop: loop ?? false,
    volume: volume ?? 1,
    preload: preload ?? true,
    html5: stream ?? false,
  };
  if (format !== undefined) built.format = format;
  return built;
}

/**
 * Options the engine can change on a LIVE player, so a new value must not rebuild it. Everything
 * else in the built options is fixed at construction and therefore belongs in the rebuild key.
 */
const LIVE_UPDATABLE_OPTIONS = ['volume', 'loop'] as const;

/**
 * A value-equality key over the construction-time options, so the create effect re-runs when one of
 * them actually changes.
 *
 * It compares VALUES rather than object identity, which matters for the array-valued props: an
 * inline `src={['a.webm', 'a.mp3']}` or `format={['mp3']}` is a new array on every render, and
 * keying on identity would rebuild - and restart - the player continuously. Keys are sorted so the
 * string depends only on the values, never on property order.
 */
function constructionKeyOf(built: HowlOptions): string {
  const entries = Object.entries(built)
    .filter(
      ([key]) => !LIVE_UPDATABLE_OPTIONS.includes(key as (typeof LIVE_UPDATABLE_OPTIONS)[number]),
    )
    .sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify(entries);
}

type OptionPropKey = 'src' | 'format' | 'autoplay' | 'loop' | 'volume' | 'preload' | 'stream';

/* -------------------------------------------------------------------------------------- icons */

/**
 * The transport glyphs, inline as SVG (Canopy components draw their own glyphs rather than
 * depending on `@rogueoak/icons`). Unlike the stroked chevrons and checks elsewhere in Canopy,
 * these are SOLID FILLS with no stroke: it is how transport controls are conventionally drawn, and
 * a stroke on top of a fill inflates each shape by half the stroke width, which closes the gap
 * between the two triangles of a skip glyph and turns it into one blob.
 *
 * Each is `aria-hidden` - the accessible name lives on the enclosing button, never inside the
 * hidden subtree (learning 30).
 */
const GLYPH_CLASS = 'h-4 w-4';

function PlayGlyph() {
  return (
    <svg className={GLYPH_CLASS} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6 4l14 8-14 8z" />
    </svg>
  );
}

function PauseGlyph() {
  return (
    <svg className={GLYPH_CLASS} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}

function SkipBackGlyph() {
  return (
    <svg className={GLYPH_CLASS} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M11 19l-9-7 9-7z" />
      <path d="M22 19l-9-7 9-7z" />
    </svg>
  );
}

function SkipForwardGlyph() {
  return (
    <svg className={GLYPH_CLASS} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13 19l9-7-9-7z" />
      <path d="M2 19l9-7-9-7z" />
    </svg>
  );
}

/* ---------------------------------------------------------------------------------- component */

const Audio = React.forwardRef<HTMLDivElement, AudioProps>(function Audio(props, ref) {
  const {
    src,
    format,
    autoplay,
    loop,
    volume,
    preload,
    stream,
    startAtSeconds,
    skipBackSeconds = 10,
    skipForwardSeconds = 10,
    loadingLabel = 'Loading audio',
    errorLabel = 'Could not load audio',
    onReady,
    onLoadError,
    onPlay,
    onPause,
    onEnd,
    className,
    ...rest
  } = props;

  const howlRef = React.useRef<Howl | null>(null);
  const frameRef = React.useRef<number | null>(null);

  const [status, setStatus] = React.useState<AudioStatus>(() =>
    preload === false ? 'idle' : 'loading',
  );
  const [playing, setPlaying] = React.useState(false);
  const [position, setPosition] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  // Non-null only while a scrub is in progress: it holds the pending value so the thumb (and the
  // elapsed readout) follow the drag instead of being yanked back by the position loop.
  const [scrubValue, setScrubValue] = React.useState<number | null>(null);

  // Keep the latest options and callbacks in refs, so the create effect depends on the option
  // VALUES (via `constructionKey`) rather than on anything's identity - an inline arrow handler
  // must not rebuild the player on every render.
  const optionsRef = React.useRef<HowlOptions>(
    buildOptions({ src, format, autoplay, loop, volume, preload, stream }),
  );
  optionsRef.current = buildOptions({ src, format, autoplay, loop, volume, preload, stream });
  // Read at load time rather than captured at construction, so a value that arrives late (a
  // resume position fetched from an API) still applies to the first load.
  const startAtRef = React.useRef(startAtSeconds);
  startAtRef.current = startAtSeconds;
  const onReadyRef = React.useRef(onReady);
  onReadyRef.current = onReady;
  const onLoadErrorRef = React.useRef(onLoadError);
  onLoadErrorRef.current = onLoadError;
  const onPlayRef = React.useRef(onPlay);
  onPlayRef.current = onPlay;
  const onPauseRef = React.useRef(onPause);
  onPauseRef.current = onPause;
  const onEndRef = React.useRef(onEnd);
  onEndRef.current = onEnd;

  /* --------------------------------------------------------------------- the public handle */

  // Assigned further down, once `seekTo` exists - the handle only calls it after render, so the
  // late assignment is safe and keeps the handle's identity stable.
  const seekToRef = React.useRef<(seconds: number) => void>(() => {});

  // Canopy's own control surface, NOT the engine's instance. Stable for the component's lifetime
  // (empty deps) so a consumer can hold onto it: every method reads the CURRENT player through the
  // ref rather than closing over one, which means it survives a source change rebuilding the
  // player underneath it. Before the player exists, each method is a no-op or a zero rather than a
  // crash.
  const handle = React.useMemo<AudioHandle>(
    () => ({
      play: () => howlRef.current?.play(),
      pause: () => howlRef.current?.pause(),
      stop: () => howlRef.current?.stop(),
      seek: (seconds: number) => seekToRef.current(seconds),
      getPosition: () => (howlRef.current ? readPosition(howlRef.current) : 0),
      getDuration: () => {
        const value = howlRef.current?.duration() ?? 0;
        return Number.isFinite(value) ? value : 0;
      },
      setVolume: (value: number) => howlRef.current?.volume(value),
      isPlaying: () => howlRef.current?.playing() ?? false,
    }),
    [],
  );

  /* ------------------------------------------------------------------ the position loop */

  // howler has NO `timeupdate` event, so position has to be polled. The rule this component holds
  // itself to: the loop exists ONLY while audio is actually playing. It starts on `play` and stops
  // on `pause`, `stop`, `end`, and unmount - an always-on rAF would burn a frame callback forever
  // on a page that embeds three episodes.
  const stopTicking = React.useCallback(() => {
    if (frameRef.current === null) return;
    cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
  }, []);

  const startTicking = React.useCallback(() => {
    // Guard against a double-start (e.g. a `play` event on an already-playing Howl) leaving an
    // orphaned loop that nothing holds the handle to.
    stopTicking();
    const tick = () => {
      const howl = howlRef.current;
      if (!howl) return;
      setPosition(readPosition(howl));
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
  }, [stopTicking]);

  /* ------------------------------------------------------------------- create / destroy */

  // Rebuild the player when any CONSTRUCTION-time option changes - the engine fixes `src`,
  // `format`, `stream`, `preload`, and `autoplay` when the player is built, so a new value for one
  // of them can only take effect on a new one. `volume` and `loop` are excluded because they CAN
  // be changed live, and are applied through the instance in the effects below; rebuilding on a
  // volume tick would restart playback.
  //
  // The key compares option VALUES, not identity: `src` and `format` are arrays, so an inline
  // literal is a new array every render and identity would rebuild the player continuously.
  const constructionKey = constructionKeyOf(optionsRef.current);

  React.useEffect(() => {
    let cancelled = false;
    let created: Howl | null = null;

    // Always `loading` at the start: even with `preload={false}` there is a real fetch in flight
    // here - the dynamic `import('howler')` chunk - and the play button cannot do anything until
    // it lands. Once the instance exists, a no-preload player drops to `idle`.
    setStatus('loading');

    // Dynamic import: howler touches `window` and constructs an AudioContext at module scope, so
    // a static import would break SSR outright. It also keeps howler out of the initial bundle.
    void import('howler')
      .then(({ Howl }) => {
        // The component may have unmounted (or the source changed again) before the import
        // resolved - don't construct a player nothing will ever unload.
        if (cancelled) return;

        const howl = new Howl(optionsRef.current);
        created = howl;
        howlRef.current = howl;

        howl.on('load', () => {
          setStatus('ready');
          const mediaDuration = howl.duration();
          setDuration(mediaDuration);
          // `startAtSeconds` can only be honoured now: seeking needs a duration to clamp against,
          // and a seek on a player that has not loaded is ignored. Applied BEFORE `onReady` so a
          // consumer taking the handle there sees the position already set.
          const startAt = startAtRef.current;
          if (startAt !== undefined && startAt > 0 && Number.isFinite(mediaDuration)) {
            const clamped = Math.min(startAt, mediaDuration);
            howl.seek(clamped);
            setPosition(clamped);
          }
          onReadyRef.current?.(handle);
        });
        howl.on('loaderror', (_id, cause) => {
          // The media will never arrive (a bad URL, an unsupported codec, or - the case the README
          // documents - a cross-origin file with no CORS headers on the Web Audio path). Say so:
          // without this, the failure is indistinguishable from a slow network forever.
          setStatus('error');
          setPlaying(false);
          stopTicking();
          onLoadErrorRef.current?.(makeLoadError('media', 'The audio could not be loaded.', cause));
        });
        howl.on('playerror', () => {
          // Playback was refused (an autoplay policy, a decode failure). The MEDIA may still be
          // fine, so this is deliberately not the error state - but the button must stop claiming
          // it is playing.
          setPlaying(false);
          stopTicking();
        });
        howl.on('play', () => {
          setPlaying(true);
          startTicking();
          onPlayRef.current?.();
        });
        howl.on('pause', () => {
          setPlaying(false);
          stopTicking();
          setPosition(readPosition(howl));
          onPauseRef.current?.();
        });
        howl.on('stop', () => {
          setPlaying(false);
          stopTicking();
          setPosition(0);
        });
        howl.on('end', () => {
          onEndRef.current?.();
          // With `loop` set, howler fires `end` on every iteration and keeps playing - so the loop
          // and the playing state must survive it. Only a real stop resets them.
          if (howl.loop()) return;
          setPlaying(false);
          stopTicking();
          setPosition(0);
        });

        // The instance exists, so the controls can act. A preloading player stays `loading` until
        // its `load` event; a no-preload one is idle and waiting for a press.
        if (optionsRef.current.preload === false) setStatus('idle');
      })
      .catch((cause: unknown) => {
        // The howler CHUNK failed to load (offline, a bad deploy, a blocked CDN). Without this the
        // promise rejects unhandled in the consumer's app and the player renders as a normal but
        // permanently inert set of controls.
        if (cancelled) return;
        setStatus('error');
        onLoadErrorRef.current?.(
          makeLoadError('engine', 'The audio player could not be loaded.', cause),
        );
      });

    return () => {
      cancelled = true;
      stopTicking();
      if (created) {
        // `off()` first: unload can emit, and these handlers set state for a player that is gone.
        created.off();
        created.unload();
      }
      howlRef.current = null;
      // Reset for the incoming source (on unmount these are no-ops).
      setPlaying(false);
      setPosition(0);
      setDuration(0);
      setScrubValue(null);
    };
  }, [constructionKey, handle, startTicking, stopTicking]);

  /* --------------------------------------------------------------------- live updates */

  // `volume` and `loop` are the two options howler can change on a live player, so they update in
  // place rather than by rebuilding it.
  React.useEffect(() => {
    const howl = howlRef.current;
    if (!howl || volume === undefined) return;
    howl.volume(volume);
  }, [volume]);

  React.useEffect(() => {
    const howl = howlRef.current;
    if (!howl || loop === undefined) return;
    howl.loop(loop);
  }, [loop]);

  /* ------------------------------------------------------------------------- handlers */

  // Seeking needs a known, FINITE duration to clamp against. `Number.isFinite` is doing real work:
  // a live stream reports `Infinity`, which would otherwise enable the bar with `max={Infinity}` -
  // a thumb pinned at 0, an `aria-valuemax="Infinity"`, and a `0:00` total.
  const loaded = status === 'ready' && Number.isFinite(duration) && duration > 0;
  const loading = status === 'loading';
  const failed = status === 'error';

  const seekTo = React.useCallback(
    (value: number) => {
      const howl = howlRef.current;
      if (!howl || !loaded) return;
      // Clamp at BOTH ends: skipping back from 3s by 10s must land on 0, not -7, and skipping
      // forward past the end must land on the duration, not beyond it.
      const clamped = Math.min(Math.max(value, 0), duration);
      howl.seek(clamped);
      setPosition(clamped);
    },
    [duration, loaded],
  );

  // Late-bind the handle's `seek` now that the clamping implementation exists (see the ref above).
  seekToRef.current = seekTo;

  const handleTogglePlay = () => {
    const howl = howlRef.current;
    if (!howl || failed) return;
    // Ask the PLAYER whether it is playing, not React state. howler emits `play` asynchronously -
    // from a `setTimeout(0)` on the Web Audio path, and from the `node.play()` promise on the
    // `html5` path, which is hundreds of milliseconds while a stream buffers (and `html5` is
    // exactly what the README tells podcast consumers to set). Through that window the button
    // still reads "Play", so branching on the state would let a second click call `play()` again -
    // and howler's play-lock sends that down the `_inactiveSound()` path, allocating a SECOND
    // sound and playing two copies of the clip at once. `howl.playing()` is already true by then,
    // because howler sets it synchronously before the emit. The `playing` STATE stays what it
    // should be - a display concern, driving the glyph and the label.
    if (howl.playing()) {
      howl.pause();
      return;
    }
    // With `preload={false}` this press is what starts the fetch, so the spinner has to go up here
    // rather than waiting for an event howler will not fire until the media arrives.
    if (status === 'idle') setStatus('loading');
    howl.play();
  };

  const handleSkipBack = () => seekTo(position - skipBackSeconds);
  const handleSkipForward = () => seekTo(position + skipForwardSeconds);

  // The scrub bar is single-thumb, so `values` always carries exactly one entry - but read it
  // defensively rather than asserting, so a malformed emission can never seek to `undefined`.
  const handleScrub = (values: number[]) => {
    const [next] = values;
    if (next === undefined) return;
    setScrubValue(next);
  };

  // Radix fires `onValueCommit` for a released pointer drag AND for keyboard stepping, so both
  // seek through the same path.
  const handleScrubCommit = (values: number[]) => {
    const [next] = values;
    setScrubValue(null);
    if (next === undefined) return;
    seekTo(next);
  };

  /* --------------------------------------------------------------------------- render */

  const displayPosition = scrubValue ?? position;
  const sliderMax = loaded ? duration : UNKNOWN_DURATION_MAX;
  const sliderValue = Math.min(Math.max(displayPosition, 0), sliderMax);
  const elapsedLabel = formatTime(displayPosition);
  // The elapsed side is always a real number (playback starts at 0), but the total is genuinely
  // unknown until the media loads, so it says so rather than claiming zero.
  let durationLabel = UNKNOWN_TIME;
  if (loaded) durationLabel = formatTime(duration);
  // While loading, the button's name says what is happening rather than offering an action it
  // cannot perform. Per the repo's no-ternaries-in-JSX convention, the branch is resolved here.
  let playLabel = playing ? 'Pause' : 'Play';
  if (loading) playLabel = loadingLabel;
  // Built from the same value the handler acts on, so a caller who changes an interval can never
  // leave the label disagreeing with the behaviour.
  const skipBackLabel = `Skip back ${skipBackSeconds} seconds`;
  const skipForwardLabel = `Skip forward ${skipForwardSeconds} seconds`;

  let playButtonClass = TRANSPORT_BUTTON_CLASS;
  if (loading) playButtonClass = PLAY_BUTTON_LOADING_CLASS;

  let playGlyph = <PlayGlyph />;
  if (playing) playGlyph = <PauseGlyph />;
  // `aria-hidden` because the button already carries the loading label: Spinner's own `role="status"`
  // would otherwise announce a second, competing "Loading" (learning 30 - one name, one source).
  if (loading) playGlyph = <Spinner size="sm" aria-hidden="true" />;

  // A failed load replaces the clock, because two zeroed times next to an error would just be
  // noise. `role="status"` announces it once, politely, without stealing focus.
  let timeRow = (
    <div className="flex items-center justify-between text-caption text-text-muted tabular-nums">
      <span>{elapsedLabel}</span>
      <span>{durationLabel}</span>
    </div>
  );
  if (failed) {
    timeRow = (
      <p role="status" className="text-caption text-danger">
        {errorLabel}
      </p>
    );
  }

  return (
    <div
      ref={ref}
      // `aria-busy` is what tells assistive tech the region is still resolving - the visual
      // spinner alone says nothing to a screen reader.
      aria-busy={loading}
      className={cn(
        'flex w-full flex-col gap-4 rounded-lg border border-border bg-surface-raised p-4 text-text shadow-sm',
        className,
      )}
      {...rest}
    >
      {/* The bar and its clock are one unit, so they sit closer to each other (gap-1.5) than the
          pair does to the transport row (the parent's gap-4). A uniform gap left the clock
          equidistant between the bar it labels and the buttons it does not. */}
      <div className="flex flex-col gap-1.5">
        <Slider
          aria-label="Seek"
          // A seek bar's raw `aria-valuenow` is a second count, which a screen reader announces as
          // "one hundred forty two" for 2:22. `aria-valuetext` is read in preference to it.
          aria-valuetext={elapsedLabel}
          value={[sliderValue]}
          min={0}
          max={sliderMax}
          step={SEEK_STEP_SECONDS}
          disabled={!loaded}
          onValueChange={handleScrub}
          onValueCommit={handleScrubCommit}
        />
        {timeRow}
      </div>

      <div className="flex items-center justify-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={SKIP_BUTTON_CLASS}
          aria-label={skipBackLabel}
          disabled={!loaded}
          onClick={handleSkipBack}
        >
          <SkipBackGlyph />
        </Button>
        <Button
          type="button"
          variant="primary"
          size="icon"
          className={playButtonClass}
          aria-label={playLabel}
          // Play stays live in `idle` (with `preload={false}`, pressing it is what starts the
          // fetch) but not while the chunk or the media is still in flight, and not after a
          // failure - a press in those windows would be silently dropped.
          disabled={loading || failed}
          onClick={handleTogglePlay}
        >
          {playGlyph}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={SKIP_BUTTON_CLASS}
          aria-label={skipForwardLabel}
          disabled={!loaded}
          onClick={handleSkipForward}
        >
          <SkipForwardGlyph />
        </Button>
      </div>
    </div>
  );
});

Audio.displayName = 'Audio';

export { Audio, buildOptions, formatTime };
