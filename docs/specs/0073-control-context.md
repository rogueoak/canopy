# 0073 - Controls that know what surface they are on

## Problem

Canopy's control fills are absolute, but the surface underneath them is not. Drop a control onto a
raised surface and it computes its fill from a canvas it is no longer sitting on. Two bugs found in
the `Audio` review (feedback 0026), both dark-only, both measured rather than eyeballed:

**A control reads as a hole.** `Slider`'s thumb is `bg-surface` (`stone.900`, `#322e28`). On a
`bg-surface-raised` card (`stone.800`, `#423d34`) it is **darker than the thing it sits on**, so the
player's primary affordance looks like a gap punched in the card rather than a control resting on
it. Fifteen components paint a control with `bg-surface`.

**A disabled control disappears.** `disabled` resolves to `stone.800` in dark - which is *exactly*
`surface-raised`. A disabled `Button` on a card is a **1.00:1** fill against its own background: an
outline button becomes an empty ring, and its glyph sits at 1.82:1. Eight components use that fill.

Both are the same mistake in different clothes: a token that means "one step up from the canvas"
is being read on something that is not the canvas.

Learning 20/21 and feedback 0026 already describe the shape of this. What they prescribe is that the
*composing* component re-points its Seeds' defaults, which is what `Audio` does by hand. That works
and does not scale: it is invisible when forgotten, it only shows in dark, and every future
component on a raised surface repeats it.

**Who it's for:** anyone building a Canopy component that sits on a card, a sheet, a popover, or any
other raised surface - which, as the library grows, is most of them.

## Outcome

- **A control's fill follows the surface it is on**, with no per-component work. `bg-control` on a
  page canvas resolves as it always has; the same class inside a raised surface resolves one step
  further up. Nothing to remember, nothing to forget.
- **`surface-raised` becomes a context, not just a colour.** A component declares "I am a raised
  surface" once and every Canopy control inside it corrects itself.
- **Disabled has one language.** Every control dims. It works on any surface by construction,
  because it is relative to whatever is behind it rather than to a fixed colour.
- **`Audio`'s hand-written corrections are deleted**, because the thing they worked around is fixed.

## Scope

### In

- **Roots**: a `control` semantic token (the fill of a control's own body) with a raised counterpart,
  and a `preset-surface.css` partial folded into the built preset, exactly as `preset-motion.css`
  already is, carrying a `surface-raised` **utility** that paints the surface and re-points the
  control vars for everything inside it.
- **Canopy**: switch every genuine control fill from `bg-surface` to `bg-control`; switch the eight
  fill-based disabled treatments to dimming; make `Card` and `Audio` use the `surface-raised`
  utility; delete `Audio`'s manual overrides.
- **Learning 18 is revised, not deleted.** It records the field/toggle disabled split as
  deliberate. That split is the direct cause of the second bug, so the learning has to say what is
  true now and why the earlier reasoning did not survive contact with a raised surface.
- Tests: token guards for the new rungs, and a guard that a control fill and its surface are never
  the same value in either theme.

### Out

- **Panel backgrounds.** `SideNav`, `TopNav`, and `Menubar` paint `bg-surface` as a *surface*, not
  as a control. They keep it. The distinction is the whole point: `control` is the thing you touch,
  `surface` is the thing it rests on.
- **A general nesting model.** `surface-raised` inside `surface-raised` does not step twice. Canopy
  has no two-deep raised surface today, and a ladder that keeps climbing runs out of ramp.
- **Removing `disabled` / `disabled-foreground` from Roots.** They stop being the component default
  but stay in the token set: a consumer may still want a fill-based disabled, and deleting a
  published token is a breaking change with no benefit here.

## Approach

### The mechanism: a var that means "on the current surface"

`--color-control` is declared at `:root` alongside every other runtime token, pointing at the value
a control should take on the page canvas. The `surface-raised` utility re-points it for its own
subtree:

```css
@utility surface-raised {
  background-color: var(--color-surface-raised);
  --color-control: var(--color-control-raised);
}
```

Because `bg-control` emits `background-color: var(--color-control)`, resolution is contextual for
free: the same class means different things in different places, which is exactly what "one step up
from whatever is behind you" needs. No component reads a prop, no context provider, no variant.

It ships from a **preset partial** rather than the generated token output because a `@utility` is
not a token, and Tailwind's `@source` scanner can never emit a rule no component's class string
contains. `preset-motion.css` established that seam for keyframes; this is the same case.

### The values

Light does not change: a control on a white card stays white and reads by its border. Dark steps.

| token | base context | raised context |
|---|---|---|
| `control` (light) | `base.white` | `base.white` |
| `control` (dark) | `stone.900` | `stone.700` |

`stone.700` is the same rung `muted-raised` already occupies, which is the point: the raised ladder
was half-built, and this finishes it rather than inventing a parallel one.

### Disabled: one language, and why the old rule broke

Learning 18 split disabled treatment by control kind: fields swap to a `disabled` fill (they are
empty, so there is no fill worth preserving), checkable toggles dim (so a checked fill survives).
That reasoning is sound in isolation and it is what broke. A fill is an absolute colour, so it can
collide with the surface behind it, and on a raised card it collides *exactly*. Dimming cannot: it
is a transform of whatever the control already renders, so it degrades proportionally on any
background, including ones that do not exist yet.

So every control dims:

```
disabled:opacity-50 disabled:cursor-not-allowed
```

This is a visible change to every disabled field in the library: a disabled `Input` becomes a faded
input rather than a grey slab. That is the trade, taken deliberately - one language that cannot be
wrong beats two that are each right about half the time.

One deliberate exception, and it proves the rule rather than breaking it: `Audio`'s play button is
`disabled` while the media loads, and dimming would bleach the spinner that is the whole point of
that state. It opts out with `disabled:opacity-100`, which now reads as an explicit override of a
known default rather than as one of two competing conventions.

### Guarding it

The bug was invisible because nothing compared a control's fill to its surface. A test now resolves
both contexts in both themes and asserts a control fill is never equal to the surface it sits on -
the assertion that would have caught `#423d34` on `#423d34` the day it shipped.

## Acceptance

- [ ] `--color-control` exists in both themes, with a raised counterpart.
- [ ] The `surface-raised` utility paints the surface and re-points `--color-control`, and ships
      from the built preset.
- [ ] Every genuine control fill uses `bg-control`; panel backgrounds still use `bg-surface`.
- [ ] A `Slider` thumb on a raised card is lighter than the card in dark.
- [ ] Every control dims when disabled; no component swaps to `bg-disabled`.
- [ ] A disabled control on a raised card is distinguishable from the card.
- [ ] `Audio` no longer carries manual raised-surface corrections, and its loading button still
      shows a full-strength spinner.
- [ ] A test asserts control fill != surface in both contexts and both themes.
- [ ] Learning 18 is revised to state the single language and why the split did not hold.
- [ ] Full `turbo` build + test + lint + format:check green across every package and the Storybook
      app, and the result is looked at in both themes rather than only asserted.
