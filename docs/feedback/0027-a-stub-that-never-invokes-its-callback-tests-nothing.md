# 0027 - A stub that records but never invokes leaves the code under it untested

## Symptom

`Audio`'s position loop had five tests and looked well covered. It was not. The
`requestAnimationFrame` stub returned a handle and **never called the callback**, so the loop body -
the code that reads the player's position and re-arms the next frame - never executed in any test.
Deleting the entire body would have shipped green.

A second, quieter version of the same problem: the "does not seek until the scrub commits" promise
was tested only through the keyboard, and Radix commits on the same keydown that changes the value.
Change and commit are indistinguishable on that path, so adding a seek to the *change* handler also
shipped green - the exact regression the test was named after.

A third: `expect(frame.cancel).not.toHaveBeenCalled()` passed whether the loop had been correctly
kept alive **or had never started at all**.

## Root cause

The stub was written to make the loop *safe* in tests (an unstubbed rAF recurses forever), and
stopping there was mistaken for testing it. Recording a call proves the code asked for a frame; it
proves nothing about what the frame does.

The commit-vs-change gap has the same shape: the cheapest input path was chosen, and it happened to
be the one path that cannot distinguish the two behaviours.

## Fix

The stub now **records each scheduled callback** and the suite steps frames explicitly, so tests
assert that the tick reads the player's position, re-arms, and stops re-arming after a pause. The
scrub test now drives a real pointer drag, which required two jsdom workarounds worth knowing:
jsdom has no `PointerEvent` (so `fireEvent.pointerDown` silently drops `clientX` and Radix computes
`NaN` - a drag that does nothing), and no Pointer Capture API or layout, so the track's rect and
capture methods must be stubbed. Vacuous negatives were replaced with positive assertions
(`loopIsRunning()`).

## Learning

**A test double must be steppable, not just countable.** If a stub stands in for something that
*calls back* - `requestAnimationFrame`, an observer, a subscription, a timer - recording the
registration only tests that you registered. Capture the callback and invoke it, or the code inside
it is untested no matter how many assertions surround it.

Two companions:

- **Prefer the input path that can distinguish the behaviours under test**, not the one that is
  easiest to drive. If change-then-commit is the promise, the test needs an input where change and
  commit are separate events.
- **Assert the positive.** "X was not cancelled" also passes when X never started; "X is still
  running" does not.
