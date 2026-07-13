# 0015 - Tests must pin every shipped variant and every acceptance property

## Symptom

Spec 0033 shipped five new `animate-*` presets (`pop-in/out`, `shake`, `fade-in/out`) but the
first test pass only asserted the `-in` halves and `shake`, leaving `pop-out` / `fade-out`
unverified - a regression dropping either would have stayed green. Separately, the spec's own
Acceptance listed "the fold stays idempotent (no double-append)" as a deliverable, yet no test
enforced it: the idempotency lived only in `build.mjs`'s prose, so a regression to the old
append-in-place bug (feedback 0003) would have doubled every keyframe while every `toContain`
assertion still passed. Two personas (tester, engineer) independently flagged both gaps on PR #45.

## Root cause

The tests asserted the *representative* case, not the *contract*. When a change ships a set of
variants, testing one member reads as "covered" but only pins that member. And an acceptance
bullet that names a property (idempotency) is a promise; if no test encodes it, the promise is
enforced by comment, which rots silently - the exact failure mode of a `toContain` assertion that
can't see a duplicate.

## Fix

- Assert BOTH halves of every preset pair and that each `--animate-*` value *composes* its tokens
  (`var(--duration-*)` / `var(--ease-*)`), not merely that it is present - looping over the full
  variant list rather than hand-picking one.
- Add an occurrence-count guard (`split(needle).length - 1 === 1`) for a keyframe and an
  `--animate-*` in the folded preset, turning the idempotency acceptance item into a real test.

## Learning

**Test at the granularity the spec promises.** For a set of shipped variants, assert *every*
member, not a representative one - a per-variant loop beats a hand-picked sample. For any property
an acceptance item names (idempotency, ordering, single-occurrence), write the test that *fails*
if it regresses; a `toContain` that passes on both the correct and the doubled output is not
coverage. This is the second coverage-gap review in a row (see
[`0014-interactive-component-test-coverage.md`](0014-interactive-component-test-coverage.md)):
the recurring root is testing the happy representative instead of the whole contract.
