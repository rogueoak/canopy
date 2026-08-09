# 0030 - A mount-scoped flag that only the cleanup set, and the states no test ever rendered

## Symptom

`AudioRecorder` kept an `unmountedRef` so that a microphone granted **after** the component went
away is still stopped - the async race where nothing is left on the page to switch the recording
indicator off. The cleanup set it to `true`. Nothing ever set it back:

```tsx
React.useEffect(
  () => () => {
    unmountedRef.current = true;
    releaseCapture();
  },
  [releaseCapture],
);
```

React 19 `<StrictMode>` runs setup, cleanup, setup on mount - a remount of the same instance - so
the second setup began with the flag already latched. Under StrictMode the component **could never
record at all**: `getUserMedia` resolved, the post-`await` guard saw `unmountedRef.current === true`,
stopped the tracks it had just been granted, and returned silently, leaving the status pinned at
`requesting`. A disabled control with a `cursor-wait` spinner that never resolves - exactly the
failure the spec rules out ("none is a spinner that never resolves").

`reactStrictMode` is on by default in Next.js, which is where consumers live. The component was
broken for most of them, and all 74 tests were green.

Reviewed in the same pass, and the same shape of blindness: **two of the seven shipped states were
never rendered under any assertion.** The `pressRecord` / `pressStop` helpers awaited straight
through `requesting` and `stopping`. Three deliberate regressions shipped green - changing the
`requestingLabel` default to any other string, deleting the busy Spinner outright, and dropping
`stopping` from the disabled condition so a second press could land on a take still finalising.

## Root cause

**The flag.** `unmountedRef` records a fact about the *current mount*: "this instance is gone". A
fact scoped to a mount has to be **established by the setup that owns it**, not merely torn down by
its cleanup. Written cleanup-only, the ref quietly became component-lifetime state, and the first
cleanup poisoned every mount after it. Remount is not exotic - StrictMode does it on every mount in
development, and any parent that toggles a key does it in production.

**The states.** Both missing states are *transient*, and the test helpers were written for the
outcome rather than for the journey: `await pressRecord()` is one line, and it steps over the state
it passes through. A helper that spans a state is a helper that hides it.

The two findings share a cause worth naming: **every render in the suite was a plain one**. A whole
class of defect - anything that does not survive a remount - had no test that could see it, and no
amount of care inside the existing tests would have changed that.

## Fix

The setup re-establishes what it owns:

```tsx
React.useEffect(() => {
  unmountedRef.current = false;
  return () => {
    unmountedRef.current = true;
    releaseCapture();
  };
}, [releaseCapture]);
```

The suite gained a `<StrictMode>` block that drives a full take end to end and asserts a recorder
was actually constructed - the tell for this bug is `getUserMedia = 1`, `MediaRecorder instances =
0` - plus a StrictMode unmount that still releases the microphone. Both fail on the shipped code.

`requesting` and `stopping` are now rendered under assertions of their own, driven from a deferred
`getUserMedia` promise for the first and from the gap between `stop()` and the engine's `onstop`
for the second: the waiting label, the `aria-hidden` Spinner (whose own `role="status"` must not
compete with the live region), `aria-busy`, and the fact that discard is not offered while a take
is finalising.

## Learning

**A ref that a cleanup writes must be initialised by the setup that pairs with it.** The rule is
mechanical: if `return () => { ref.current = X }` appears in an effect, the effect body needs
`ref.current = <the other value>` above it, or the ref is not mount-scoped at all - it is
component-lifetime state with a one-way door. Deps do not help; the cleanup runs on every re-run.

**Render at least one test inside `<StrictMode>`.** A suite where every render is plain is blind to
the entire class of "does not survive a remount", which is the class React itself is trying to
surface. One StrictMode test that drives the component's main flow end to end is enough to catch
it, and it costs three lines. This is worth doing for any component that holds refs across an
`await`, subscribes, or owns an engine instance.

**A helper that awaits through a state deletes that state from the suite.** When a component
enumerates its states, check each one is *rendered* somewhere under an assertion, not merely passed
through. The transient ones - the ones a helper crosses in a single `await` - are exactly the ones
that hold spinners, busy attributes and re-entry guards, and they are the states a reader is most
likely to be looking at when something goes wrong.
