# 0028 - A control that blocks itself must not take the `disabled` attribute

## Symptom

`AudioRecorder` shipped with the record/stop control carrying `disabled` in four states -
`requesting`, `stopping`, `permission-denied`, `unsupported`. The spec required "focus stays on the
control across the state change, so a keyboard user is not dropped to the document", and the
acceptance item was ticked against a passing test.

The shipped behaviour was the opposite. A keyboard user pressing Space got: the control disables
while the permission prompt is open, focus lands on `<body>`, the control re-enables with focus
gone, and the next Space scrolls the page instead of stopping the take. Twice per take - once on
the way in through `requesting`, once on the way out through `stopping`. After the first take
`getUserMedia` resolves in a few milliseconds with no prompt at all, so all the reader sees is the
lost focus.

Two more findings on the same control, from the same review, have the same root:

- In `permission-denied` and `unsupported` the control fell through to `Button`'s default disabled
  treatment, `bg-disabled`. In dark, `--color-disabled` and `--color-surface-raised` are both
  `stone.800`. **1.0:1.** The control did not read as disabled; it read as a hole in the card, and
  the spec's requirement for a refused microphone is "the control disabled rather than hidden".
- The failure message under it is `text-caption text-danger` on the same card: **3.42:1** in dark,
  at 12px, where AA wants 4.5. That paragraph is the only thing a reader whose microphone was
  refused has to go on.
- And nothing about the **recording** state changed colour at all. Idle and recording were the same
  `primary` filled circle; the only difference on the control was the glyph swapping from a circle
  to a square at 16px. The waveform went `border` to `primary`, but `primary` is already the
  control's colour, so "recording" read as *more of the same green* - and with
  `showWaveform={false}`, a shipped story, that 16px glyph was the entire signal that a microphone
  is open.

## Root cause

**The behavioural half.** HTML's `disabled` does two things at once: it says "not actuatable" and
it removes the element from the focus order. When the element is *already focused*, browsers run
the unfocusing steps and focus falls to the document. jsdom does not - `document.activeElement` is
unchanged before and after - so a jsdom test can only ever prove the environment's behaviour, never
the browser's. The test was not weak; it was structurally incapable of failing.

The compounding factor is *which* states took the attribute. All four are entered **by pressing
that very control**, so the element losing focus is always the one the reader is standing on. A
disabled submit button somewhere else on the page has no such problem.

**The contrast half.** Both colour findings are the shape feedback 0026 recorded: a component that
opts into `surface-raised` inherits every token its Seeds define *relative to the background*. 0026
listed three symptoms - hover fills, ring offsets, and the disabled fill. This component handled
the first two correctly and missed the third, because `Audio` never had to fix it: `Audio`'s play
button is only ever disabled while loading, where it keeps the primary fill.

Nothing in the build could have caught either. `AA_PAIRS` in `contrast.mjs` guards
`danger-foreground` **on** `danger`, never `danger` as a foreground on a surface, and never
`disabled` against anything (deliberately - WCAG 1.4.3 exempts disabled controls, which is about
*text* contrast on a control, not about a control vanishing into its card).

## Fix

**Focus.** The control never takes the `disabled` attribute in any state. It carries
`aria-disabled` (plus `aria-busy` while `requesting` / `stopping`) and the handlers ignore the
activation - which the re-entry guards on `statusRef` were already doing, so nothing new had to be
written to make the press safe. The element stays focusable, assistive tech still hears
"unavailable", and focus stays where the reader put it.

The test asserts the **cause**, since jsdom cannot show the blur: the control is never
`toBeDisabled()` in any state. That fails on the shipped code and passes on the fix.

A side effect worth having: React does not dispatch `onClick` to a disabled `<button>`, so several
"pressing again does nothing" tests were previously satisfied by the attribute rather than by the
guard they named. Deleting the guard left them green. With `aria-disabled` the click arrives and
the guard is what stops it, so those tests now test something.

**Contrast, in this component.** The blocked control dims its own primary fill
(`opacity-50`) instead of flattening to `bg-disabled` - 2.06:1 against the card in dark rather than
1.0:1, visible and still obviously not pressable. The failure message is `text-text` (9.90:1 dark /
13.49:1 light) marked with a `text-danger` alert glyph, where the 3:1 non-text floor applies and
`danger` passes in both themes. That also stops the failure being signalled by colour alone.

**The recording state.** A small `bg-danger` dot in the control row while a take is live - the
system's own role for "this matters", 3.42:1 against the card in dark and 8.17:1 in light, above
the 3:1 floor that applies to a non-text indicator in both. It survives `showWaveform={false}`,
needs no change to the control, and does not overload `destructive`, which in this component is
what *cancel* does. Its slot is reserved at rest, so nothing in the row reflows when recording
starts. The clock brightens from `text-text-muted` to `text-text` at the same moment - by colour,
not by size, so it cannot reflow either.

## Learning

**`disabled` is a focus decision, not only a styling one - and in jsdom it is invisible.** Before
putting the attribute on a control, ask whether that control is the one the reader is standing on.
If the state is entered by pressing it, the attribute will drop their focus to the document in
every real browser and no jsdom test will ever say so. `aria-disabled` plus an ignored activation
says the same thing to assistive tech and keeps the element in the focus order.

And when a test's environment cannot exhibit the failure, **assert the cause instead of the
effect**. "The control is never disabled" is checkable in jsdom; "focus did not move" is not.

**A state with a privacy or safety cost needs a signal beyond a glyph swap.** Two states drawn in
the same role colour, differing only by the shape inside a 16px icon, are not distinguishable at a
glance - and "am I being recorded?" is not a question to answer at a glance incorrectly. Check the
signal survives the component's own options: here `showWaveform={false}` removed everything except
the glyph, and it is a shipped story.

**The durable half of the colour findings is at the token layer, not here.** Two gaps, both
recorded for a Roots change rather than patched per component:

1. There is **no raised-surface disabled fill**. Every Branch on a card will hit this, and each one
   will invent its own dimming.
2. `danger` as a **foreground on a surface** is unguarded and fails on the card in dark.
   `danger-300` measures 5.44:1 on `bg`, 4.28:1 on `surface`, 3.42:1 on `surface-raised` - it
   degrades exactly as you climb the elevation, which is learnings 20/21/49 again. `Audio` ships
   the same `text-caption text-danger` on the same card, so it is already wrong in two places.

The obvious fix - add `['color-danger', 'color-surface-raised', 4.5]` to `AA_PAIRS` and move dark
`danger` to `danger-200` - is **not** a component-PR change. Dark `danger-hover` is already
`danger-200`, so the base would collide with its own hover state, which is precisely the bug
feedback 0004 recorded; the whole dark danger ramp has to move together. And a new `AA_PAIRS` entry
is a gate every consumer brand must then pass, so `buildBrand` would start failing brands that are
legal today. That is a Roots spec with its own approval, not a line in an AudioRecorder PR.
