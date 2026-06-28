# 0005 - tailwind-merge dropped the `text-label` role (role vs colour collision)

Source: self-caught while building Label (spec 0007) - the first Seed to pair a typography
role with a text colour on one element. Surfaced the same way the danger-hover bug did
(feedback 0004): the first real consumer of a recipe seam exposes a gap the Foundations
stories can't.

## Symptom

Label is styled `text-label font-medium text-text`, but it rendered **without its font-size** - 
the `text-label` role silently vanished before reaching the DOM.

## Root cause

The Roots typography **roles** (`text-display`, `text-h1…h4`, `text-body`, `text-label`,
`text-caption`, `text-code`) are composite `text-*` utilities that set font-size / line-height /
font-weight - a different CSS axis from colour. In the browser a role and a colour coexist
fine. But `tailwind-merge` doesn't know these custom values, so it buckets `text-label` into its
`text-color` group; when `cn('text-label … text-text')` runs, it treats the two as conflicting
and keeps only the last - dropping the role. Button never hit this (it never pairs a role with a
colour on one element); Label is the first.

## Fix

`packages/canopy/src/lib/cn.ts` now builds its merger with `extendTailwindMerge`, registering
every Roots typography role in the **`font-size`** class group. A role and a colour become
orthogonal again: a Seed can carry both, and a caller can still override either axis
independently (`className="text-danger"` swaps the colour and keeps the role; `text-h2` swaps the
role and keeps the colour). Fixed once in the shared `cn()`, so every Seed inherits it.

## Learning

Rolled into `overview/learnings.md`: **when a design-token namespace overloads a Tailwind prefix
(`text-`, `bg-`, …) with values tailwind-merge can't infer, teach the merge - don't work around
it per component.** And, again: the first component to exercise a recipe seam is its real
acceptance test (cf. feedback 0004).
