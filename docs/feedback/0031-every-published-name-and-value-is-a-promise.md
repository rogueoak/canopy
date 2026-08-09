# 0031 - Every published name and value is a promise, and it has to be kept

## Symptom

Four findings on `AudioRecorder`'s published surface, all caught in review before 1.5.0 tagged, all
of which would have been a breaking change a day later.

1. **A sibling contradicted.** `Audio` (0071) deliberately named its error callback `onLoadError`
   "rather than `onError` to leave the native `onError` handler on the wrapper alone".
   `AudioRecorder` named its own `onError` and `Omit`ted the native one. A consumer wiring both had
   to remember that one media Branch answers this question one way and its twin answers it the
   other, for no reason they can see from the outside.
2. **A name that was not this component's to take.** `RecordingError` was the only unnamespaced
   error type in a flat 29-component barrel where every other one is owner-named - `AudioLoadError`,
   `SubscribeError`. "Recording" is a word a `VideoRecorder` or a screen recorder wants, and it
   would have found it taken by an audio-only error whose `reason` union is audio-specific.
3. **A documented value that could never arrive.** `AudioRecordingError.reason` documents
   `'unsupported'`. The mount effect sets the `unsupported` **status** before anything can be
   pressed, and the record handler returned early for that status - so the line that produced
   `reason: 'unsupported'` was unreachable. Deleting it left every test green. A consumer branching
   on a value the component cannot emit is writing dead code against a false API.
4. **A type with no way to obtain a value of it.** `AudioRecorderStatus` was exported from the
   barrel, but no prop, callback, or handle method ever handed a consumer one. That is a
   compatibility commitment bought for nothing: it pins the seven-member union, so adding an eighth
   state internally becomes a published change.

## Root cause

The first two are the cost of writing a component in isolation: each decision was locally
reasonable (learning 15 does say the component's own meaning wins over a native handler of the same
name), and neither was checked against the component published one release earlier that answers the
identical question. Nothing in the build compares siblings.

The last two share a different cause: **the published surface was written from the inside out.** A
`reason` union was enumerated because those are the four ways recording can fail, and a status type
was exported because it is the component's state. Neither was walked back through the API to check
a consumer can actually reach it - which is the only thing that makes it real.

## Fix

- `onError` -> **`onRecordingError`**, mirroring `onLoadError`: the error the component is *about*,
  namespaced by what failed. The `Omit<..., 'onError'>` on the props disappears with it, so the
  native handler is passed through again. `Audio`'s doc comment now names the convention so the
  next media Branch does not re-litigate it.
- `RecordingError` -> **`AudioRecordingError`**.
- The `unsupported` status no longer short-circuits the record handler. It falls through to the
  support probe, which sets the state and emits the documented error, so `handle.start()` in that
  state produces a reason instead of silence. Both remaining untested reasons (`unsupported`,
  `engine`) now have tests, and the `engine` one asserts the stream is released - deleting that
  line ships a live microphone after a failed start.
- **`getStatus()`** joins the handle. It is what a consumer driving from its own chrome actually
  wants alongside `isRecording()`, and it makes the exported type reachable.

`AudioStatus` on `Audio` has the same dead-surface problem and is **not** fixed here - it is a
different component's API and out of this PR's scope, but it is unreleased too, so it is still free
to settle.

## Learning

**Before publishing a name, read the sibling that already answered the question.** Anything in the
same family - two media components, two form components, two overlays - shares a consumer, and that
consumer sees the *set*, not each component's local reasoning. Where a precedent exists, follow it
or change both; where you deliberately diverge, say so in a comment on *both* sides so the next
component does not have to re-derive it.

**Namespace the name by its owner, not by its subject.** `RecordingError` describes what happened;
`AudioRecordingError` says whose it is. In a flat barrel the generic name is a land grab against
every future component that shares the concept, and the cheapest moment to fix it is before the
first publish - after that it is a deprecated alias plus a major bump.

**A published value must be reachable, and a published type must be obtainable.** Two mechanical
checks, both worth running over any API before it ships:

- for every member of a documented union, name the input that produces it - and write the test that
  does. If you cannot, either make it reachable or delete it from the union.
- for every exported type, name the prop, callback, or method that hands a consumer a value of it.
  If there is none, either drop it from the barrel or add the accessor - do not export it "for
  completeness".
