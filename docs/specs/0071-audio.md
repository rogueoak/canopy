# 0071 - Audio

## Problem

Canopy ships a `Video` Branch (spec 0070) but nothing for audio. A consumer embedding a
podcast episode, a voice note, a music clip, or a recorded talk currently reaches for a raw
`<audio controls>`: the browser's default player, which looks nothing like the rest of the
page, ignores the token layer entirely, and renders differently in every browser. There is no
on-brand way to put sound in a Canopy page.

**Who it's for:** any Canopy consumer embedding a self-hosted audio file in a page - blog
posts, episode pages, docs, marketing sections.

## Outcome

`import { Audio } from '@rogueoak/canopy/branches'` renders a
[howler.js](https://howlerjs.com)-backed player that:

- Plays a source (`mp3`, `ogg`, `wav`, ...) with **play/pause**, **skip back**, and **skip
  forward** controls, and a **scrubbable progress bar** that doubles as the position display.
- Is built from **Canopy's own Seeds** (`Button`, `Slider`) and semantic-token utilities, so it
  reads correctly in **light and dark** and re-themes under a consumer brand override with no
  per-app work - the same seam every other Canopy component uses.
- Is **operable by keyboard** end to end (tab to each control, arrow-keys to scrub) and
  announces position as **time**, not as a raw second count.
- Owns the howler **lifecycle** - creates the `Howl` on mount, swaps the source reactively, and
  **unloads it on unmount** (no orphaned audio playing after navigation).

## Scope

### In

- **`Audio`** Branch - a single component. Ships on `@rogueoak/canopy/branches`.
- **Props (lean + escape hatch):**
  - `src: string | string[]` - the media. An array is howler's fallback list (`mp3` then `ogg`),
    tried in order.
  - `format?: string[]` - explicit extensions, for URLs that do not end in one (a signed CDN
    link, a streaming endpoint). Passed straight to howler.
  - `autoplay?: boolean` (default `false`), `loop?: boolean` (default `false`),
    `volume?: number` (0-1, default `1`), `preload?: boolean` (default `true`).
  - `html5?: boolean` (default `false`) - force HTML5 Audio instead of Web Audio. Documented as
    the flag to set for long files: Web Audio buffers the whole clip before playing, so anything
    podcast-length wants `html5`.
  - `skipBackSeconds?: number` (default `10`), `skipForwardSeconds?: number` (default `10`) -
    independent, per the developer's call, so a podcast consumer can run the usual back-15 /
    forward-30 without a new component.
  - `options?: HowlOptions` - raw howler options, shallow-merged **under** the first-class props
    (explicit props win for the keys they own; `options` fills the rest), matching Video's
    passthrough contract exactly.
  - `onReady?: (howl: Howl) => void` - fired once the media has loaded, with the `Howl`
    instance: the escape hatch for rate control, sprites, fades, analytics, anything not
    surfaced.
  - `onPlay?`, `onPause?`, `onEnd?` - the three events worth surfacing for a basic player.
  - `className` / `style` / native div props merged via `cn()` onto the wrapper.
- **Layout (developer's call): stacked.** A full-width scrub bar on top, the elapsed and total
  times on the line beneath it (elapsed left, duration right), and the three transport controls
  centred below. Play/pause is the visually dominant control (`primary`, `icon` size); skip back
  and skip forward flank it as `ghost` icon buttons.
- **Time display** - `m:ss`, widening to `h:mm:ss` only once the media runs an hour or longer,
  in `text-caption text-muted-foreground` and tabular figures so the digits do not jitter as the
  clock ticks.
- **One small change to the `Slider` Seed** (see Approach): forward `aria-valuetext` to the
  single thumb, alongside the `aria-label` / `aria-labelledby` it already forwards. Additive and
  backwards compatible.
- Tests (`Audio.test.tsx`), Storybook story (`Branches/Audio`), README entry, living-docs update,
  CHANGELOG entry.

### Out

- **Volume slider / mute toggle.** `volume` is settable as a prop and reachable on the instance
  via `onReady`, but there is no volume UI in v1. Deliberate: the developer scoped this build to
  play/pause, seek, and progress.
- **Playlists, playback-rate menu, waveform rendering, audio sprites, spatial audio, captions or
  transcripts, download and share buttons, media-session / lock-screen metadata.** All either
  reachable through `options` / `onReady` or genuinely later features. This spec is the basic
  player; the props are shaped so each of these can arrive as an additive minor.
- **A shipped stylesheet.** Unlike Video, `Audio` needs none - see Approach.

## Approach

### Tier: this is a Branch

`Audio` owns a third-party behavioural-library instance (the `Howl`) and its lifecycle, and it
owns real interaction state (playing, position, duration, scrubbing). Per learning 31 - tier is
interaction class, not resemblance - that is a Branch on both counts, the same as Video (0070),
Carousel (0061), and Chart (0062). It ships on `./branches`.

### The key difference from Video: howler is headless

This is the one thing to understand before reading the rest. video.js **is a UI** - it builds a
control bar in the DOM, so spec 0070's work was a *skin*: a stylesheet restyling video.js's
`.vjs-*` classes, shipped as `@rogueoak/canopy/video.css` because Tailwind's scanner can never
see classes a third-party library emits at runtime.

**howler.js renders nothing.** It is a pure playback engine - load, play, pause, seek, volume,
events - with no DOM and no CSS of its own. So the split inverts:

| | Video (0070) | Audio (0071) |
|---|---|---|
| Library owns | the control-bar DOM + its a11y | playback only |
| Canopy owns | a CSS skin over someone else's markup | **the entire UI** |
| Ships | `video.css`, a token-role stylesheet | **nothing extra** |

Because Canopy renders every element itself, the UI is ordinary Canopy: `Button` and `Slider`
Seeds plus full-literal semantic-token utility strings that the consumer's existing `@source`
already emits (learnings 8 and 11). **No new package export, no `audio.css`, no new consumer
wiring** - a consumer who has Canopy set up gets `Audio` for free. The `video.css` seam stays a
video.js-specific exception rather than becoming the media pattern.

It also means the accessibility is ours to get right rather than inherited, which is why the
a11y section below is explicit rather than assumed.

### Player lifecycle (the howler + React seam)

- **Lazy dynamic `import('howler')` in a mount effect**, mirroring Video and learning 42.
  howler touches `window` and constructs an `AudioContext` at module scope, so a static import
  would break SSR outright; the dynamic import keeps it client-only *and* out of the initial
  bundle. The effect carries the same `cancelled` guard as Video, so a component that unmounts
  before the import resolves never constructs a `Howl` it cannot reach - and if one was
  constructed, cleanup unloads it.
- Cleanup calls `howl.unload()`. This matters more than Video's `dispose()`: an un-unloaded
  `Howl` keeps **playing after the component is gone**, with no visible element to stop it.
  A test asserts it.
- **Reactive source swap without re-creating on unrelated prop changes:** the create effect is
  keyed on the resolved source (and the options that howler can only take at construction), so
  changing `src` unloads the old `Howl` and builds a new one, while changing `skipForwardSeconds`
  or `className` touches nothing. Position and duration reset with the source. Options howler
  *can* change live (`volume`, `loop`) are applied through the instance API in their own effects
  rather than by rebuilding.
- Latest `onPlay` / `onPause` / `onEnd` / `onReady` are held in refs so the create effect stays
  off the callback identities - a consumer passing an inline arrow must not rebuild the player on
  every render.

### Position: a rAF loop, running only while playing

howler has **no `timeupdate` event**. Position must be polled via `howl.seek()`. The rule this
component holds itself to: **the loop exists only while audio is actually playing.** It starts on
`play`, stops on `pause`, `end`, and unmount. An always-on `requestAnimationFrame` on an idle
player would burn a frame callback forever on a page that embeds three episodes, and it is the
easy mistake to make here, so it gets a test that asserts the loop is cancelled on pause.

`duration` is not known at construction - `howl.duration()` returns `0` until the media loads.
The `load` event sets it, and until then the scrub bar renders **disabled** with a `0:00`
duration rather than a bar that looks draggable but silently does nothing.

### Scrubbing without fighting the clock

While a drag is in progress the rAF loop must not yank the thumb back to the playhead. The
component keeps a `scrubbing` flag:

- `onValueChange` (during drag) - store the pending value, set `scrubbing`, and render **that**
  value plus its time readout, so the elapsed time tracks the thumb under the finger.
- `onValueCommit` (drag released) - `howl.seek(value)`, clear `scrubbing`, and let the loop take
  over again.

Radix drives `onValueCommit` from keyboard as well as pointer, so arrow-key seeking gets the same
path for free.

### Accessibility

Canopy owns the whole UI here, so it owns all of this:

- Each transport button carries an `aria-label` **built from the same value it acts on**
  (`Skip back 10 seconds` for `skipBackSeconds={10}`), so a caller who changes the interval can
  never leave the label disagreeing with the behaviour - the failure mode a hardcoded string
  invites. The play/pause button's label flips with state (`Play` / `Pause`).
- The glyphs are `aria-hidden` inline SVGs, and the label lives on the button, never inside the
  hidden subtree (learning 30).
- The scrub bar is the `Slider` Seed with `aria-label="Seek"`, so Radix supplies
  `role="slider"` and the value/min/max ARIA. But `aria-valuenow` on a seek bar is a raw second
  count: a screen reader announces "one hundred forty two" for 2:22. So the component passes
  **`aria-valuetext` as the formatted time**, which is what assistive tech reads in preference to
  `aria-valuenow`.
- That requires the one Seed change in scope: `Slider` today copies `aria-label` and
  `aria-labelledby` from the Root onto the thumb (Radix forwards no native props to thumbs) but
  not `aria-valuetext`. Extend that existing single-thumb forwarding to carry `aria-valuetext`
  too - same mechanism, same single-thumb-only condition, same reasoning already written in that
  file. Additive, and it makes every future Canopy slider that maps to non-numeric values
  announceable.
- Per learning 32, keyboard operation is a first-class test: a test tabs to the controls and
  drives play, skip, and seek by keyboard alone.

### Two media caveats worth documenting (found while building)

Both are howler behaviours a consumer will hit and neither is obvious, so they belong in the README
rather than in a support conversation later:

- **The default Web Audio path needs CORS.** howler fetches the media by XHR to decode it, so a
  cross-origin source without `Access-Control-Allow-Origin` fails to load - silently, as far as the
  UI is concerned (duration stays `0:00` and the bar stays disabled). This surfaced immediately in
  the Storybook story, whose first sample host sent no CORS headers.
- **`html5` is the fix for both problems.** An HTML5 Audio element does not go through XHR, so it
  sidesteps CORS as well as the buffer-the-whole-file behaviour it is nominally there for. The
  `LongFileStreaming` story demonstrates the pairing.

The disabled-until-loaded bar is what keeps the CORS failure from reading as a broken component: the
controls visibly stay inert rather than looking operable and doing nothing.

### Naming

The component is `Audio`, parallel to `Video`. This shadows the DOM's global `Audio` constructor
inside any module that imports it. Accepted deliberately: the name is the one a consumer will
reach for, the parallel with `Video` is the whole point, and a module that imports Canopy's
`Audio` is not also calling `new Audio()`. `AudioPlayer` was considered and rejected as noise -
`Video` does not need a suffix either.

### Dependency

- `howler` (`^2.2.4`) in `@rogueoak/canopy` `dependencies` **and** tsup `external`, so the dynamic
  `import('howler')` stays a runtime import resolved at the consumer's install (the recipe every
  other lib follows).
- **`@types/howler` (`^2.2.13`) goes in `dependencies`, not `devDependencies`** - deliberate and
  worth stating. howler ships no bundled types (this is where it differs from video.js), and the
  public API exposes the `Howl` instance through `onReady` and `HowlOptions` through `options`,
  so the emitted `dist/*.d.ts` references those types. A consumer who only had them as a dev
  dependency of ours would get broken types. This is the standard treatment for a `@types`
  package that a library's public surface leaks.
- **Footprint:** howler is a single dependency-free file, roughly 10x lighter than video.js and
  with no transitive tree at all. The dependency cost is genuinely small; the lazy import is for
  SSR safety and initial-bundle hygiene rather than weight.

### Testing strategy (jsdom)

jsdom implements neither Web Audio nor real media playback, so per learning 39 the tests
**mock the `howler` module** and assert the mapping and behaviour **we own**, never howler's
internals:

- `howler` is loaded by **dynamic** import, and `Howl` is constructed with the options object we
  built from props (src normalised to an array, html5/loop/volume/autoplay/preload/format).
- `options` passthrough merges and an explicit prop **wins** over the same key in `options`, with
  a fixture whose two values are **distinct** so a swapped precedence fails (learning 29).
- Clicking play calls `howl.play()`; clicking again calls `pause()`; the button's label and glyph
  flip with state.
- Skip forward calls `seek(position + skipForwardSeconds)`; skip back calls
  `seek(position - skipBackSeconds)`, **clamped** to `[0, duration]` at both ends - the clamp is
  asserted at both bounds, not just described.
- Skip values are asserted with `skipBackSeconds` and `skipForwardSeconds` set to **different**
  numbers, so the two props cannot be silently transposed.
- The scrub bar commits a seek on `onValueCommit`, and a value change during a drag does **not**
  seek until commit.
- The position loop is cancelled on pause and on unmount.
- Unmount calls `howl.unload()`.
- `onReady` receives the instance; `onPlay` / `onPause` / `onEnd` fire on the howler events.
- Time formatting: `0:00`, `m:ss`, the `h:mm:ss` widening at the hour boundary, and a
  not-yet-loaded `NaN`/`0` duration.
- Keyboard: play, skip, and seek driven entirely by keyboard (learning 32).
- `aria-valuetext` on the thumb is the formatted time, and each button's `aria-label` reflects
  its configured interval.
- Caller `className` merges onto the wrapper; `ref` forwards.

## Acceptance

- [ ] `Audio` + its prop types exported from `@rogueoak/canopy/branches`.
- [ ] Play/pause toggles playback; the button's glyph and `aria-label` reflect the state.
- [ ] Skip back / skip forward seek by their configured intervals, independently settable,
      clamped to `[0, duration]` at both ends.
- [ ] The progress bar is scrubbable by pointer and by keyboard, seeks on commit, and does not
      fight the position loop mid-drag.
- [ ] Elapsed and total time render as `m:ss` (widening to `h:mm:ss` past an hour) and stay
      stable-width as the clock ticks.
- [ ] The bar is disabled until duration is known, rather than looking draggable and doing nothing.
- [ ] First-class props map to the correct howler options (asserted on the options object we
      build, not on howler internals); `options` passthrough merges; explicit props win for their
      keys (distinct-value fixture).
- [ ] Changing `src` rebuilds the player and resets position; changing an unrelated prop does not.
- [ ] Unmount unloads the `Howl` - no audio survives the component - and cancels the rAF loop.
- [ ] The rAF loop runs only while playing (asserted cancelled on pause).
- [ ] Fully keyboard operable; the scrub thumb announces `aria-valuetext` as formatted time;
      button labels are derived from the intervals they act on.
- [ ] `Slider` forwards `aria-valuetext` to the single thumb; existing `Slider` tests still pass
      and a new one covers the forwarding.
- [ ] **No new stylesheet and no new consumer wiring** - styled with full-literal semantic-token
      utilities the existing `@source` emits, and no `dark:` on the common path.
- [ ] `howler` in `dependencies` + tsup `external`; `@types/howler` in `dependencies`.
- [ ] Story `Branches/Audio`: Playground, custom skip intervals, autoplay-muted-style long-file
      (`html5`), a brand-override example, and a Dark example; reads correctly in both themes.
- [ ] Screenshots captured from the running Storybook in light and dark for developer review.
- [ ] README entry; living docs updated (features + architecture; a learning only if one
      generalises); CHANGELOG entry for the minor bump.
- [ ] Full `turbo` build + test + lint + format:check green across **every** package **and**
      `apps/storybook` (learning 38), before commit.

## Notes for the developer

Two things surfaced while writing this that are adjacent to the build, not part of it:

1. **Video never got a CHANGELOG entry.** Spec 0070 merged as #95, between the 1.0.0 release prep
   and the 1.2.0 entry, and no release note was written for it - `CHANGELOG.md` has no mention of
   `Video` at all. Worth folding into the same release note as `Audio` so the media components
   land together, but say the word either way.
2. **Version.** Packages are published in lockstep at a tag, so this is a `1.5.0` entry rather
   than a `package.json` edit.
