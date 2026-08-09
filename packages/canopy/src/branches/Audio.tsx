import * as React from 'react';
import type { Howl, HowlOptions } from 'howler';
import { Button } from '../seeds/Button';
import { Slider } from '../seeds/Slider';
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
 * The transport controls are circles. `size="icon"` is already square, so `rounded-full` is the
 * only override needed - a FULL LITERAL, like every class Canopy ships, so Tailwind's scanner emits
 * it (learning 8). All three share it: a round play button flanked by two rounded-square skips
 * would read as two different control families rather than one transport group.
 *
 * The skips are `outline` rather than `ghost` so each reads as a button at rest instead of a bare
 * glyph that only reveals its hit area on hover. `primary` on play keeps the hierarchy - the
 * dominant action is filled, the secondary ones are outlined.
 */
const TRANSPORT_BUTTON_CLASS = 'rounded-full';

/* --------------------------------------------------------------------------------------- types */

export interface AudioProps
  // `onPlay` and `onPause` are native media-event handlers on React's HTMLAttributes, and our
  // props of the same name mean something different (fired from howler, no event argument). Per
  // learning 15 the component's own meaning wins, so the native ones are omitted rather than
  // silently conflicting.
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onPlay' | 'onPause'> {
  /** The media URL. An array is howler's fallback list (e.g. `['clip.webm', 'clip.mp3']`). */
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
   * Force HTML5 Audio instead of Web Audio. Default `false`. Set this for long files: Web Audio
   * buffers the whole clip before playing, so anything podcast-length wants `html5`.
   */
  html5?: boolean;
  /** How far the back button seeks, in seconds. Default `10`. */
  skipBackSeconds?: number;
  /** How far the forward button seeks, in seconds. Default `10`. */
  skipForwardSeconds?: number;
  /** Raw howler options merged UNDER the first-class props (props win for their keys). */
  options?: HowlOptions;
  /** Called once the media has loaded, with the `Howl` instance (the advanced escape hatch). */
  onReady?: (howl: Howl) => void;
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
 * Build the howler options from props: `{ ...defaults, ...options, ...explicitProps }`. Defaults
 * are the base, the `options` passthrough overrides defaults, and an explicitly-passed prop wins
 * over both for the key it owns. Only props the caller actually set land in `explicit`, so an
 * unset prop leaves its key to `options` (or the default) rather than clobbering it.
 */
function buildOptions(props: Pick<AudioProps, OptionPropKey>): HowlOptions {
  const { src, format, autoplay, loop, volume, preload, html5, options } = props;

  const defaults = {
    autoplay: false,
    loop: false,
    volume: 1,
    preload: true,
    html5: false,
  };

  const explicit: Partial<HowlOptions> = {};
  if (format !== undefined) explicit.format = format;
  if (autoplay !== undefined) explicit.autoplay = autoplay;
  if (loop !== undefined) explicit.loop = loop;
  if (volume !== undefined) explicit.volume = volume;
  if (preload !== undefined) explicit.preload = preload;
  if (html5 !== undefined) explicit.html5 = html5;

  // `src` is required by howler and owned entirely by this component, so it is applied last and
  // is never overridable through the `options` passthrough.
  return { ...defaults, ...options, ...explicit, src: resolveSrc(src) };
}

type OptionPropKey =
  | 'src'
  | 'format'
  | 'autoplay'
  | 'loop'
  | 'volume'
  | 'preload'
  | 'html5'
  | 'options';

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
    html5,
    skipBackSeconds = 10,
    skipForwardSeconds = 10,
    options,
    onReady,
    onPlay,
    onPause,
    onEnd,
    className,
    ...rest
  } = props;

  const howlRef = React.useRef<Howl | null>(null);
  const frameRef = React.useRef<number | null>(null);

  const [playing, setPlaying] = React.useState(false);
  const [position, setPosition] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  // Non-null only while a scrub is in progress: it holds the pending value so the thumb (and the
  // elapsed readout) follow the drag instead of being yanked back by the position loop.
  const [scrubValue, setScrubValue] = React.useState<number | null>(null);

  // Keep the latest options and callbacks in refs so the create effect depends only on the source.
  // A consumer passing an inline `options` object or an inline arrow handler must not rebuild the
  // player on every render.
  const optionsRef = React.useRef<HowlOptions>(undefined as unknown as HowlOptions);
  optionsRef.current = buildOptions({
    src,
    format,
    autoplay,
    loop,
    volume,
    preload,
    html5,
    options,
  });
  const onReadyRef = React.useRef(onReady);
  onReadyRef.current = onReady;
  const onPlayRef = React.useRef(onPlay);
  onPlayRef.current = onPlay;
  const onPauseRef = React.useRef(onPause);
  onPauseRef.current = onPause;
  const onEndRef = React.useRef(onEnd);
  onEndRef.current = onEnd;

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

  // Rebuild the player when the SOURCE changes, and only then. Everything else is read from
  // `optionsRef` at construction (howler takes most options only at construction anyway), or
  // applied through the instance API in the live-update effects below.
  const sourceKey = JSON.stringify(resolveSrc(src));

  React.useEffect(() => {
    let cancelled = false;
    let created: Howl | null = null;

    // Dynamic import: howler touches `window` and constructs an AudioContext at module scope, so
    // a static import would break SSR outright. It also keeps howler out of the initial bundle.
    void import('howler').then(({ Howl }) => {
      // The component may have unmounted (or the source changed again) before the import
      // resolved - don't construct a player nothing will ever unload.
      if (cancelled) return;

      const howl = new Howl(optionsRef.current);
      created = howl;
      howlRef.current = howl;

      howl.on('load', () => {
        setDuration(howl.duration());
        onReadyRef.current?.(howl);
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
  }, [sourceKey, startTicking, stopTicking]);

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

  const loaded = duration > 0;

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

  const handleTogglePlay = () => {
    const howl = howlRef.current;
    if (!howl) return;
    // Driven by the state that howler's own `play`/`pause` events set, so the button and the
    // player can never disagree about which action is next.
    if (playing) howl.pause();
    else howl.play();
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
  const durationLabel = formatTime(duration);
  const playLabel = playing ? 'Pause' : 'Play';
  // Built from the same value the handler acts on, so a caller who changes an interval can never
  // leave the label disagreeing with the behaviour.
  const skipBackLabel = `Skip back ${skipBackSeconds} seconds`;
  const skipForwardLabel = `Skip forward ${skipForwardSeconds} seconds`;

  return (
    <div
      ref={ref}
      className={cn(
        'flex w-full flex-col gap-3 rounded-lg border border-border bg-surface-raised p-4 text-text shadow-sm',
        className,
      )}
      {...rest}
    >
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

      <div className="flex items-center justify-between text-caption text-text-muted tabular-nums">
        <span>{elapsedLabel}</span>
        <span>{durationLabel}</span>
      </div>

      <div className="flex items-center justify-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={TRANSPORT_BUTTON_CLASS}
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
          className={TRANSPORT_BUTTON_CLASS}
          aria-label={playLabel}
          onClick={handleTogglePlay}
        >
          {playing ? <PauseGlyph /> : <PlayGlyph />}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={TRANSPORT_BUTTON_CLASS}
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
