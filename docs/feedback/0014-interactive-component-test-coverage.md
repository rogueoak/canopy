# 0014 - Interactive component shipped with keyboard + controlled paths untested

## Symptom

The first `Combobox` test suite (18 tests) was strong on the happy path - open, filter,
single-select, multi-select chips, Backspace-removes-last, disabled, aria-invalid, roles - but the
tester persona found two spec-mandated behaviours with **zero** coverage: (1) keyboard operation
(arrow / enter / escape), asserted only via `user.click`, and (2) **controlled** mode - every test
was uncontrolled, so the `isControlled` branch in `emit`/`selected` was never exercised even
though all six Storybook stories drive the component with a controlled `value`.

## Root cause

The tests were written against the *observable happy path* a mouse user sees, not against the
*distinct code paths* the component actually has. Keyboard navigation and controlled-vs-uncontrolled
state are each a separate branch with its own failure mode, but they are invisible if you only
click and only pass `defaultValue`. The acceptance checklist listed both ("arrow/enter/escape
navigation works"; controlled usage), yet the suite mapped acceptance items to the easiest
interaction that superficially satisfied them.

## Fix

Added tests for keyboard commit/close (ArrowDown + Enter commits the active option; Escape closes)
and for controlled mode (the trigger display is driven by the `value` prop and updates on rerender;
`onValueChange` fires on pick without the display changing until the parent updates `value`), plus
the Backspace non-empty-search boundary. Coverage now exercises both the keyboard and controlled
branches that ship in the public API.

## Learning

**For any interactive component, treat keyboard operation and controlled mode as first-class,
explicitly-tested acceptance criteria - not as things the happy-path mouse test covers by
implication.** They are separate code branches with separate failure modes. When a component
supports both controlled and uncontrolled use, test **both**; when it's operable by keyboard,
drive it by keyboard in at least one test (not just `click`). Bake these two cases into the test
plan for every Seed/Twig/Branch that takes user interaction. Feeds `overview/learnings.md`.
