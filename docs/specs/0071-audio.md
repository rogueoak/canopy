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
  - `stream?: boolean` (default `false`) - stream rather than download in full before playing.
    The flag to set for long files, and named for the INTENT rather than the mechanism that
    implements it (howler's `html5`), so it stays meaningful whatever engine is behind it.
  - `skipBackSeconds?: number` (default `10`), `skipForwardSeconds?: number` (default `10`) -
    independent, per the developer's call, so a podcast consumer can run the usual back-15 /
    forward-30 without a new component.
  - `startAtSeconds?: number` - the position to begin at, for resuming an episode or deep-linking
    a timestamp. Applied once the media loads (seeking needs a duration to clamp against, and
    howler ignores a seek on an unloaded player) and clamped to the media's length. Deliberately a
    **starting** position, not a controlled one: a later change does not yank a listener who has
    since scrubbed elsewhere, but it does apply again when `src` changes, because a new source is a
    new start. Continuous control is what `onReady`'s handle is for.
  - `loadingLabel?: string` (default `'Loading audio'`), `errorLabel?: string` (default
    `'Could not load audio'`) - copy as defaulted props, per learning 34, so a consumer can reword
    or translate.
  - `onLoadError?: (error: AudioLoadError) => void` - the media failed to load. An `Error` carrying
    an engine-independent `reason` (`media` / `engine`), following the `SubscribeError` precedent.
    Named `onLoadError` rather than `onError` so the wrapper's native `onError` is left alone.
  - `onReady?: (audio: AudioHandle) => void` - fired once the media has loaded, with **Canopy's
    own** playback handle (`play` / `pause` / `stop` / `seek` / `getPosition` / `getDuration` /
    `setVolume` / `isPlaying`). See "The engine must not reach the public API" below.
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

- **Volume slider / mute toggle.** `volume` is settable as a prop and through the handle's
  `setVolume`, but there is no volume UI in v1. Deliberate: the developer scoped this build to
  play/pause, seek, and progress.
- **Playlists, playback-rate menu, waveform rendering, audio sprites, spatial audio, captions or
  transcripts, download and share buttons, media-session / lock-screen metadata.** Genuinely later
  features - and each one arrives as a first-class prop, NOT as a hole punched through to the
  engine (see below). This spec is the basic player; the props are shaped so each of these can
  arrive as an additive minor.
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

### The engine must not reach the public API

This spec originally copied Video's escape hatch: `onReady(player)` handing over the library
instance, plus a raw `options` passthrough. That is defensible for **Video** - video.js *is* the
UI, so its own API is the only way to reach the control bar it renders.

For a **headless** engine it is a mistake, and the reason is the same one that makes this component
different from Video in the first place. howler renders nothing, so nothing about it needs to be
visible to a consumer - but `onReady(howl)` and `options: HowlOptions` put it in the **published
API** anyway. Every consumer that reached through them would bind to howler, and swapping the
engine (for the native `HTMLMediaElement`, or anything else) would stop being an internal decision
and become a breaking change for them. Given howler's last release was 2023, that is a real risk to
have taken on by accident.

So the public surface is Canopy's own, and it is small enough to reimplement on anything:

- **`AudioHandle`** - `play` / `pause` / `stop` / `seek` / `getPosition` / `getDuration` /
  `setVolume` / `isPlaying`. Handed to `onReady`, stable for the component's lifetime, and reading
  the *current* player through a ref so it survives a source change rebuilding the engine
  underneath it. `seek` goes through the component's own clamping rather than straight at the
  engine, so the handle and the buttons cannot disagree.
- **`AudioLoadError`** - a real `Error` with an engine-independent `reason` (`media` / `engine`),
  the `message` + machine-reason pairing from `SubscribeError` (learning 34).
- **Props that name intent, not mechanism** - `stream`, not `html5`. The mechanism is howler's; the
  intent is the consumer's.
- **No raw-options passthrough at all.** Anything it would have enabled becomes a first-class prop
  when it is actually wanted. That is more work per feature and the right trade: a passthrough is
  an unbounded, unversioned commitment to whatever is behind it.

The translation between the two vocabularies lives in exactly one function (`buildOptions`), so
replacing the engine means rewriting that mapping plus the effect around it, and touching nothing a
consumer can see.

**Guarded, not merely intended.** A test asserts the **built** `dist/branches/index.d.ts` contains
no reference to howler. Against the artifact rather than the source, because a type can leak
through inference without ever being written down - which is exactly how it leaked the first time.
Comments are stripped before matching, so the doc comments may still name the engine while
explaining why it is not exposed. `test` depends on `build` in `turbo.json`, so the file is present
and current. Same shape as the `video.css` drift guard: state the invariant, then make it a build
failure.

A pleasant consequence: **`@types/howler` moves to `devDependencies`**. It was a runtime dependency
only because `Howl` / `HowlOptions` reached the emitted `.d.ts`; with nothing howler-shaped in the
published types, a consumer never needs them.

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

### Load states: fetching and failing must not look alike

Media arrives asynchronously and can fail, and a player that only distinguishes enabled from
disabled renders those two as the **same picture** - inert controls. A reader cannot tell a slow
network from a URL that will never load, and neither can the developer debugging it.

That is not a hypothetical for this component: the CORS caveat below fails exactly this way, and
it did so during the build, presenting as a player that looked merely slow forever.

So the component owns a four-state machine:

| State | When | What it shows |
|---|---|---|
| `idle` | `preload={false}`, nothing asked for yet | play live; pressing it starts the load |
| `loading` | the howler chunk, or the media, in flight | spinner in the play button, `aria-busy` |
| `ready` | duration known | every control live |
| `error` | `loaderror`, or the chunk import failed | controls inert, and the player **says so** |

Details that matter:

- **`aria-busy` on the wrapper.** The spinner is a purely visual signal; without this the loading
  state says nothing to a screen reader. The play button's accessible name becomes the loading
  label, so it describes what is happening rather than offering an action it cannot perform.
- **The loading play button keeps its primary fill.** Button's disabled treatment swaps in the
  `bg-disabled` pair, which bleaches the spinner into near-invisibility on the card - hiding the
  one element whose entire job is to say something is happening. `cursor-wait`, not
  `cursor-not-allowed`: this state resolves itself, it is not a refusal.
- **Unknown duration reads `--:--`, not `0:00`.** A zeroed total reads as a zero-length clip rather
  than an unanswered question, and it is precisely what a reader sees while a file loads or while a
  blocked one never will.
- **`playerror` is not the error state.** A refused playback (an autoplay policy, a decode hiccup)
  says nothing about whether the media is good, so it only clears the playing flag rather than
  declaring failure.
- **The chunk import is guarded too.** A failed dynamic `import('howler')` would otherwise reject
  unhandled in the consumer's app while the player rendered as a normal but permanently inert
  control group.

### Two media caveats worth documenting (found while building)

Both are howler behaviours a consumer will hit and neither is obvious, so they belong in the README
rather than in a support conversation later:

- **The default Web Audio path needs CORS.** howler fetches the media by XHR to decode it, so a
  cross-origin source without `Access-Control-Allow-Origin` fails to load - silently, as far as the
  UI is concerned (duration stays `0:00` and the bar stays disabled). This surfaced immediately in
  the Storybook story, whose first sample host sent no CORS headers.
- **`stream` is the fix for both problems.** A streamed element does not go through XHR, so it
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
- **`@types/howler` (`^2.2.13`) is a `devDependency`.** howler ships no bundled types (where it
  differs from video.js), so they are needed to BUILD - but not to consume, because nothing
  howler-shaped reaches the published `.d.ts` (see "The engine must not reach the public API").
  Had the escape hatch stayed as `onReady(howl)` / `options: HowlOptions`, this would have had to
  be a runtime dependency; that it does not is a useful signal the boundary is real.
- **Footprint:** howler is a single dependency-free file, roughly 10x lighter than video.js and
  with no transitive tree at all. The dependency cost is genuinely small; the lazy import is for
  SSR safety and initial-bundle hygiene rather than weight.
- **Build-vs-buy, stated rather than assumed.** Every capability in this spec's In-scope list is
  reachable from the native `HTMLMediaElement` - including a real `timeupdate` event, which would
  delete the `requestAnimationFrame` loop this spec calls the easy mistake. What howler buys is the
  Web Audio path, format fallback, sprites, fades, and pooling, and most of that sits in the Out
  list today. howler was the developer's explicit choice, and it is a defensible one for a
  component expected to grow (rate control, fades, and multi-clip work are where a raw `<audio>`
  starts costing), but the trade is worth naming.
  It is not free to reverse: `Howl` and `HowlOptions` are part of the published `AudioProps`, so
  swapping engines later is a **breaking major**. If that risk is unwanted, the exit is to stop
  exposing howler's types - replace `onReady(howl)` and the `options` passthrough with a
  Canopy-owned surface - and that is cheaper to do now than after consumers depend on them.
- **Upstream maintenance (worth knowing).** `howler@2.2.4` is the current latest and was published
  **2023-09-19** - no release in nearly three years, in a design system's runtime `dependencies`.
  The library is small, dependency-free, and feature-stable, so quiet is not the same as abandoned,
  and the lack of a transitive tree keeps the supply-chain surface near zero. But it means no
  upstream fix should be assumed: a browser-behaviour regression would need a patch from us. Recorded
  here rather than treated as a blocker, since the security persona is disabled in this repo and the
  dependency accounting is this spec's job in its place.

### Testing strategy (jsdom)

jsdom implements neither Web Audio nor real media playback, so per learning 39 the tests
**mock the `howler` module** and assert the mapping and behaviour **we own**, never howler's
internals:

- `howler` is loaded by **dynamic** import, and `Howl` is constructed with the options object we
  built from props (src normalised to an array, stream->html5, loop/volume/autoplay/preload/format).
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
- [ ] Loading and failure are visibly **different** states, not both "disabled": a spinner and
      `aria-busy` while fetching, an announced message and inert controls on failure.
- [ ] An unknown duration reads `--:--`, never `0:00`.
- [ ] `preload={false}` starts idle with a live play button, and pressing it raises the spinner.
- [ ] A failed chunk import is caught, not left as an unhandled rejection.
- [ ] `startAtSeconds` begins at the requested position, clamped to the media, applied on load and
      again on a source change - and a later change does not re-seek a listener.
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
- [ ] `howler` in `dependencies` + tsup `external`; `@types/howler` in `devDependencies`.
- [ ] Story `Branches/Audio`: Playground, custom skip intervals, autoplay-muted-style long-file
      (`stream`), a brand-override example, and a Dark example; reads correctly in both themes.
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
