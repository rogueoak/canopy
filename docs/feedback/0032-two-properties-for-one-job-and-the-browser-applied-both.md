# 0032 - Two properties for one job, and the browser applied both

## Symptom

Reported from a product built on Canopy, about opening a photograph on a phone:

> When I click on an image in a post, it opens a dialog half off the screen on mobile and then it
> recenters. It seems like all dialogs are doing this.

Both halves of that are exactly right, including the second one. Every `Dialog`, `AlertDialog`,
`CommandDialog` and desktop `ResponsiveDialog` in the system opened offset by a full 100% of its own
size - up and to the left - held there for the length of the animation, and snapped into place the
moment it ended.

Measured on a 390px viewport, with the utilities and keyframes lifted verbatim from a consumer's
built CSS:

| | left | top | width |
| --- | --- | --- | --- |
| while animating | -187 | 226 | 374 |
| settled | 0 | 322 | 390 |

## Root cause

`DialogContent` centres itself the ordinary way:

```
fixed left-1/2 top-1/2 ... -translate-x-1/2 -translate-y-1/2 data-[state=open]:animate-dialog-content-in
```

and `dialog-content-in` repeated that centring inside the keyframes:

```css
from { opacity: 0; transform: translate(-50%, -50%) scale(0.96); }
```

Repeating it is the older recipe, and under an engine that compiles `-translate-x-1/2` to
`transform` it is not just harmless but necessary: the running animation replaces the utility's
`transform` outright, so a keyframe that forgot the translate would knock the dialog off centre for
as long as it ran.

**Tailwind v4 compiles those utilities to the individual `translate` property.** `translate` and
`transform` are separate properties that compose - the browser applies `translate`, then `rotate`,
then `scale`, then `transform` - so nothing replaced anything. The centring was applied twice while
the animation ran and once after it, and the "recentring" the reporter saw was not a correction: it
was `transform` reverting to `none` when a non-filling animation ended, leaving the one translate
that was ever meant to be there.

The interesting part is where the defect lived. Each of the three files is defensible on its own:
the utility classes are the documented way to centre a fixed element, the keyframes are a faithful
copy of a widely used recipe, and Tailwind's change is a deliberate improvement that makes transform
channels independently animatable. **The bug was in the join, and reading any single file - which is
what a component test, a lint rule and a review diff each do - finds nothing.**

It survived every release since Dialog shipped, and a Storybook that renders these components on
every commit, because
the failure lasts exactly as long as the animation and then removes its own evidence. A screenshot
taken after the transition is correct. A human sees a flicker and files it under "animation".

## Fix

`dialog-content-in` / `-out` animate the individual `scale` and `opacity` properties and never
`transform`:

```css
from { opacity: 0; scale: 0.96; }
```

`scale` composes with `translate` instead of replacing it, so the content holds its position for the
whole animation whatever the consumer centres it with. Verified in a browser against the same
harness that measured the defect: during the animation the box is now at left 8, width 374 on a
390px viewport - the 0.96 scale about the centre, which is the motion the keyframe was always for.

The other keyframes in the partial are untouched and correct: `drawer-*`, `bottom-sheet-*`, `shake`
and `pop-*` all animate `transform` on elements that are anchored by `inset` utilities and carry no
`translate` of their own, so there is nothing for them to compose with.

`canopy/src/branches/dialogMotion.test.tsx` is the guard, and it deliberately spans both packages:
it renders each centred overlay, reads the `animate-*` utilities off the rendered element, resolves
each one to its keyframes **through roots' own `--animate-*` declaration**, and asserts that no
keyframes reached that way write `transform` while the element centres itself with `translate`. It
reads the built `dist/tailwind-preset.css` through the package's `exports` map - the file a consumer
actually gets - rather than the source partial it is folded from.

Both directions were mutated to check the guard is load-bearing. Putting the `transform` back fails
it; renaming the component's class to an `animate-*` utility roots does not declare fails it too,
with `roots declares no --animate-dialog-content-inn`.

## Learning

**A defect can live in the join between two correct files, and every tool we own reads one file at a
time.** Component tests render the component. Lint reads the source. CSS is not read at all. When a
component's classes and a stylesheet's keyframes both address the same visual channel, that pairing
is an interface with nothing checking it, and it needs a test that holds both ends at once - not a
better test of either end.

**When a framework moves a property, audit what used to depend on it being one property.** Tailwind
v4 splitting `transform` into `translate` / `rotate` / `scale` is strictly better, and it silently
converted every "restate the transform inside the keyframes" workaround from necessary into a bug.
The upgrade note reads as a feature; the search worth running afterwards is for the workarounds the
old behaviour justified.

**Motion that ends by removing its own evidence needs measuring, not watching.** The settled state
was always correct, so every static check, screenshot and code review passed. Two
`getBoundingClientRect()` calls - one during the animation, one after - found it in a minute, and
the same two calls are what proved the fix. Anything that only misbehaves mid-transition is only
found by sampling mid-transition.
