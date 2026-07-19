# 0070 - Video

## Problem

Canopy has no media component. Consumers that need to embed video (first up:
the matthewmaynes.com "life log" post) currently reach for a raw `<video>` -
inconsistent controls, no design-system skin, no light/dark cohesion, and every
app re-solving player lifecycle. We want one accessible, on-brand video player.

**Who it's for:** any Canopy consumer embedding a self-hosted (or HLS) video in
a page - blog posts, marketing sections, docs.

## Outcome

`import { Video } from '@rogueoak/canopy/branches'` renders a
[video.js](https://videojs.com)-backed player that:

- Plays a source (`mp4`, `webm`, HLS, ...), **fluid/responsive by default** -
  fills its container width and keeps the video's aspect ratio.
- Has its **controls fully skinned to Canopy tokens** (play/big-play button,
  scrubber, volume, time, menus, focus ring) and reads correctly in **light and
  dark** with no per-app work.
- Exposes a **lean prop surface** for the common case plus an `options`
  passthrough (raw video.js config) and `onReady(player)` to reach the player
  instance for anything advanced.
- Owns the player **lifecycle** - creates the player on mount, updates the
  source reactively, and **disposes it on unmount** (no leaks).

## Scope

### In

- **`Video`** Branch (single component - video.js owns the control-bar DOM, so
  there are no `Video*` sub-parts to compose). Ships on `@rogueoak/canopy/branches`.
- **Props (lean + escape hatch):**
  - `src?: string` **or** `sources?: { src: string; type?: string }[]` - the media.
  - `poster?: string` - preview image.
  - `controls?: boolean` (default `true`)
  - `autoplay?: boolean` (default `false`) - note browsers require `muted` for
    autoplay to actually start; we pass it through, we don't force it.
  - `loop?`, `muted?` (default `false`), `preload?: 'auto' | 'metadata' | 'none'`
    (default `'metadata'`), `playsInline?: boolean` (default `true`).
  - `fluid?: boolean` (default `true`) - responsive; `aspectRatio?: string`
    (e.g. `'16:9'`) passes through. `fluid={false}` + native `width`/`height`
    for a fixed-size player.
  - `options?` - raw video.js options, shallow-merged **under** the first-class
    props (explicit props win for the keys they own; `options` fills the rest).
  - `onReady?: (player) => void` - fired once video.js reports ready, with the
    player instance (the escape hatch for autoplay orchestration, plugins,
    analytics, quality menus, ...).
  - `className` / `style` / native props merged via `cn()` onto the player wrapper.
- **Canopy skin stylesheet** shipped as a **new package export
  `@rogueoak/canopy/video.css`** - a token-based skin that restyles video.js's
  structural `.vjs-*` classes using **only** Canopy **semantic role** CSS
  variables (`var(--color-primary)`, `var(--color-surface-raised)`,
  `var(--radius-md)`, ...). Because those vars are remapped by `.dark` on
  `<html>`, the skin themes automatically - **no `.dark` selectors in the skin**.
- **Consumer brand overrides re-theme the player automatically** (added
  requirement). Because the skin references only the **semantic role** vars - the
  exact seam the brand pipeline (spec 0028) and any runtime `:root`/`.dark`
  override re-point - a consumer who overrides `--color-primary` (etc.), whether
  via `buildBrand()`'s `brand.css` or a hand-written `:root { --color-*: ... }`,
  re-themes the video controls **with zero changes to the skin or the component**,
  in both light and dark, exactly like every other Canopy component. The skin
  must therefore reference **role** tokens (`--color-primary`,
  `--color-surface-raised`, `--color-text`, `--color-ring`, ...), **never**
  primitive ramp steps (`--color-moss-600`) and **never** a hardcoded value - a
  primitive or a literal would opt the player out of the consumer's brand.
- Tests (Video.test.tsx), Storybook story (`Branches/Video`), README wiring,
  living-docs update.

### Out

- **Replacing video.js's controls with React components.** We *skin* video.js's
  own control bar (CSS), we don't re-implement it - that would be the opposite of
  "minimal" and a far larger surface. (Choice made in spec negotiation:
  "fully custom control bar" = fully Canopy-skinned, not React-rebuilt.)
- First-class **captions/subtitle-track props**, playback-rate menu, playlists,
  ads, DRM, adaptive-streaming plugins, analytics - all reachable through
  `options` / `onReady`, none baked in.
- A prebuilt bundle of video.js's own base CSS - the consumer imports
  `video.js/dist/video-js.css` themselves (documented), same as they import
  `@fontsource` fonts and `@rogueoak/roots/tokens.css`.

## Approach

### Tier: this is a Branch

Video owns a third-party **behavioural-library state machine** (the video.js
player) and its lifecycle, exactly like **Carousel** (embla, 0061) and **Chart**
(recharts, 0062), both Branches. Per the "tier is interaction class, not
resemblance" learning, a media player that owns a player instance + eff+dispose
lifecycle is a Branch, not a Seed. It ships on `./branches`.

### Player lifecycle (the video.js + React seam)

video.js mutates the DOM (it wraps the `<video>` element in its own player
chrome), so React must **not** own that subtree. Follow the documented React
pattern:

- Render a wrapper `<div ref={containerRef} data-vjs-player>`.
- In a mount `useEffect`, **lazily `await import('video.js')`** (code decision:
  video.js is heavy, so it is kept out of the initial bundle and loaded on
  mount), then create a `<video class="video-js">` element imperatively, append
  it to the container, and call `videojs(el, options, () => onReady(player))`.
  Store the player in a ref. The effect guards against a race where the component
  unmounts before the dynamic import resolves (a cancelled flag - don't init into
  a torn-down container). The `poster` renders immediately as a native attribute
  so there is a visible frame while video.js loads.
- **Reactive updates without re-creating the player:** a second effect calls
  `player.src(...)` when `src`/`sources` change and `player.poster(...)` when
  `poster` changes (guarded so the initial create isn't doubled). Options that
  video.js can't change live (e.g. `controls`, `fluid`) are set via the player
  API (`player.controls()`, `player.fluid()`) where supported.
- Cleanup disposes the player (`player.dispose()`) and clears the ref, so
  unmount leaves nothing running.
- **SSR-safe:** all video.js work happens in `useEffect` (client only); the
  server renders just the wrapper markup.

### Options mapping

Build a `videojs` options object from the first-class props, then
`{ ...options, ...builtFromProps }` so an explicit prop wins for its key while
`options` supplies anything we don't surface. `sources` (or a single `src`
normalised to one entry) becomes `options.sources`.

### The skin ships as a stylesheet (new pattern for Canopy)

This is Canopy's **first shipped component stylesheet**, and it's deliberate.
Canopy's distribution model ships `className` strings that the consumer's
Tailwind build emits via `@source`. video.js's controls are **not** our utility
classes - they're structural `.vjs-*` classes video.js emits at runtime, which
the Tailwind scanner can never see. This is the same shape as the
"motion ships from the preset, not `@source`" learning: CSS the scanner can't
synthesise must ship from a file the consumer imports.

- Authored at `packages/canopy/video.css`, exported as `./video.css`, added to
  the package `files`. Plain CSS (no build step) - it references Canopy token
  vars, so it needs no compilation.
- Consumer wiring is **two documented imports** (order matters - skin after base
  so it overrides):
  ```
  import 'video.js/dist/video-js.css';
  import '@rogueoak/canopy/video.css';
  ```
- **Drift guard:** a test asserts `video.css` references `var(--color-` tokens
  and contains **no hardcoded hex**, **no `.dark` selector**, and **no
  primitive-ramp var** (`--color-<ramp>-<step>`) - so it can't silently fork the
  palette, hand-theme, or bypass a consumer's brand override (mirroring the roots
  token guards). Referencing only role tokens is what makes a consumer's brand
  override apply automatically.

