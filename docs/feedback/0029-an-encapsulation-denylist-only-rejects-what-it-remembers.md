# 0029 - An encapsulation guard written as a denylist only rejects what it remembers

## Symptom

Spec 0071 introduced the swappability guard: a test reads the **built**
`dist/branches/index.d.ts` and asserts the playback engine is not named in it. 0072 copied the
shape for the recorder, listing seven platform names - `MediaRecorder`, `MediaRecorderOptions`,
`MediaStream`, `MediaStreamTrack`, `BlobEvent`, `AudioContext`, `AnalyserNode`.

It passed honestly, and it would have gone on passing through the exact leaks it exists to prevent:

- 0072's own **Out** section defers device selection, gain, and noise suppression as "a first-class
  prop later". The natural way to write those is `constraints?: MediaTrackConstraints`, a `deviceId`
  from a `MediaDeviceInfo`, a `ConstrainDouble`. None is in the list. The engine would enter the
  published API with the guard green.
- The barrel it reads is **already not engine-free**. `Video` publishes
  `type VideoJsOptions = NonNullable<Parameters<VideoJsFactory>[1]>` - a raw video.js options
  passthrough, inferred straight off the library's own signature - and `dist/branches/index.d.ts`
  opens with `import * as video_js from 'video.js'`. The thing 0071 exists to prevent is sitting in
  the same artifact the guard reads, and neither `Audio`'s list nor `AudioRecorder`'s catches it.

## Root cause

A denylist encodes what the author happened to think of on the day. The invariant is "**nothing but
Canopy's own vocabulary is published**", which is a statement about the *whole* surface; a list of
banned names is a statement about seven strings. The two only agree while someone keeps adding to
the list, and nothing prompts them to - the guard is green either way, so the failure mode is
silence.

There is a second, quieter problem: two files (`Audio.test.tsx`, `AudioRecorder.test.tsx`) each
kept their own copy, so even the names that *were* known were not shared.

## Fix

`AudioRecorder`'s guard is inverted. It extracts this component's declarations out of the built
`.d.ts` - comments stripped, whitespace normalised - and pins them against a **committed snapshot**
in the test. Every new type reference in the published surface is now a reviewed diff rather than a
name someone remembered to ban, and the snapshot subsumes the presence half of learning 57: a
dropped type fails the extraction rather than passing vacuously.

The scope was kept to the component this PR owns. Two things are **not** done here:

- **The barrel-wide version.** The same inversion applied to the whole of
  `dist/branches/index.d.ts` would be the real guard - it would catch the `Video` leak and every
  future one, in one place, instead of once per component that remembers to write a test. That is a
  cross-cutting change to 29 Branches' published surface, with a large first snapshot to review,
  and it wants its own spec.
- **The `Video` leak itself.** `VideoJsOptions` and `VideoPlayer` are deliberate escape hatches
  documented in spec 0070, decided *before* 0071 set the encapsulation rule. Removing them is a
  breaking change to an API published since 1.0.0, so it is a major-version decision, not a
  drive-by fix in an AudioRecorder PR. What is worth recording is that Canopy currently answers the
  same question two ways: `Video` publishes the engine, `Audio` and `AudioRecorder` refuse to.

## Learning

**Guard the invariant, not the counterexamples you can name.** An allowlist or a snapshot fails
closed on something new; a denylist fails open. Reach for the denylist only when the surface being
guarded is unbounded and the banned set is genuinely small and stable - and note that "the set of
type names a browser API can leak" is neither.

The tell that you have written the wrong one: ask what a *future, reasonable* change to this code
would add, and check whether the guard would catch it. Here the answer was written down in the same
spec's deferred-work list, one page above the test.
