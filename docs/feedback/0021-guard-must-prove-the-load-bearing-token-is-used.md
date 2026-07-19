# 0021 - A validity guard must also prove the load-bearing value is present

## Symptom

The Video skin's brand-override guarantee (spec 0070) was guarded by a test that
checked **every** `var(--color-*)` reference in `video.css` *is* a semantic role
token (no hex, no `.dark`, no primitive ramp). That is necessary but not
sufficient: a skin that accented every control with `--color-surface` /
`--color-text` and never referenced `--color-primary` would pass the guard in
full, yet a consumer's brand `--color-primary` override would be **invisible** on
the player - the exact guarantee the acceptance item exists to protect. Caught by
the tester persona on PR #95 (major).

## Root cause

The guard validated the *shape* of what was used ("all references are roles") but
not the *presence* of the one reference the feature depends on (the brand accent
role actually driving a control). "All X are valid" says nothing about "the
important X is there."

## Fix

Add an assertion that the skin genuinely references the accent role:
`expect(refs).toContain('primary')`. So the brand-override guarantee is proven by
both halves - only overridable roles are used **and** the accent role is
actually used.

## Learning

When a guard asserts a *validity* property over a set ("every var is a role",
"every export is prefixed", "no forbidden value appears"), it can pass on a
degenerate set that satisfies the rule vacuously while dropping the load-bearing
member. Pair the "all are valid" assertion with a "the essential one is present /
used" assertion - the token that makes the feature work must be shown to be
*there*, not merely shown to be *allowed*. Sibling of the existing "test every
shipped variant, not a representative sample" learning: this is its dual - don't
let a whole-set validity check stand in for proving the specific element the
promise hinges on. Generalises, so it feeds `overview/learnings.md`.