### Dependency

- Add `video.js` (`^8`) to `@rogueoak/canopy` `dependencies` **and** tsup
  `external` (so the **dynamic** `import('video.js')` stays a runtime import
  resolved at the consumer's install, never bundled - the recipe rule every
  other lib follows). video.js 8 ships its own TypeScript types, so no
  `@types/video.js`.
- **Dependency footprint (acknowledged).** video.js is the heaviest lib Canopy
  wraps: it pulls a sizeable transitive tree (http-streaming, mux.js,
  mpd-parser, `@xmldom/xmldom`, aes-decrypter, vtt.js, ...) for its adaptive-
  streaming + captions support. This is a deliberate build-vs-buy, matching the
  embla/recharts precedent - a correct, accessible player is not something to
  re-implement. The lazy dynamic import keeps the runtime cost out of the
  initial bundle, but not the install/supply-chain cost; that is the trade for
  a batteries-included player. (Security review is off in this repo's persona
  config; the new-dependency surface is called out here in lieu of it.)

### Testing strategy (jsdom)

Per "don't assert a third-party library's browser internals in jsdom - test your
own mapping": video.js needs real media APIs jsdom lacks, so tests **mock the
`video.js` default export** and assert the mapping **we own**:

- `video.js` is **dynamically imported** (not statically), and `videojs` is
  called with the container's `<video>` and the **options object we built** from
  props (source/poster/controls/fluid/autoplay/loop/muted/preload).
- `options` passthrough merges, and an explicit prop **wins** over the same key
  in `options` (fixture uses **distinct** values so a swapped precedence fails -
  the "distinct fixture" learning).
- changing `src` calls `player.src(...)` **without** a second `videojs(...)`
  (player not re-created).
- unmount calls `player.dispose()`.
- `onReady` receives the player.
- caller `className` is merged onto the wrapper; `ref` forwards.
- skin-file drift guard (token vars, no hex, no `.dark`).

## Acceptance

- [ ] `Video` + its prop types exported from `@rogueoak/canopy/branches`.
- [ ] Renders a video.js player; `onReady(player)` fires with the instance.
- [ ] First-class props map to the correct video.js options/attributes (asserted
      on the options object we build, not video.js internals).
- [ ] `options` passthrough merges; explicit props win for their keys (distinct-value fixture).
- [ ] Updating `src`/`sources` calls `player.src()` without re-creating the player.
- [ ] Unmount disposes the player (no leak).
- [ ] Fluid/responsive by default; `fluid={false}` + width/height gives a fixed player.
- [ ] `@rogueoak/canopy/video.css` export present and in package `files`; skin uses
      only **semantic role** token vars (`var(--color-*)`), no hardcoded hex, no
      `.dark` selector, no primitive-ramp var (guarded by test).
- [ ] **A consumer that overrides the semantic colour roles re-themes the player
      automatically** - proven by a test that overrides `--color-primary` on a
      wrapping `:root`/element and asserts the skin resolves the control accent to
      the overridden value (no skin/component change needed).
- [ ] `video.js` in `dependencies` and tsup `external`.
- [ ] Story `Branches/Video`: Playground, with-poster, autoplay+muted, fixed-size,
      and a dark example; reads correctly in both themes.
- [ ] README documents the two-stylesheet wiring seam.
- [ ] Living docs updated (features + architecture; a learning if the shipped-CSS
      pattern generalises).
- [ ] Full `turbo` build + test + lint + format:check green across **every** package
      **and** `apps/storybook` (the full-gate learning), before commit.
