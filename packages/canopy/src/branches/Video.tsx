import * as React from 'react';
import { cn } from '../lib/cn';

/**
 * Video - the media-player Branch (spec 0070), a thin wrapper over `video.js` styled with the
 * Canopy design tokens. video.js owns the hard parts (the player state machine, the control bar
 * DOM + a11y, source handling, fullscreen), while Canopy owns the SKIN - a token-based stylesheet
 * (`@rogueoak/canopy/video.css`) that restyles video.js's structural `.vjs-*` classes using only
 * semantic ROLE CSS vars (`var(--color-primary)`, ...), so it themes in light/dark AND re-themes
 * automatically under a consumer brand override (spec 0028) with zero component change.
 *
 * It lives in the Branches tier for the same reason Carousel (embla, 0061) and Chart (recharts,
 * 0062) do: it owns a third-party behavioural-library instance and its lifecycle (create on mount,
 * update source reactively, dispose on unmount).
 *
 * Two deliberate decisions:
 * - **Lazy load.** video.js is heavy, so it is pulled via a DYNAMIC `import('video.js')` on mount -
 *   it lands in its own chunk, out of the consumer's initial bundle, and (with the package's
 *   `sideEffects: false`) a consumer who never renders `<Video>` ships neither this component nor
 *   video.js. The `poster` renders as a native attribute the moment the effect runs, so there is a
 *   visible frame while the player code loads.
 * - **Lean props + escape hatch.** The common media options are first-class props; anything else
 *   goes through the raw `options` passthrough or the `onReady(player)` instance callback. Explicit
 *   props win over `options` for the keys they own; `options` fills (and may override our defaults
 *   for) the rest.
 *
 * The consumer wires two stylesheets once (order matters - skin after base so it overrides):
 *   import 'video.js/dist/video-js.css';
 *   import '@rogueoak/canopy/video.css';
 */

/* ------------------------------------------------------------------ types (no static import) */

// Derive the video.js types from the DYNAMIC module shape so the only reference to the package is
// the runtime `import('video.js')` - there is no static `import videojs from 'video.js'` to pull it
// into the initial bundle (mirrors Carousel deriving its option types from `useEmblaCarousel`).
type VideoJsFactory = (typeof import('video.js'))['default'];

/** The video.js player instance handed to `onReady` (and disposed on unmount). */
export type VideoPlayer = ReturnType<VideoJsFactory>;

/** Raw video.js options, for the `options` passthrough escape hatch. */
export type VideoJsOptions = NonNullable<Parameters<VideoJsFactory>[1]>;

/** One media source; `type` is the MIME (e.g. `'video/mp4'`, `'application/x-mpegURL'` for HLS). */
export interface VideoSource {
  src: string;
  type?: string;
}

export interface VideoProps extends React.HTMLAttributes<HTMLDivElement> {
  /** A single media URL. Use this OR `sources` (sources wins if both are given). */
  src?: string;
  /** Multiple sources (e.g. mp4 + webm, or an HLS manifest). Overrides `src`. */
  sources?: VideoSource[];
  /** Preview image shown before playback (rendered immediately, before video.js loads). */
  poster?: string;
  /** Show the control bar. Default `true`. */
  controls?: boolean;
  /** Autoplay on load. Default `false`. Browsers require `muted` for autoplay to actually start. */
  autoplay?: boolean;
  /** Loop playback. Default `false`. */
  loop?: boolean;
  /** Start muted. Default `false`. */
  muted?: boolean;
  /** How much to preload. Default `'metadata'`. */
  preload?: 'auto' | 'metadata' | 'none';
  /** Play inline on iOS rather than going fullscreen. Default `true`. */
  playsInline?: boolean;
  /** Responsive: fill the container width and keep the aspect ratio. Default `true`. */
  fluid?: boolean;
  /** Force an aspect ratio (e.g. `'16:9'`) instead of inferring from the media. */
  aspectRatio?: string;
  /** Fixed pixel width (use with `fluid={false}` for a fixed-size player). */
  width?: number;
  /** Fixed pixel height (use with `fluid={false}` for a fixed-size player). */
  height?: number;
  /** Raw video.js options merged UNDER the first-class props (props win for their keys). */
  options?: VideoJsOptions;
  /** Called once the player is ready, with the video.js instance (the advanced escape hatch). */
  onReady?: (player: VideoPlayer) => void;
}

/* --------------------------------------------------------------------------- options mapping */

function resolveSources(src?: string, sources?: VideoSource[]): VideoSource[] | undefined {
  if (sources && sources.length > 0) return sources;
  if (src) return [{ src }];
  return undefined;
}

/**
 * Build the video.js options object from props: `{ ...defaults, ...options, ...explicitProps }`.
 * Defaults are the base; the `options` passthrough overrides defaults; an explicitly-passed prop
 * wins over both for the key it owns. Only props the caller actually set land in `explicitProps`,
 * so an unset prop leaves its key to `options` (or the default) rather than clobbering it.
 */
