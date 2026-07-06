# 0012 - An `aria-hidden` wrapper prunes an `sr-only` label to nobody

## Symptom

`BreadcrumbEllipsis` (spec 0029) rendered a `<span role="presentation" aria-hidden="true">` holding
a decorative dots SVG **and** an `sr-only` "More" label. The intent (spec + JSDoc) was that the
truncation stay "describable" to assistive tech. But `aria-hidden="true"` on the wrapper prunes the
**entire subtree** from the accessibility tree, so the "More" label reached nobody: hidden from
sighted users by `sr-only`, and hidden from assistive tech by the ancestor `aria-hidden`. Dead
markup that looked correct. The shipped test asserted only `toHaveClass('sr-only')` - pure
scaffolding that stayed green whether or not the label was reachable, so it masked the bug. Flagged
in review by both the engineer (minor) and tester (major) personas.

## Root cause

Two independent mistakes compounded. (1) Conflating "decorative glyph" with "decorative element":
the dots *icon* is decorative, but the ellipsis *as a whole* is meaningful (it signals collapsed
crumbs), so hiding the whole wrapper was wrong - only the icon should be `aria-hidden`. The pattern
was copied from `BreadcrumbSeparator`, which genuinely is fully decorative, without re-checking that
the ellipsis carries meaning the separator doesn't. (2) The test asserted the label's **scaffolding**
(an `sr-only` class exists) instead of its **observable outcome** (the label is actually reachable) -
so it could not catch an unreachable label.

## Fix

- Component: drop `aria-hidden`/`role="presentation"` from the `BreadcrumbEllipsis` wrapper; keep
  `aria-hidden` on the dots SVG only. The wrapper stays in the accessibility tree, so its `sr-only`
  "More" label is announced.
- Test: assert the real a11y outcome - the SVG is `aria-hidden`, the wrapper is **not**, and the
  "More" label has no `aria-hidden` ancestor (`label.closest('[aria-hidden="true"]')` is null).
- Also (tester minor): the `BreadcrumbSeparator` override-children test now re-asserts
  `role="presentation"` + `aria-hidden` on the custom-glyph path, so a caller's "/" can never leak
  into the accessible name via a regression on that branch.

## Learning

`aria-hidden="true"` hides the **whole subtree**, so an `sr-only` label placed inside an
`aria-hidden` element is invisible to *everyone* - a contradiction that reads as "accessible" but
announces nothing. `sr-only` (hide visually, keep for AT) and `aria-hidden` (hide from AT, keep
visually) are opposites and must never nest with the label on the inside. And when a component has a
decorative glyph inside a **meaningful** element (an ellipsis that means "collapsed items"), hide
only the glyph, not the element. Generalises past this change - it feeds `overview/learnings.md`.
