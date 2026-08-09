# 0072 - AudioRecorder

## Problem

Canopy can play sound (`Audio`, spec 0071) and cannot capture any. A consumer who wants a voice
note, a spoken comment, a dictated form field, or an audio reply has to reach for raw
`MediaRecorder`, which means owning a permission prompt, a `MediaStream` whose tracks keep the
browser's recording indicator lit until something stops them, a codec matrix where Safari and
Chrome disagree, and a level meter drawn from scratch. There is no on-brand way to record sound in
a Canopy page, and every consumer that builds one builds the same four bugs.

**Who it's for:** any Canopy consumer capturing audio from a person - voice notes, audio comments,
accessibility alternatives to typing, and the family-story recorder that prompted this
(`famlistry` spec 0022).

The visible half matters as much as the plumbing. Someone pressing record needs to see that the
microphone is hearing them before they start talking, or they record two minutes into a muted
input and find out afterwards.

## Outcome

`import { AudioRecorder } from '@rogueoak/canopy/branches'` renders a recorder that:

- Captures audio with **one obvious control**: record, then stop. A live **waveform** shows input
  level while it runs, so a dead microphone is visible in the first second rather than at playback.
- Hands the consumer a **`Blob` and a duration** when recording ends, and knows nothing about what
  happens next - no upload, no URL, no transport.
- Is built from **Canopy's own Seeds** and semantic-token utilities, so it reads correctly in
  **light and dark** and re-themes under a consumer brand override with no per-app work.
- Asks for the microphone **when record is pressed**, not on mount, and handles refusal with a
  recoverable state rather than a dead button.
- **Releases the microphone** on stop and on unmount, so the browser's recording indicator goes out
  when the component says it has.
- Is **operable by keyboard** end to end and announces its state - recording, stopped, elapsed time
  - to a screen reader, for which the waveform is decoration.
- Works in **Chrome, Safari, and Firefox**, picking a container each supports rather than assuming
  WebM.

Ships in Canopy **1.5.0**, alongside the `Audio` Branch already merged for 0071.

## Scope

### In

- **`AudioRecorder`** Branch - a single component. Ships on `@rogueoak/canopy/branches`.
- **Props (lean, no engine passthrough):**
  - `onComplete?: (recording: AudioRecording) => void` - the recording finished. `AudioRecording`
    is `{ blob: Blob; mimeType: string; durationMs: number }`. Canopy's own type; nothing
    `MediaRecorder`-shaped.
  - `onStart?: () => void`, `onStop?: () => void`, `onCancel?: () => void`.
  - `onError?: (error: RecordingError) => void` - a real `Error` carrying an engine-independent
    `reason` (`permission` / `unsupported` / `device` / `engine`), following the `SubscribeError`
    and `AudioLoadError` precedent.
  - `onReady?: (recorder: AudioRecorderHandle) => void` - Canopy's own handle
    (`start` / `stop` / `cancel` / `isRecording` / `getDurationMs`), so a consumer can drive the
    recorder from its own chrome.
  - `maxDurationSeconds?: number` (default `600`) - stops automatically and completes normally.
  - `mimeTypes?: string[]` - the container preference order, defaulting to
    `['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm']`, first supported wins.
  - `showWaveform?: boolean` (default `true`), `barCount?: number` (default `48`).
  - `startLabel?`, `stopLabel?`, `cancelLabel?`, `recordingLabel?`, `permissionDeniedLabel?`,
    `unsupportedLabel?` - copy as defaulted props, per the "copy as defaulted props" learning, so a
    consumer can reword or translate.
  - `className` / `style` / native div props merged via `cn()` onto the wrapper.
