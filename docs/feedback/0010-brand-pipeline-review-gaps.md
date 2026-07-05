# 0010 - Brand pipeline review gaps: an ignored option value and an unguarded copy-paste

Surfaced in the persona review of the brand theming API (spec 0028, PR #37). One major
(engineer + architect both flagged it) plus a few minors. All are general API / test traps, not
brand-specific quirks.

## (a) A public API option ignored its own value

### Symptom

`buildBrand({ scope })` documented `scope: "sunset"` -> a `.sunset` / `.sunset.dark` selector. But
the selector class was derived from `slugify(name)`, and `scope` was used only as a truthy flag. So
`buildBrand({ name: "My Brand", scope: "acme" })` silently emitted `.my-brand` / `.my-brand.dark`
(and returned those in `selectors`), not `.acme`. The shipped test masked it because the example
brand passed the SAME string for `name` and `scope` ("sunset"), so the wrong source read correct.

### Root cause

Two parameters happened to carry the same value in the only test that exercised the path, so a
parameter being ignored was invisible. The code read `name` where it should have read `scope`.

### Fix

Derive the scoped class from `scope` (slugified), independent of `name`; `name` still names the dark
format + sidecars. Test the scoped path with a `scope` that DIFFERS from `name` so the option's value
is actually proven to drive the selector.

## (b) A copy-pasted dark theme shipped green

### Symptom

A brand whose `semantic.dark.json` is a copy of its light `semantic.json` passed every check - full
role coverage, and AA holds (the light palette is legible) - yet renders the LIGHT palette in dark
mode. The core `tokens.test.ts` guards this exact copy-paste (dark must differ from light, feedback
0004); the brand pipeline had no equivalent, so a consumer's copy-paste slip would ship silently.

### Fix

`checkBrandCss` now reports any role whose resolved dark value equals its resolved light value
(allowlisting `color-accent-foreground`, the one deliberately theme-invariant role - a near-black
foreground that reads on the accent fill in both themes, exactly as the core guard allows), and
`buildBrand` throws on it. A test builds a brand with dark == light and asserts the build fails.

## (c) Smaller gaps

- `buildBrand` wrote `brand.css` to disk BEFORE validating, so a failed build left the invalid file
  behind - against the "a broken brand can't ship" contract. Now it validates first and writes only
  on success (`css` was already in memory).
- The AA-failure negative test asserted `/WCAG AA/`, which the aggregated error always contains
  (it fronts missing-role failures too), so it didn't prove the AA branch fired. Tightened to
  `/AA failures/`.
- The `roots-brand` CLI had zero coverage despite being an acceptance item. Added a test that runs it
  end to end (config-relative paths + `--out` override + the summary line) and asserts a bad config
  path exits non-zero.

## (d) Contract to document (architect, minor)

The required-role set is derived from Canopy's shipped `dist/tokens.css`, so ADDING a semantic role
to Canopy makes every existing consumer brand's `buildBrand` fail until they map it. This is
intentional (a build-time failure, never a silent illegible ship), but it means a role addition is
effectively breaking for the brand API - documented as such in `architecture.md` + the roots README.

## Learning

When a public API option carries a value (not just a flag), make the code CONSUME that value, and
test it with a value DISTINCT from any sibling parameter - two params sharing a value in the only
fixture hides one being ignored. And a pipeline that emits an artifact whose whole purpose is to be
validated must validate BEFORE it writes, so a failed run leaves nothing shippable behind. Finally,
when a new pipeline re-implements a guarantee the core already guards (here: dark must differ from
light), port that guard too - don't assume the new surface inherits it.