function buildOptions(props: VideoProps): VideoJsOptions {
  const {
    src,
    sources,
    poster,
    controls,
    autoplay,
    loop,
    muted,
    preload,
    playsInline,
    fluid,
    aspectRatio,
    width,
    height,
    options,
  } = props;

  const defaults: VideoJsOptions = {
    controls: true,
    autoplay: false,
    loop: false,
    muted: false,
    preload: 'metadata',
    // video.js spells this lowercase; the React prop is the camelCase `playsInline`.
    playsinline: true,
    fluid: true,
  };

  const explicit: VideoJsOptions = {};
  if (controls !== undefined) explicit.controls = controls;
  if (autoplay !== undefined) explicit.autoplay = autoplay;
  if (loop !== undefined) explicit.loop = loop;
  if (muted !== undefined) explicit.muted = muted;
  if (preload !== undefined) explicit.preload = preload;
  if (playsInline !== undefined) explicit.playsinline = playsInline;
  if (fluid !== undefined) explicit.fluid = fluid;
  if (aspectRatio !== undefined) explicit.aspectRatio = aspectRatio;
  if (width !== undefined) explicit.width = width;
  if (height !== undefined) explicit.height = height;
  if (poster !== undefined) explicit.poster = poster;
  const resolvedSources = resolveSources(src, sources);
  if (resolvedSources) explicit.sources = resolvedSources;

  return { ...defaults, ...options, ...explicit };
}

/* --------------------------------------------------------------------------------- component */

const Video = React.forwardRef<HTMLDivElement, VideoProps>(function Video(props, ref) {
  const {
    src,
    sources,
    poster,
    controls,
    autoplay,
    loop,
    muted,
    preload,
    playsInline,
    fluid,
    aspectRatio,
    width,
    height,
    options,
    onReady,
    className,
    ...rest
  } = props;

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const playerRef = React.useRef<VideoPlayer | null>(null);

  // The video-specific props are destructured (above) to keep them out of `...rest` - only genuine
  // div attributes should spread onto the wrapper. Re-gather them here as the video.js options
  // input, which also means every destructured name is used.
  const optionsInput: VideoProps = {
    src,
    sources,
    poster,
    controls,
    autoplay,
    loop,
    muted,
    preload,
    playsInline,
    fluid,
    aspectRatio,
    width,
    height,
    options,
  };

  // Keep the latest options + onReady in refs so the create effect can stay mount-only (it must
  // NOT re-run and re-create the player when a reactive prop like `src` changes - that is handled
  // by the source/poster effects below).
  const optionsRef = React.useRef<VideoJsOptions>(buildOptions(optionsInput));
  optionsRef.current = buildOptions(optionsInput);
  const onReadyRef = React.useRef<VideoProps['onReady']>(onReady);
  onReadyRef.current = onReady;

  // Merge the forwarded ref with our internal container ref.
  const setContainer = React.useCallback(
    (node: HTMLDivElement | null) => {
      containerRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    },
    [ref],
  );

  // Create the player once, on mount. video.js MUTATES the DOM (it wraps the <video> in its own
  // chrome), so React must not own that node - create it imperatively and hand it to video.js.
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;
    const videoEl = document.createElement('video');
    videoEl.classList.add('video-js');
    // Show a frame immediately (before video.js loads) via native attributes.
    if (poster !== undefined) videoEl.poster = poster;
    videoEl.setAttribute('playsinline', '');
    container.appendChild(videoEl);

    void import('video.js').then(({ default: videojs }) => {
      // The component may have unmounted before the dynamic import resolved - don't init into a
      // torn-down container.
      if (cancelled || !containerRef.current) {
        videoEl.remove();
        return;
      }
      const player = videojs(videoEl, optionsRef.current, function onPlayerReady() {
        onReadyRef.current?.(player);
      });
      playerRef.current = player;
    });

    return () => {
      cancelled = true;
      const player = playerRef.current;
      if (player && typeof player.dispose === 'function' && !player.isDisposed()) {
        // Player exists: dispose() tears down the DOM video.js built around videoEl.
        player.dispose();
      } else {
        // Unmounted before the dynamic import resolved (a fast unmount, or React StrictMode's
        // double-invoke): no player was ever created, so remove the raw <video> we appended - the
        // still-pending import's own `cancelled` branch would only reach it if/when it resolves.
        videoEl.remove();
      }
      playerRef.current = null;
    };
    // Mount-only: reactive updates are handled by the effects below, so the player is created once
    // and never torn down mid-life on a prop change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reactively swap the source WITHOUT re-creating the player. On first mount the player is not yet
  // ready (playerRef is null) and the initial `optionsRef` already carried the source, so this is a
  // no-op until a later change.
  const sourcesKey = JSON.stringify(resolveSources(src, sources) ?? null);
  React.useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    const resolved = resolveSources(src, sources);
    // Deliberate: we only SET a new source, never unset one - clearing `src`/`sources` to nothing
    // leaves the current media playing rather than emptying the player (matching a native <video>).
    if (resolved) player.src(resolved);
    // sourcesKey captures src+sources; the raw values are read at run time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourcesKey]);

  // Reactively update the poster without re-creating the player.
  React.useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    if (poster !== undefined) player.poster(poster);
  }, [poster]);

  // The wrapper video.js enhances. `data-vjs-player` tells video.js not to add an extra wrapper.
  return <div ref={setContainer} data-vjs-player className={cn(className)} {...rest} />;
});

Video.displayName = 'Video';

export { Video, buildOptions };
