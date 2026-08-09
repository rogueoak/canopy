# 0026 - A component that opts into a raised surface must re-point its Seeds' defaults

## Symptom

`Audio` renders its controls on a card (`bg-surface-raised`). In dark, hovering a skip button made
it **darker than the card** - the control visibly sank into a recess instead of lifting. Measured:
a hovered button computed `rgb(50,46,40)` sitting on `rgb(66,61,52)`.

The same mismatch showed up twice more on the same card: the focus ring drew a page-coloured
(near-black) halo, and the disabled fill resolved to the *same colour as the card*, leaving a
disabled skip button as an empty ring.

## Root cause

Seeds are tuned for the **page canvas**. `Button`'s `hover:bg-muted` is "one step up from `bg-bg`",
and its `focus-visible:ring-offset-ring-offset` matches the page background. Both are correct
defaults - on the page.

Learnings 20 and 21 already say a raised surface is its own design context and needs
`muted-raised` for its highlights. What was missing is the consequence for a **composing
component**: dropping a Seed onto `surface-raised` does not re-point those defaults. The Seed keeps
computing "one step up" from a canvas it is no longer on, and on a raised surface that step goes
the wrong way.

So the bug is not in `Button`. It is in the component that changed the surface underneath it and
did not say so.

## Fix

`Audio`'s skip buttons carry the surface-relative corrections explicitly:
`hover:bg-muted-raised active:bg-muted-raised focus-visible:ring-offset-surface-raised`.

One detail worth recording, because it is silent: the ring-offset override **must carry the
`focus-visible:` prefix**. `Button`'s own token is `focus-visible:ring-offset-ring-offset`, and
tailwind-merge keys on variant + property, so a bare `ring-offset-surface-raised` is a *different*
key - it sits alongside the original rather than replacing it, and loses at exactly the moment it
is needed. The override looked applied and did nothing.

## Learning

**Changing the surface is a change the composing component owns, not the Seed.** A component that
puts Seeds on `surface-raised` (or any non-canvas surface) inherits responsibility for every
surface-relative token those Seeds carry: interaction fills, ring offsets, and disabled fills. The
Seed cannot know where it was dropped.

The check is mechanical: after setting a surface, list the Seeds inside it and ask which of their
tokens are defined *relative to the background* - then re-point each one. And when overriding a
Seed's token, **match its variant prefix exactly**, or tailwind-merge treats the override as an
unrelated utility and both survive.