- **Layout (developer's call): centred row.** The record/stop control is visually dominant
  (`primary`, `icon` size), the waveform fills the space beside it, and the elapsed time sits at
  the trailing edge in tabular figures. Cancel appears only while recording, as a `ghost` icon
  button.
- **Live waveform** - `AnalyserNode` time-domain data rendered as token-styled bars.
- **Elapsed time** - `m:ss`, measured by the component rather than read from the blob.
- **States** - idle, requesting permission, recording, stopping, permission denied, unsupported,
  device error. Each has copy and none is a spinner that never resolves.
- Tests (`AudioRecorder.test.tsx`), Storybook story (`Branches/AudioRecorder`), README entry,
  living-docs update, CHANGELOG entry.

### Out

- **Playback of the result.** `Audio` (0071) already does that, and the consumer composes the two.
  Building a second player into this component would be two players to keep in step.
- **Upload, storage, and URLs.** The component hands back a `Blob`. Per the "a shipped component
  must not bake in a consumer's transport" learning, the thing that knows where audio goes is the
  application, not the design system.
- **Pause and resume.** `MediaRecorder` supports it; the scoped build is record and stop. It
  arrives as an additive minor when something wants it.
- **Trimming, noise suppression beyond the browser's own constraints, gain control, and
  device selection.** Each is a first-class prop later, not a hole punched through to the engine.
- **Video capture.** A different component with a different permission story.
- **Transcription.** Not a design-system concern.
- **A shipped stylesheet.** Like `Audio` and unlike `Video`, Canopy renders every element here, so
  there is nothing to skin and no new consumer wiring.

## Approach

### Tier: this is a Branch

It owns a browser engine instance (`MediaRecorder`, a `MediaStream`, an `AudioContext`) and its
lifecycle, and it owns real interaction state (recording, elapsed, level). Per the "a component's
tier is its interaction class, not the component it resembles" learning, that is a Branch on both
counts, the same as `Audio` and `Video`. It ships on `./branches`.

### No third-party dependency, and still no engine in the public API

`MediaRecorder` and `AnalyserNode` are platform APIs, so unlike `Audio` there is no library to add.
That removes the supply-chain question and does **not** remove the encapsulation one: a
`onReady(mediaRecorder)` or a raw `MediaRecorderOptions` passthrough would put the platform's
vocabulary in Canopy's published API, and every consumer reaching through it would bind to a
browser API whose support matrix is still moving.

So the same rule as 0071 applies. `AudioRecorderHandle` and `RecordingError` are Canopy's own,
small enough to reimplement on anything, and the translation between vocabularies lives in one
place. The build-artifact guard from 0071 extends to this component: a test asserts the built
`dist/branches/index.d.ts` contains no `MediaRecorder`-typed surface, checked against the artifact
rather than the source, because a type leaks through inference without ever being written down.

### Permission is requested on press, and refusal is a state

`getUserMedia` on mount fires a browser permission prompt at someone who has not asked to record
anything, which is alarming and is usually denied by reflex - and a denied microphone cannot be
re-prompted from inside the page. So the call happens in the record handler.

Refusal renders the `permissionDenied` state: the copy explains that the browser is blocking the
microphone and that it is changed in the site settings, with the control disabled rather than
hidden. Hiding it leaves someone staring at a component that has vanished. The component does not
attempt to name a browser or draw a menu path, because that copy is wrong within a release and it
is the consumer's to write if they want it.

### Releasing the stream is the `unload()` of this component

An un-stopped `MediaStreamTrack` keeps the browser's recording indicator lit and the microphone
open **after the component is gone**, with nothing visible to switch it off. That is worse than the
orphaned-`Howl` case in 0071, because it is a privacy signal rather than a noise.

Every exit path stops every track: stop, cancel, `maxDurationSeconds`, an error mid-recording, and
unmount. The `AudioContext` is closed with it. A test asserts each path, including unmount while
recording.

### Container selection, because Safari does not do WebM

`MediaRecorder.isTypeSupported` is walked over `mimeTypes` in order and the first supported entry
wins: Opus in WebM where it exists, `audio/mp4` on Safari. If none is supported the component
renders the `unsupported` state rather than throwing. The chosen type comes back on the
`AudioRecording`, because a consumer storing the blob needs to know what it is holding and cannot
infer it.

### Duration is measured, not read

A WebM blob from `MediaRecorder` routinely carries no duration in its metadata - it is a live
stream with no known end - so `new Audio(url).duration` returns `Infinity` often enough to be a bug
rather than an edge case. The component times the recording itself from a monotonic clock, excludes
nothing, and reports `durationMs`. Consumers that need a duration get a correct one without
re-deriving it from a blob that does not have it.

### The waveform is DOM bars, not a canvas

An `AnalyserNode` feeds `getByteTimeDomainData` into a fixed number of bars whose heights are set
each frame. Bars are ordinary elements carrying full-literal semantic-token utility strings, so
they theme like everything else and the consumer's existing Tailwind `@source` already emits their
classes.

A canvas would be cheaper at high bar counts and would need the token values read back out of
computed styles at runtime, then re-read on a theme change - which is how a component ends up with
a waveform that stays light-mode blue after the page goes dark. Forty-eight elements updated at
roughly 30fps is comfortably within budget, and it keeps the component inside the "components ship
class names" rule.

**The loop runs only while recording.** It starts on `start`, stops on `stop`, `cancel`, error, and
unmount, exactly as `Audio`'s position loop does, and for the same reason: an always-on
`requestAnimationFrame` on an idle recorder burns a frame callback forever on a page that embeds
three of them. A test asserts the loop is cancelled.

**Reduced motion reduces it rather than removing it.** The waveform carries information - the
microphone is hearing you - so deleting it under `prefers-reduced-motion` would remove the one
signal that a muted input is muted. The bars collapse to a single smoothed level meter with a
slower update instead.

### Accessibility: the waveform is decoration, the timer is the information

- The waveform wrapper is `aria-hidden`, with nothing focusable or labelled inside it. Per the
  "`aria-hidden` hides the whole subtree" learning, no `sr-only` text is nested within it.
- The control is one button whose accessible name changes with state (`startLabel` then
  `stopLabel`), rather than two buttons swapping places under the pointer.
- A polite live region announces the transitions and the elapsed time, throttled to roughly every
  ten seconds while recording. Announcing every second turns a screen reader into a metronome.
- Escape cancels while recording, discarding the take. Space and Enter operate the control.
- Focus stays on the control across the state change, so a keyboard user is not dropped to the
  document.

### Testing without asserting the browser's internals

`MediaRecorder`, `getUserMedia`, and `AudioContext` do not exist in jsdom. Per the "do not assert a
third-party library's browser internals in jsdom" learning, the tests drive a **steppable** fake -
one that can be advanced through data events, a stop, an error, and a permission rejection on
demand - and assert Canopy's own mapping: the states rendered, the handle's behaviour, the
`RecordingError.reason` produced, the tracks stopped, and the loop cancelled. Real capture in
Chrome, Safari, and Firefox is verified by hand against the Storybook story and recorded in the
acceptance list, because no amount of jsdom proves a codec works.

### Release

Canopy **1.5.0**, a minor: additive component, no breaking change. It is the release that first
publishes `Audio` as well, which merged after 1.4.0 and has been unreleased since.

## Acceptance

- [ ] `AudioRecorder` exports from `@rogueoak/canopy/branches` and renders with no props.
- [ ] Pressing record requests the microphone at that moment, and not on mount.
- [ ] Recording then stopping calls `onComplete` with a non-empty `Blob`, its `mimeType`, and a
      `durationMs` within tolerance of the real elapsed time.
- [ ] The reported `mimeType` is one the browser supports, chosen from `mimeTypes` in order.
- [ ] With no supported container, the unsupported state renders and nothing throws.
- [ ] A denied permission renders the permission-denied state, calls `onError` with
      `reason: 'permission'`, and leaves the control disabled rather than hidden.
- [ ] A device error mid-recording calls `onError` with `reason: 'device'` and stops cleanly.
- [ ] Every `MediaStreamTrack` is stopped on stop, on cancel, on `maxDurationSeconds`, on error, and
      on unmount while recording.
- [ ] The `AudioContext` is closed on each of those paths.
- [ ] `maxDurationSeconds` stops the recording and completes normally rather than erroring.
- [ ] Cancel discards the take: `onCancel` fires and `onComplete` does not.
- [ ] The waveform animates in response to input level while recording, verified in flight rather
      than at rest.
- [ ] The animation loop is cancelled on stop, cancel, error, and unmount.
- [ ] Under `prefers-reduced-motion` the bars collapse to a single level meter that still responds
      to input.
- [ ] The waveform subtree is `aria-hidden` and contains nothing focusable and no `sr-only` text.
- [ ] The control's accessible name changes between idle and recording, and focus stays on it
      across the change.
- [ ] A live region announces start, stop, and elapsed time, throttled rather than per second.
- [ ] Escape cancels while recording; Space and Enter operate the control.
- [ ] `onReady` hands over a handle whose `start`, `stop`, `cancel`, `isRecording`, and
      `getDurationMs` all agree with the rendered state.
- [ ] The built `dist/branches/index.d.ts` contains no `MediaRecorder`-typed public surface.
- [ ] Light and dark both render correctly, and a brand override re-themes the waveform with no
      per-app work.
- [ ] Real recording verified by hand in Chrome, Safari, and Firefox, and on iOS Safari.
- [ ] A recording made here plays back in `Audio` without conversion.
- [ ] Storybook story, README entry, living-docs update, and CHANGELOG entry all present.
- [ ] The full turbo build gates green before release, Storybook app included.
