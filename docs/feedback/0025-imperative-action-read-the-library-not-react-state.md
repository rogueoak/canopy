# 0025 - An imperative action must read the library, not React state

## Symptom

`Audio`'s play/pause button decided what to do by reading its own `playing` state:

```tsx
if (playing) howl.pause();
else howl.play();
```

Pressing play twice in quick succession called `play()` twice, and howler allocated a **second
sound** - two copies of the same clip playing over each other, with only one of them reachable by
the pause button.

## Root cause

howler sets its internal playing flag **synchronously** but emits the `play` **event**
asynchronously: a `setTimeout(..., 0)` on the Web Audio path, and the `node.play()` promise on the
`html5` path - which is hundreds of milliseconds while a stream buffers. `html5` is exactly what
the README tells podcast consumers to set, so the window is widest for the most likely consumer.

React state is only updated by that event, so through the whole window the state says "not
playing" while the player is already playing. The component asked the wrong source.

The deeper mistake was a *reasonable-sounding* rule applied to the wrong side of the seam. The
original comment read "driven by the state that howler's own events set, so the button and the
player can never disagree" - which is right for **rendering** (the glyph and the label must come
from state, or they cannot re-render) and wrong for **acting**.

## Fix

Branch on `howl.playing()` - the library's own synchronous truth - and keep the `playing` state for
display only. A test now clicks play twice with a mock that reproduces howler's async emit; it
fails against the old code.

The mock had to change too: it originally emitted `play` synchronously, which made the bug
invisible. A mock that is *tidier* than the real library tests a library that does not exist.

## Learning

**When a third-party instance owns a piece of state, read it from the instance to ACT and from
React to RENDER.** React state is a lagging copy - it exists to trigger re-renders, and any event
that populates it may arrive a frame or a network round-trip late. An imperative call decided from
that copy will sometimes be decided from the past, and for a stateful library that means a
duplicate resource rather than a no-op.

The tell is a handler that reads state it does not itself set. And the corollary for tests: **a
mock must reproduce the real library's asynchrony, not just its API.** A synchronous stand-in for
an async emit quietly deletes the entire class of bug that lives in the gap.
